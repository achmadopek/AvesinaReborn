const bcrypt = require('bcrypt');
const db = require('../../db/connection-lokal'); // Koneksi ke database lokal

// ==========================
// GET Semua Pegawai (dengan paginasi) + Seacrh
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const nik = req.query.nik || '';
  const nama = req.query.nama || '';
  const status = req.query.status || '';

  let baseWhere = '';
  const whereValues = [];

  if (nik) {
    baseWhere += (baseWhere ? ' AND' : ' WHERE') + ' nik LIKE ?';
    whereValues.push(`%${nik}%`);
  }

  if (nama) {
    baseWhere += (baseWhere ? ' AND' : ' WHERE') + ' employee_nm LIKE ?';
    whereValues.push(`%${nama}%`);
  }

  if (status) {
    const stsArray = status.split(",");
    baseWhere += (baseWhere ? " AND" : " WHERE") + ` employee_sts IN (?)`;
    whereValues.push(stsArray);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM sdm_pegawai ${baseWhere}`;
  const dataQuery = `
    SELECT * FROM sdm_pegawai
    ${baseWhere}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Query total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal ambil jumlah total pegawai:', err);
      return res.status(500).json({ message: 'Gagal ambil total data pegawai' });
    }

    const total = countResult[0].total;

    // Query data pegawai
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data pegawai:', err);
        return res.status(500).json({ message: 'Gagal ambil data pegawai' });
      }

      res.json({
        data: results,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    });
  });
};

// ==========================
// Cari Pegawai by Name
// ==========================
exports.getPegawaiSearch = (req, res) => {
  const search = `%${req.query.nama || ''}%`;
  const sql = `
    SELECT id, employee_nm AS nama
    FROM sdm_pegawai
    WHERE employee_nm LIKE ?
    ORDER BY employee_nm
    LIMIT 20
  `;

  db.query(sql, [search], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data pegawai' });
    res.json(result);
  });
};

// ==============================
// Cek apakah NIK sudah terdaftar
// ==============================
exports.checkNikExists = (req, res) => {
  const { nik } = req.params;

  if (!nik) {
    return res.status(400).json({ message: 'NIK diperlukan' });
  }

  const query = 'SELECT COUNT(*) AS count FROM sdm_pegawai WHERE nik = ?';

  db.query(query, [nik], (err, results) => {
    if (err) {
      console.error('Gagal cek NIK:', err);
      return res.status(500).json({ message: 'Gagal memeriksa NIK' });
    }

    const exists = results[0].count > 0;
    res.json({ exists });
  });
};

// ==========================
// CREATE Pegawai
// ==========================
exports.createPegawai = (req, res) => {
  const {
    nik, employee_nm, birth_dt, place_of_birth, nip,
    pangkat, golongan, mkg, npwp, education,
    employee_sts, job_sts, doctor_sts
  } = req.body;

  const query = `
    INSERT INTO sdm_pegawai (
      nik, employee_nm, birth_dt, place_of_birth, nip, pangkat, golongan,
      mkg, npwp, education, employee_sts, job_sts, doctor_sts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nik, employee_nm, birth_dt, place_of_birth, nip,
    pangkat, golongan, mkg, npwp, education,
    employee_sts, job_sts, doctor_sts
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Gagal tambah pegawai:', err);
      return res.status(500).json({ error: 'Gagal menambahkan data pegawai' });
    }
    res.json({ message: 'Data pegawai berhasil ditambahkan' });
  });
};

// ==========================
// GET Detail Pegawai by ID
// ==========================
exports.getPegawaiById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT * 
    FROM sdm_pegawai p 
    WHERE p.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data pegawai' });
    if (results.length === 0) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });

    // Gabungkan data pegawai dengan data user (jika ada)
    const pegawai = {
      ...results[0]
    };

    res.json(pegawai);
  });
};

// ==========================
// UPDATE Data Pegawai
// ==========================
exports.updatePegawai = (req, res) => {
  const { id } = req.params;
  const {
    nik, employee_nm, birth_dt, place_of_birth, nip,
    pangkat, golongan, mkg, npwp, education,
    employee_sts, job_sts, doctor_sts
  } = req.body;

  const query = `
    UPDATE sdm_pegawai SET
      nik = ?, employee_nm = ?, birth_dt = ?, place_of_birth = ?, nip = ?,
      pangkat = ?, golongan = ?, mkg = ?, npwp = ?, education = ?, 
      employee_sts = ?, job_sts = ?, doctor_sts = ?
    WHERE id = ?
  `;

  const values = [
    nik, employee_nm, birth_dt, place_of_birth, nip,
    pangkat, golongan, mkg, npwp, education,
    employee_sts, job_sts, doctor_sts, id
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Gagal update pegawai:', err);
      return res.status(500).json({ error: 'Gagal memperbarui data pegawai' });
    }

    res.json({ message: 'Data pegawai berhasil diperbarui' });
  });
};

// ==========================
// VERIFIKASI PEGAWAI
// ==========================
exports.verifyPegawai = (req, res) => {
  const id = req.params.id;
  const { verified_by } = req.body;

  const verifiedAt = verified_by ? new Date() : null;

  const sql = `
    UPDATE sdm_pegawai 
    SET verified_by = ?, verified_at = ?
    WHERE id = ?
  `;

  db.query(sql, [verified_by, verifiedAt, id], (err) => {
    if (err) {
      console.error('Gagal update verifikasi:', err);
      return res.status(500).json({ message: 'Gagal memverifikasi', error: err });
    }

    return res.json({ message: 'Verifikasi berhasil diperbarui' });
  });
};

// ==========================
// VALIDASI PEGAWAI
// ==========================
exports.validityPegawai = (req, res) => {
  const id = req.params.id;
  const { validated_by } = req.body;

  const validatedAt = validated_by ? new Date() : null;

  const sql = `
    UPDATE sdm_pegawai 
    SET validated_by = ?, validated_at = ?
    WHERE id = ?
  `;

  db.query(sql, [validated_by, validatedAt, id], (err) => {
    if (err) {
      console.error('Gagal update validasi:', err);
      return res.status(500).json({ message: 'Gagal memvalidasi', error: err });
    }

    return res.json({ message: 'Validasi berhasil diperbarui' });
  });
};