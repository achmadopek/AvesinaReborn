const db = require('../../db/connection-lokal');

// Refactored generatePotonganPegawai
exports.generateTHP = async (req, res) => {
  try {
    const periode = req.query.periode?.trim();

    const rawEmployeeSts = req.query.employee_sts?.trim();
    const employee_sts = rawEmployeeSts === "" || rawEmployeeSts === "Semua" ? null : rawEmployeeSts;

    if (!periode) {
      return res.status(400).json({ message: 'Periode wajib diisi' });
    }

    const periodeDate = `${periode}-01`;
    const conn = db.promise();

    // Ambil pegawai sesuai status (kalau ada filter)
    let sqlPegawai = `
      SELECT p.id AS peg_id, p.employee_nm, p.employee_sts 
      FROM pegawai p 
      JOIN sdm_mutasi m ON m.peg_id = p.id
    `;
    const params = [];
    if (employee_sts) {
      sqlPegawai += ` WHERE p.employee_sts = ?`;
      params.push(employee_sts);
    }

    const [pegawai] = await conn.query(sqlPegawai, params);
    if (pegawai.length === 0) return res.json([]);

    // Ambil total penghasilan terkunci
    const [penghasilan] = await conn.query(
      `SELECT peg_id, SUM(nilai) AS total_penghasilan
       FROM thp_penghasilan_pegawai
       WHERE periode = ? AND is_locked = 1
       GROUP BY peg_id`,
      [periodeDate]
    );

    const penghasilanMap = penghasilan.reduce((acc, row) => {
      acc[row.peg_id] = row.total_penghasilan || 0;
      return acc;
    }, {});

    // Ambil total potongan terkunci
    const [potongan] = await conn.query(
      `SELECT peg_id, SUM(nilai) AS total_potongan
       FROM thp_potongan_pegawai
       WHERE periode = ? AND is_locked = 1
       GROUP BY peg_id`,
      [periodeDate]
    );

    const potonganMap = potongan.reduce((acc, row) => {
      acc[row.peg_id] = row.total_potongan || 0;
      return acc;
    }, {});

    // Bentuk hasil THP
    const hasil = pegawai.map(p => {
      const totalPenghasilan = penghasilanMap[p.peg_id] || 0;
      const totalPotongan = potonganMap[p.peg_id] || 0;
      return {
        peg_id: p.peg_id,
        employee_nm: p.employee_nm,
        periode: periodeDate,
        total_penghasilan: totalPenghasilan,
        total_potongan: totalPotongan,
        thp: totalPenghasilan - totalPotongan
      };
    });

    res.json(hasil);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal generate THP' });
  }
};

// Ambil History THP
exports.getHistoryTHP = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    // Ambil semua data THP milik pegawai ini
   const [rows] = await conn.query(
    `SELECT 
      thp.peg_id,
      p.employee_nm,
      thp.periode,
      thp.total_penghasilan,
      thp.total_potongan,
      thp.thp
    FROM thp_take_home_pay thp
    LEFT JOIN pegawai p ON p.id = thp.peg_id
    WHERE thp.peg_id = ?
    ORDER BY thp.periode DESC`,
    [peg_id]
  );

    res.json(rows);
  } catch (err) {
    console.error('Gagal ambil history THP:', err);
    res.status(500).json({ message: 'Gagal ambil history THP', error: err });
  }
};

