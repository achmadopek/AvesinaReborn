const db = require('../../db/connection-lokal');

exports.generatePotonganPegawai = (req, res) => {
  const periodeInput = req.query.periode?.trim();
  if (!periodeInput) {
    return res.status(400).json({ message: 'Jenis pegawai dan periode wajib diisi.' });
  }

  // Pastikan format periode jadi YYYY-MM-DD
  const periode = periodeInput.length === 7 ? `${periodeInput}-01` : periodeInput;

  const rawEmployeeSts = req.query.employee_sts?.trim();
  const employee_sts =
    rawEmployeeSts === "" || rawEmployeeSts === "Semua" ? null : rawEmployeeSts;

  // cek mutasi
  const startDate = periode;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // akhir bulan
  const endDateStr = endDate.toISOString().slice(0, 10);

  const pegawaiQuery = `
    (
      SELECT 
          p.id AS peg_id, 
          p.employee_nm, 
          p.education, 
          p.golongan, 
          p.employee_sts, 
          p.job_sts, 
          m.unit_id,
          m.unit_nm,
          m.mutation_dt
      FROM sdm_pegawai p
      JOIN sdm_mutasi m 
          ON m.peg_id = p.id
          AND m.mutation_dt BETWEEN ? AND ?
      ${employee_sts ? "WHERE p.employee_sts = ?" : ""}
    )
    UNION ALL
    (
      SELECT 
          p.id AS peg_id, 
          p.employee_nm, 
          p.education, 
          p.golongan, 
          p.employee_sts, 
          p.job_sts, 
          m.unit_id,
          m.unit_nm,
          m.mutation_dt
      FROM sdm_pegawai p
      JOIN sdm_mutasi m 
        ON m.peg_id = p.id
      ${employee_sts ? `
        WHERE p.employee_sts = ?
        AND m.mutation_dt = (
            SELECT MAX(m2.mutation_dt)
            FROM sdm_mutasi m2
            WHERE m2.peg_id = p.id
              AND m2.mutation_dt < ?
        )
      ` : `
        WHERE m.mutation_dt = (
            SELECT MAX(m2.mutation_dt)
            FROM sdm_mutasi m2
            WHERE m2.peg_id = p.id
              AND m2.mutation_dt < ?
        )
      `}
    )
    ORDER BY peg_id, mutation_dt
  `;

  const pegawaiParams = employee_sts
    ? [startDate, endDateStr, employee_sts, employee_sts, startDate]
    : [startDate, endDateStr, startDate];

  db.query(pegawaiQuery, pegawaiParams, (err, pegawaiList) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data pegawai' });
    if (pegawaiList.length === 0) return res.json([]);

    const pegIds = pegawaiList.map(p => p.peg_id);

    const penghasilanQuery = `
      SELECT id AS penghasilan_pegawai_id, peg_id, penghasilan_id, nilai
      FROM thp_penghasilan_pegawai
      WHERE peg_id IN (?) AND periode = ? AND is_locked = 1
    `;

    db.query(penghasilanQuery, [pegIds, periode], (err, penghasilanResult) => {
      if (err) return res.status(500).json({ message: 'Gagal ambil penghasilan pegawai' });

      const penghasilanMap = penghasilanResult.reduce((acc, row) => {
        (acc[row.peg_id] = acc[row.peg_id] || []).push({
          penghasilan_id: row.penghasilan_id,
          penghasilan_pegawai_id: row.penghasilan_pegawai_id,
          nilai: row.nilai
        });
        return acc;
      }, {});

      const uniquePenghasilanIds = [...new Set(penghasilanResult.map(p => p.penghasilan_id))];
      if (uniquePenghasilanIds.length === 0) {
        return res.status(200).json({ message: 'Tidak ada penghasilan yang dikunci untuk periode ini' });
      }

      const presensiQuery = `
        SELECT id AS presensi_id, peg_id, nilai
        FROM presensi
        WHERE peg_id IN (?) AND periode = ?
      `;

      db.query(presensiQuery, [pegIds, periode], (err, presensiList) => {
        if (err) return res.status(500).json({ message: 'Gagal ambil data presensi' });

        const presensiMap = presensiList.reduce((acc, p) => {
          acc[p.peg_id] = { presensi_id: p.presensi_id, nilai: p.nilai };
          return acc;
        }, {});

        const komponenQuery = `
          SELECT id, potongan_code, potongan_nm, default_nilai, satuan, employee_sts, golongan, education, penghasilan_id, jenis
          FROM thp_komponen_potongan
          WHERE (employee_sts LIKE ? OR employee_sts IS NULL)
            AND penghasilan_id IN (?)
        `;
        const searchValue = `%${employee_sts || ''}%`;

        db.query(komponenQuery, [searchValue, uniquePenghasilanIds], (err, komponenList) => {
          if (err) return res.status(500).json({ message: 'Gagal ambil komponen potongan' });

          const existingPotonganQuery = `
            SELECT potongan_id, peg_id, nilai, is_locked, penghasilan_pegawai_id, presensi_id
            FROM thp_potongan_pegawai
            WHERE peg_id IN (?) AND periode = ?
          `;

          db.query(existingPotonganQuery, [pegIds, periode], (err, existingList) => {
            if (err) return res.status(500).json({ message: 'Gagal ambil potongan existing' });

            const existingByPegPotongan = {};
            const existingByPegPresensi = {};
            existingList.forEach(item => {
              if (item.potongan_id) {
                existingByPegPotongan[`${item.peg_id}_${item.potongan_id}`] = item;
              }
              if (item.presensi_id) {
                existingByPegPresensi[`${item.peg_id}_${item.presensi_id}`] = item;
              }
            });

            const hasil = pegawaiList.map(peg => {
              const pegPenghasilan = penghasilanMap[peg.peg_id] || [];
              const presensi = presensiMap[peg.peg_id];

              const data = {
                periode,
                peg_id: peg.peg_id,
                employee_nm: peg.employee_nm,
                employee_sts: peg.employee_sts,
                golongan: peg.golongan,
                education: peg.education,
                presensi_id: presensi?.presensi_id || null,
                komponen: [],
              };

              // filter komponen by employee_sts + golongan + education
              const applicableKomponen = komponenList.filter(komp => {
                if (komp.golongan && komp.golongan !== peg.golongan) return false;
                if (komp.education && komp.education !== peg.education) return false;
                return true;
              });

              applicableKomponen.forEach(komp => {
                const matchedPenghasilan = pegPenghasilan.find(
                  p => p.penghasilan_id === komp.penghasilan_id
                );
                if (!matchedPenghasilan) return;

                const jenis = (komp.jenis || '').toLowerCase();
                const existKeyByPot = `${peg.peg_id}_${komp.id}`;
                const existing = existingByPegPotongan[existKeyByPot];

                if (jenis === 'presensi') {
                  let nilai;
                  let existingPresensi = existing;

                  if (!existingPresensi && presensi?.presensi_id) {
                    const existKeyByPres = `${peg.peg_id}_${presensi.presensi_id}`;
                    existingPresensi = existingByPegPresensi[existKeyByPres];
                  }

                  if (existingPresensi) {
                    nilai = existingPresensi.nilai;
                  } else if (presensi) {
                    nilai = presensi.nilai;
                  } else {
                    nilai = komp.default_nilai;
                  }

                  if (komp.satuan === 'persen') {
                    // Jika presensi + persen
                    const persen = existingPresensi ? existingPresensi.nilai : (presensi ? presensi.nilai : komp.default_nilai);
                    nilai = Math.round((persen / 100) * (matchedPenghasilan.nilai || 0));
                  } else {
                    // Jika presensi + rupiah biasa
                    if (existingPresensi) {
                      nilai = existingPresensi.nilai;
                    } else if (presensi) {
                      nilai = presensi.nilai;
                    } else {
                      nilai = komp.default_nilai;
                    }
                  }

                  data.komponen.push({
                    potongan_id: komp.id,
                    potongan_code: komp.potongan_code,
                    potongan_nm: komp.potongan_nm,
                    employee_sts: peg.employee_sts,
                    satuan: komp.satuan || 'rupiah',
                    nilai,
                    is_locked: presensi
                      ? 1
                      : (existingPresensi ? Number(existingPresensi.is_locked) : 0),
                    presensi_id: presensi?.presensi_id || null,
                    penghasilan_pegawai_id: existingPresensi?.penghasilan_pegawai_id
                      ?? matchedPenghasilan.penghasilan_pegawai_id,
                    is_system: true,
                    jenis,
                  });

                } else {
                  let nilaiFinal;
                  if (komp.satuan === 'persen') {
                    const persen = existing ? existing.nilai : komp.default_nilai;
                    nilaiFinal = Math.round((persen / 100) * (matchedPenghasilan.nilai || 0));
                  } else {
                    nilaiFinal = existing ? existing.nilai : komp.default_nilai;
                  }

                  data.komponen.push({
                    potongan_id: komp.id,
                    potongan_code: komp.potongan_code,
                    potongan_nm: komp.potongan_nm,
                    employee_sts: komp.employee_sts,
                    satuan: komp.satuan,
                    nilai: nilaiFinal,
                    is_locked: existing ? Number(existing.is_locked) : 0,
                    penghasilan_pegawai_id: existing
                      ? existing.penghasilan_pegawai_id
                      : matchedPenghasilan.penghasilan_pegawai_id,
                    jenis,
                  });
                }
              });

              return data;
            });

            res.json(hasil);
          });
        });
      });
    });
  });
};

