const db_lokal = require("../../db/connection-lokal");

// GET semua ruangan aktif
exports.getAllRuangan = (req, res) => {
  //atau pakai lokal (jika aset blm lengkap)
  const sql = `
    SELECT 
      id as ruangan_id,
      nama_unit as nama_ruangan,
      kode_unit as kode_ruangan,
      id as srvc_unit_id
    FROM inm_unit
    WHERE status = 1
    ORDER BY nama_ruangan ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: rows });
  });
};

// GET semua instalasi aktif
exports.getAllInstalasi = (req, res) => {
  //atau pakai lokal (jika aset blm lengkap)
  const sql = `
    SELECT 
      id as instalasi_id,
      nama_instalasi,
      kode_instalasi
    FROM inm_instalasi
    WHERE id > 0
    ORDER BY nama_instalasi ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: rows });
  });
};

// GET semua bidang aktif
exports.getAllBidang = (req, res) => {
  //atau pakai lokal (jika aset blm lengkap)
  const sql = `
    SELECT 
      id as bidang_id,
      nama_bidang,
      kode_bidang
    FROM inm_bidang
    WHERE id > 0
    ORDER BY nama_bidang ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: rows });
  });
};

// GET indikator by unit
exports.getIndikatorByUnit = (req, res) => {
  const { unit_id } = req.params;

  const sql = `
    SELECT 
      ind.id,
      ind.judul_indikator,
      ind.operator,
      ind.measurement,
      ind.standart,
      ind.satuan_num,
      ind.satuan_den,
      ind.contoh_num,
      ind.contoh_den,
      ind.numerator,
      ind.denominator
    FROM inm_indikator ind
    LEFT JOIN inm_group_pelayanan grp ON grp.id = ind.group_pelayanan_id
    LEFT JOIN inm_unit u ON u.group_pelayanan_id = grp.id
    WHERE u.id = ?
    ORDER BY ind.id
  `;

  db_lokal.query(sql, [unit_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: rows });
  });
};

// SUBMIT BULK HARIAN
exports.simpanHarianBulk = (req, res) => {
  const { unit_id, tgl_input, details } = req.body;

  if (!unit_id || !tgl_input || !details)
    return res.status(400).json({ error: "Data tidak lengkap" });

  // insert header harian status=0=unverified
  const sqlHarian = `
    INSERT INTO inm_harian (unit_id, tgl_input, created_at)
    VALUES (?, ?, NOW())
  `;

  db_lokal.query(sqlHarian, [unit_id, tgl_input], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    const harian_id = result.insertId;

    const values = details.map((d) => [
      harian_id,
      d.indikator_id,
      d.numerator_value,
      d.denominator_value,
      d.is_meet_standard,
      new Date(),
      null,
    ]);

    const sqlDetail = `
      INSERT INTO inm_harian_detail 
      (harian_id, indikator_id, numerator_value, denominator_value, is_meet_standard, created_at, updated_at)
      VALUES ?
    `;

    db_lokal.query(sqlDetail, [values], (err2) => {
      if (err2) return res.status(500).json({ error: err2 });

      res.json({ success: true, harian_id });
    });
  });
};
