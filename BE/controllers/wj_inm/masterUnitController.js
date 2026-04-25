const bcrypt = require('bcrypt');
const db_lokal = require('../../db/connection-lokal'); // Koneksi ke database inm

// ==========================
// GET Semua Unit (dengan paginasi)
// ==========================
exports.getData = (req, res) => {  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const nama = req.query.nama || '';

  let baseWhere = '';
  const whereValues = [];

  if (nama) {
    baseWhere += (baseWhere ? ' AND' : ' WHERE') + ' nama LIKE ?';
    whereValues.push(`%${nama}%`);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM unit ${baseWhere}`;
  const dataQuery = `
    SELECT * FROM unit
    ${baseWhere}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Query total
  db_lokal.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal ambil jumlah total unit:', err);
      return res.status(500).json({ message: 'Gagal ambil total data unit' });
    }

    const total = countResult[0].total;

    // Query data pegawai
    db_lokal.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data unit:', err);
        return res.status(500).json({ message: 'Gagal ambil data unit' });
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

  db_lokal.query(query, values, (err) => {
    if (err) {
      console.error('Gagal tambah pegawai:', err);
      return res.status(500).json({ error: 'Gagal menambahkan data pegawai' });
    }
    res.json({ message: 'Data pegawai berhasil ditambahkan' });
  });
};

// ==========================
// GET Detail Pegawai by ID (beserta data user jika ada)
// ==========================
exports.getPegawaiById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT *
    FROM sdm_pegawai p 
    WHERE p.id = ?
  `;

  db_lokal.query(query, [id], (err, results) => {
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

  db_lokal.query(query, values, (err) => {
    if (err) {
      console.error('Gagal update pegawai:', err);
      return res.status(500).json({ error: 'Gagal memperbarui data pegawai' });
    }

    res.json({ message: 'Data pegawai berhasil diperbarui' });
  });
};
