const db = require('../../db/connection-lokal');

// ==========================
// GET DATA INSTALASI
// ==========================
exports.getData = (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const kode = req.query.kode || '';
  const nama = req.query.nama || '';

  let where = ' WHERE 1=1 ';
  let values = [];

  if (kode) {
    where += ' AND i.kode_instalasi LIKE ? ';
    values.push(`%${kode}%`);
  }

  if (nama) {
    where += ' AND i.nama_instalasi LIKE ? ';
    values.push(`%${nama}%`);
  }

  // =========================
  // COUNT
  // =========================
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM spm_instalasi i
    ${where}
  `;

  // =========================
  // DATA
  // =========================
  const dataQuery = `
    SELECT
      i.id,
      i.bidang_id,
      i.nama_instalasi,
      i.kode_instalasi,
      i.user_instalasi,
      i.kepala_instalasi,
      i.created_at,
      i.updated_at,

      b.nama_bidang,
      b.kode_bidang,

      p.employee_nm AS kepala_instalasi_nama,
      p2.employee_nm AS user_instalasi_nama

    FROM spm_instalasi i

    LEFT JOIN spm_bidang b ON b.id = i.bidang_id
    LEFT JOIN sdm_pegawai p ON p.id = i.kepala_instalasi
    LEFT JOIN sdm_pegawai p2 ON p2.id = i.user_instalasi

    ${where}

    ORDER BY i.id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...values, limit, offset];

  db.query(countQuery, values, (err, countResult) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal hitung data instalasi' });
    }

    const total = countResult[0].total;

    db.query(dataQuery, dataValues, (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Gagal ambil data instalasi' });
      }

      res.json({
        data: results,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    });

  });

};



// ==========================
// SEARCH BIDANG
// ==========================
exports.searchBidang = (req, res) => {

  const search = `%${req.query.nama || ''}%`;

  const sql = `
    SELECT
      id,
      nama_bidang,
      kode_bidang
    FROM spm_bidang
    WHERE nama_bidang LIKE ?
    ORDER BY nama_bidang ASC
    LIMIT 20
  `;

  db.query(sql, [search], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal ambil bidang' });
    }

    res.json(result);

  });

};



// ==========================
// SEARCH PEGAWAI (KEPALA)
// ==========================
exports.searchPegawai = (req, res) => {

  const search = `%${req.query.nama || ''}%`;

  const sql = `
    SELECT
      id,
      employee_nm
    FROM sdm_pegawai
    WHERE employee_nm LIKE ?
    ORDER BY employee_nm ASC
    LIMIT 20
  `;

  db.query(sql, [search], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal ambil pegawai' });
    }

    res.json(result);

  });

};



// ==========================
// CREATE INSTALASI
// ==========================
exports.createInstalasi = (req, res) => {

  const {
    bidang_id,
    nama_instalasi,
    kode_instalasi,
    user_instalasi,
    kepala_instalasi
  } = req.body;

  const sql = `
    INSERT INTO spm_instalasi (
      bidang_id,
      nama_instalasi,
      kode_instalasi,
      user_instalasi,
      kepala_instalasi,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  db.query(sql, [
    bidang_id,
    nama_instalasi,
    kode_instalasi,
    user_instalasi,
    kepala_instalasi
  ], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal tambah instalasi' });
    }

    res.json({
      message: 'Instalasi berhasil ditambahkan',
      id: result.insertId
    });

  });

};



// ==========================
// UPDATE INSTALASI
// ==========================
exports.updateInstalasi = (req, res) => {

  const id = req.params.id;

  const {
    bidang_id,
    nama_instalasi,
    kode_instalasi,
    user_instalasi,
    kepala_instalasi
  } = req.body;

  const sql = `
    UPDATE spm_instalasi SET
      bidang_id = ?,
      nama_instalasi = ?,
      kode_instalasi = ?,
      user_instalasi = ?,
      kepala_instalasi = ?,
      updated_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [
    bidang_id,
    nama_instalasi,
    kode_instalasi,
    user_instalasi,
    kepala_instalasi,
    id
  ], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal update instalasi' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Instalasi tidak ditemukan' });
    }

    res.json({ message: 'Instalasi berhasil diupdate' });

  });

};



// ==========================
// DELETE (SOFT DELETE)
// ==========================
exports.deleteInstalasi = (req, res) => {

  const id = req.params.id;

  const sql = `
    UPDATE spm_instalasi SET status = 0
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal hapus instalasi' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Instalasi tidak ditemukan' });
    }

    res.json({ message: 'Instalasi berhasil dihapus' });

  });

};