// controllers/takeHomePay.js
exports.getDetailTHP = async (req, res) => {
  try {
    const { peg_id, periode } = req.query;
    
    if (!peg_id || !periode) {
      return res.status(400).json({ message: 'Peg ID dan Periode wajib diisi' });
    }

    const conn = db.promise();

    // Query paralel biar cepat
    const [penghasilanRows, potonganRows] = await Promise.all([
      conn.query(
        `SELECT kp.penghasilan_code, pg.nilai
          from thp_penghasilan_pegawai pg
            join thp_komponen_penghasilan kp on kp.id = pg.penghasilan_id 
            where pg.periode = ?
            and pg.peg_id = ?`,
        [periode, peg_id]
      ),
      conn.query(
        `SELECT kp.potongan_code, pg.nilai
          from thp_potongan_pegawai pg
            join thp_komponen_potongan kp on kp.id = pg.potongan_id 
            where pg.periode = ?
            and pg.peg_id = ?`,
        [periode, peg_id]
      )
    ]);

    res.json({
      penghasilan: penghasilanRows[0],
      potongan: potonganRows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal ambil detail THP' });
  }
};


/**
 * Simpan data potongan hasil generate (THP).
 * - Buat revisi baru setiap kali simpan.
 * - Gunakan transaksi biar konsisten.
 */
exports.saveGenerated = async (req, res) => {
  const data = req.body; // array of { peg_id, periode, total_penghasilan, total_potongan, thp }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Data kosong / tidak valid" });
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    for (const item of data) {
      // Ambil revisi terakhir
      const [last] = await conn.query(
        `SELECT revision_no
         FROM thp_take_home_pay
         WHERE peg_id = ? AND periode = ?
         ORDER BY revision_no DESC
         LIMIT 1`,
        [item.peg_id, item.periode]
      );

      const nextRevision = last.length ? last[0].revision_no + 1 : 1;

      // Insert versi baru
      await conn.query(
        `INSERT INTO thp_take_home_pay 
          (peg_id, periode, revision_no, total_penghasilan, total_potongan, thp, is_locked)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [
          item.peg_id,
          item.periode,
          nextRevision,
          item.total_penghasilan,
          item.total_potongan,
          item.thp,
        ]
      );
    }

    await conn.commit();
    res.json({ message: "THP berhasil disimpan sebagai versi baru", total: data.length });
  } catch (err) {
    await conn.rollback();
    console.error("Error saveGenerated THP:", err);
    res.status(500).json({ message: "Gagal simpan THP" });
  } finally {
    conn.release();
  }
};


/**
 * Endroll/kunci THP berdasarkan peg_id + periode.
 * - Hanya mengunci revisi terbaru.
 * - Massal & transactional.
 */
exports.endrollTHP = async (req, res) => {
  let data = req.body; // [{ peg_id, periode }, ...]

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Data endroll tidak boleh kosong" });
  }

  // Normalisasi periode -> selalu YYYY-MM-DD (pakai tanggal 01)
  data = data.map(d => ({
    ...d,
    periode: d.periode.length === 7 ? `${d.periode}-01` : d.periode
  }));

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    // Ambil latest revision per pegawai+periode
    const whereIn = data.map(() => "(peg_id=? AND periode=?)").join(" OR ");
    const params = data.flatMap(d => [d.peg_id, d.periode]);

    const [latestRows] = await conn.query(
      `
      SELECT peg_id, periode, MAX(revision_no) AS max_revision
      FROM thp_take_home_pay
      WHERE ${whereIn}
      GROUP BY peg_id, periode
      `,
      params
    );

    if (latestRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Tidak ada data THP untuk dikunci" });
    }

    // Update is_locked
    const values = latestRows.map(r => [r.peg_id, r.periode, r.max_revision]);

    await conn.query(
      `
      UPDATE thp_take_home_pay t
      JOIN ( 
        SELECT ? AS peg_id, ? AS periode, ? AS revision_no
      ) v
      ON t.peg_id = v.peg_id
         AND t.periode = v.periode
         AND t.revision_no = v.revision_no
      SET t.is_locked = 1
      `,
      values[0] // kalau bulk update, nanti kita bikin dynamic
    );

    await conn.commit();
    res.json({ message: "THP berhasil dikunci", total: latestRows.length });
  } catch (err) {
    await conn.rollback();
    console.error("Error endrollTHP:", err);
    res.status(500).json({ message: "Gagal endroll THP" });
  } finally {
    conn.release();
  }
};
