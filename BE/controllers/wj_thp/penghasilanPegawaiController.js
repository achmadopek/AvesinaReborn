const db = require('../../db/connection-lokal');


/**
 * Generate data penghasilan pegawai berdasarkan status pegawai dan periode.
 * - Cek apakah pegawai sudah punya data penghasilan.
 * - Jika belum, gunakan default dari komponen penghasilan.
 */
exports.generatePenghasilanPegawai = (req, res) => {
  const periode = req.query.periode?.trim() + '-01';

  const rawEmployeeSts = req.query.employee_sts?.trim();
  const employee_sts = rawEmployeeSts === "" || rawEmployeeSts === "Semua" ? null : rawEmployeeSts;

  if (!periode) {
    return res.status(400).json({ data: [], message: 'Periode wajib diisi.' });
  }

  // untuk cek mutasi
  const periodeBulan = periode.slice(0, 7);
  const startDate = periode;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // akhir bulan
  const endDateStr = endDate.toISOString().slice(0, 10);

  let pegawaiQuery = `
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

  const komponenTetapQuery = `
    SELECT id, penghasilan_code, penghasilan_nm, default_nilai, employee_sts, education, golongan, job_sts, unit_id, jenis
    FROM thp_komponen_penghasilan
    WHERE jenis = 'tetap' OR jenis = 'gaji'
  `; //ditambah komponen berupa gaji juga bisa digenerate dan disesuiakan jika perlu

  const existingPenghasilanQuery = `
    SELECT penghasilan_id, peg_id, nilai, is_locked, event_id, jenis
    FROM thp_penghasilan_pegawai
    WHERE peg_id IN (?) AND periode = ?
  `;

  const kegiatanQuery = `
    SELECT dh.event_id, dh.peg_id, k.event_nm, dh.nilai, k.penghasilan_id, kp.penghasilan_code, kp.penghasilan_nm
    FROM daftar_hadir dh
    JOIN kegiatan k ON k.id = dh.event_id
    JOIN thp_komponen_penghasilan kp ON kp.id = k.penghasilan_id
    WHERE dh.peg_id IN (?) AND DATE_FORMAT(k.event_dt, '%Y-%m') = ?
  `;

  const pegawaiParams = employee_sts
    ? [startDate, endDateStr, employee_sts, employee_sts, startDate]
    : [startDate, endDateStr, startDate];

  db.query(pegawaiQuery, pegawaiParams, (err, pegawaiList) => {
    if (err) return res.status(500).json({ data: [], message: 'Gagal ambil data pegawai' });
    if (pegawaiList.length === 0) return res.json({ data: [], message: '' });

    const pegIds = pegawaiList.map(p => p.peg_id);

    db.query(komponenTetapQuery, [], (err, komponenTetapList) => {
      if (err) return res.status(500).json({ data: [], message: 'Gagal ambil komponen tetap' });

      db.query(existingPenghasilanQuery, [pegIds, periode], (err, existingList) => {
        if (err) return res.status(500).json({ data: [], message: 'Gagal ambil data penghasilan' });

        db.query(kegiatanQuery, [pegIds, periodeBulan], (err, kegiatanList) => {
          if (err) return res.status(500).json({ data: [], message: 'Gagal ambil data kegiatan' });

          // Map existing penghasilan
          const existingMap = new Map();
          existingList.forEach(item => {
            const key = `PH_${item.peg_id}_${item.penghasilan_id}`;
            existingMap.set(key, { nilai: item.nilai, is_locked: item.is_locked });
          });

          const hasil = [];
          let message = '';

          let prevPegId = null; // untuk simpan peg_id sebelumnya
          let prevMutationDt = null; // untuk simpan peg_id sebelumnya

          for (let i = 0; i < pegawaiList.length; i++) {
            const peg = pegawaiList[i];
            const mutationDate = new Date(peg.mutation_dt);
            const periodeDate = new Date(periode);
            const endOfPeriode = new Date(periodeDate.getFullYear(), periodeDate.getMonth() + 1, 0);
            const jmlHariSebulan = endOfPeriode.getDate();

            // Cari pegawai berikutnya dengan peg_id yang sama
            const nextPeg = pegawaiList[i + 1]?.peg_id === peg.peg_id 
              ? pegawaiList[i + 1] 
              : null;

            // Tentukan tanggal akhir durasi
            let endDate;
            if (nextPeg) {
              const nextMutation = new Date(nextPeg.mutation_dt);
              endDate = new Date(nextMutation);
              endDate.setDate(endDate.getDate() - 1); // sehari sebelum mutasi berikutnya
            } else {
              endDate = endOfPeriode; // kalau gak ada mutasi lagi, pakai akhir bulan
            }

            // Tanggal mulai dihitung dari yang terbesar (mutation atau awal periode)
            const startCountDate = mutationDate > periodeDate ? mutationDate : periodeDate;

            // Hitung durasi (inklusif)
            const durasi = Math.max(
              Math.ceil((endDate.getTime() - startCountDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
              0
            );

            const data = {
              periode,
              peg_id: peg.peg_id,
              employee_nm: peg.peg_id === prevPegId ? "-" : peg.employee_nm,
              employee_sts: peg.peg_id === prevPegId ? "-" : peg.employee_sts,
              education: peg.peg_id === prevPegId ? "-" : peg.education,
              golongan: peg.peg_id === prevPegId ? "-" : peg.golongan,
              job_sts: peg.peg_id === prevPegId ? "-" : peg.job_sts,
              unit_id: peg.unit_id,
              unit_nm: peg.unit_nm,
              mutation_dt: peg.mutation_dt,
              jml_sebulan: jmlHariSebulan,
              durasi,
              komponen: [],
            };

            // Komponen Tetap
            for (const komp of komponenTetapList) {
              const matchEmployeeSts = !komp.employee_sts || komp.employee_sts.split(',').includes(peg.employee_sts);
              const matchGolongan = !komp.golongan || komp.golongan === peg.golongan;
              const matchEducation = !komp.education || komp.education === peg.education;
              const matchJobSts = !komp.job_sts || komp.job_sts === peg.job_sts;
              const matchUnit = !komp.unit_id || komp.unit_id === peg.unit_id;

              if (matchEmployeeSts && matchGolongan && matchEducation && matchJobSts && matchUnit) {
                const key = `PH_${peg.peg_id}_${komp.id}`;
                const existing = existingMap.get(key);

                data.komponen.push({
                  penghasilan_id: komp.id,
                  penghasilan_code: komp.penghasilan_code,
                  penghasilan_nm: komp.penghasilan_nm,
                  nilai: peg.peg_id === prevPegId ? "-" : existing?.nilai ?? komp.default_nilai,
                  is_locked: existing?.is_locked ?? 0,
                  jenis: komp.jenis || 'tetap',
                });
              }
            }

            // Komponen Kegiatan
            const kegiatanPegawai = kegiatanList.filter(k => k.peg_id === peg.peg_id);

            for (const keg of kegiatanPegawai) {
              if (!keg.penghasilan_id) continue; // skip jika belum ada komponen penghasilan

              const key = `PH_${peg.peg_id}_${keg.penghasilan_id}`;
              const existing = existingMap.get(key);

              data.komponen.push({
                penghasilan_id: keg.penghasilan_id,
                penghasilan_code: `${keg.penghasilan_code} (${keg.event_nm})`,
                penghasilan_nm: `${keg.penghasilan_nm} (${keg.event_nm})`,
                nilai: peg.peg_id === prevPegId ? "-" : existing?.nilai ?? keg.nilai ?? 0,
                is_locked: existing?.is_locked ?? 0,
                event_id: keg.event_id || 0,
                jenis: 'kegiatan',
              });
            }

            hasil.push(data);

            prevPegId = peg.peg_id; // update peg_id sebelumnya
            prevMutationDt = peg.mutation_dt; // update mutasi ke tgl mutasi

          }

          res.json({ data: hasil, message });
        });
      });
    });
  });
};


/**
 * Simpan data penghasilan hasil generate.
 * - Lewati jika data sudah dikunci.
 * - Gunakan upsert (insert/update) untuk efisiensi.
 */
exports.saveGenerated = async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Data kosong / tidak valid" });
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    // Normalisasi event_id → 0 jika null
    const values = data.map((item) => [
      item.penghasilan_id,
      item.peg_id,
      item.periode,
      item.nilai,
      item.event_id || 0,
      item.entried_by,
      item.jenis,
    ]);

    const BATCH_SIZE = 1000;
    const queries = [];

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);

      queries.push(
        conn.query(
          `INSERT INTO thp_penghasilan_pegawai 
            (penghasilan_id, peg_id, periode, nilai, event_id, entried_by, jenis)
           VALUES ?
           ON DUPLICATE KEY UPDATE 
             nilai = VALUES(nilai),
             entried_by = VALUES(entried_by),
             jenis = VALUES(jenis)`,
          [batch]
        )
      );
    }

    // Eksekusi semua batch paralel
    await Promise.all(queries);

    await conn.commit();
    res.json({ message: "Berhasil menyimpan data", total: data.length });
  } catch (err) {
    await conn.rollback();
    console.error("Error saving data:", err);
    res.status(500).json({ message: "Gagal menyimpan data" });
  } finally {
    conn.release();
  }
};


/**
 * Endroll/kunci data penghasilan pegawai berdasarkan peg_id dan periode.
 * - Mengatur flag is_locked menjadi 1.
 */
exports.endrollPenghasilan = async (req, res) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }

    const connection = db.promise();

    // Normalisasi periode → YYYY-MM-01
    const values = data.map(({ peg_id, periode }) => [
      peg_id,
      `${periode}-01`,
    ]);

    // Buat query batch (multi-row)
    await connection.query(
      `UPDATE thp_penghasilan_pegawai 
       SET is_locked = 1 
       WHERE (peg_id, periode) IN (?)`,
      [values]
    );

    res.json({ message: 'Data berhasil dikunci' });
  } catch (err) {
    console.error('Gagal endroll data:', err);
    res.status(500).json({ message: 'Gagal mengunci data' });
  }
};