exports.saveGenerated = async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Data kosong / tidak valid" });
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    // Normalisasi nilai + NULL safe
    const values = data.map((item) => [
      item.potongan_id,
      item.peg_id,
      item.periode.length === 7 ? `${item.periode}-01` : item.periode,
      isNaN(item.nilai) ? 0 : Number(item.nilai),
      item.presensi_id || null,
      item.penghasilan_pegawai_id || null,
      item.entried_by || null,
    ]);

    const BATCH_SIZE = 1000;
    const queries = [];

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);

      queries.push(
        conn.query(
          `INSERT INTO thp_potongan_pegawai 
            (potongan_id, peg_id, periode, nilai, presensi_id, penghasilan_pegawai_id, entried_by)
           VALUES ?
           ON DUPLICATE KEY UPDATE 
             nilai = IF(is_locked = 1, thp_potongan_pegawai.nilai, VALUES(nilai)),
             presensi_id = IF(is_locked = 1, thp_potongan_pegawai.presensi_id, VALUES(presensi_id)),
             penghasilan_pegawai_id = IF(is_locked = 1, thp_potongan_pegawai.penghasilan_pegawai_id, VALUES(penghasilan_pegawai_id)),
             entried_by = IF(is_locked = 1, thp_potongan_pegawai.entried_by, VALUES(entried_by))`,
          [batch]
        )
      );
    }

    await Promise.all(queries); // eksekusi batch paralel
    await conn.commit();

    res.json({ message: "Berhasil menyimpan data", total: data.length });
  } catch (err) {
    await conn.rollback();
    console.error("Error saving potongan:", err);
    res.status(500).json({ message: "Gagal menyimpan data" });
  } finally {
    conn.release();
  }
};


exports.endrollPotongan = async (req, res) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }

    // Normalisasi periode ke format YYYY-MM-DD
    const normalizedData = data.map((row) => ({
      peg_id: row.peg_id,
      periode: row.periode.length === 7 ? `${row.periode}-01` : row.periode,
    }));

    const connection = db.promise();

    // bikin values untuk IN clause
    const values = normalizedData.map((row) => [row.peg_id, row.periode]);

    // query bulk update (pakai tuple comparison)
    await connection.query(
      `UPDATE thp_potongan_pegawai 
       SET is_locked = 1
       WHERE (peg_id, periode) IN (?)`,
      [values]
    );

    res.json({ message: 'Data berhasil dikunci', total: normalizedData.length });
  } catch (err) {
    console.error('Gagal endroll data:', err);
    res.status(500).json({ message: 'Gagal mengunci data' });
  }
};

