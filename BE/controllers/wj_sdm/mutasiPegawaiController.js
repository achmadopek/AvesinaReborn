const bcrypt = require('bcrypt');
const db = require('../../db/connection-lokal'); // Koneksi ke database lokal
const db2 = require('../../db/connection-avesina'); // Koneksi ke database Avesina

// ==========================
// GET Data Mutasi (dengan paginasi)
// ==========================
exports.getMutasi = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const pegId = req.query.peg_id || null;
  const periode = req.query.periode || null;  // Untuk field periode yang tidak ada di tabel baru, bisa dihapus atau disesuaikan

  let whereClause = '';
  const whereValues = [];

  if (pegId) {
    whereClause += (whereClause ? ' AND' : ' WHERE') + ' sdm_mutasi.peg_id = ?';
    whereValues.push(pegId);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM sdm_mutasi ${whereClause}`;
  const dataQuery = `
    SELECT 
      sdm_mutasi.*, 
      p.employee_nm AS nama_pegawai
    FROM sdm_mutasi
    LEFT JOIN sdm_pegawai p ON p.id = sdm_mutasi.peg_id
    ${whereClause}
    ORDER BY sdm_mutasi.mutation_dt DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Hitung total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal menghitung total mutasi:', err);
      return res.status(500).json({ message: 'Gagal ambil total data mutasi' });
    }

    const total = countResult[0].total;

    // Ambil data
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data mutasi:', err);
        return res.status(500).json({ message: 'Gagal ambil data mutasi' });
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

// AMBIL DAFTAR UNIT DI AVESINA
exports.getUnitSearch = (req, res) => {
  const search = `%${req.query.nama || ''}%`;
  const sql = `
    SELECT 
      srvc_unit_id, 
      service_unit_code, 
      srvc_unit_nm AS nama
    FROM service_unit
    WHERE srvc_unit_nm LIKE ?
    ORDER BY srvc_unit_nm
    LIMIT 20
  `;

  db2.query(sql, [search], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data Unit' });
    res.json(result);
  });
};

// Ambil History Presensi
exports.getHistoryMutasi = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    // Ambil semua data THP milik pegawai ini
   const [rows] = await conn.query(
    `SELECT 
      id,
      mutation_dt as tgl_mutasi,
      unit_nm AS nama_unit,
      jabatan
    FROM sdm_mutasi
    WHERE peg_id = ?
    ORDER BY id DESC`,
    [peg_id]
  );

    res.json(rows);
  } catch (err) {
    console.error('Gagal ambil history Mutasi:', err);
    res.status(500).json({ message: 'Gagal ambil history Mutasi', error: err });
  }
};

// controllers/mutasiController.js
exports.getMutasiById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.*,
      p.employee_nm, p.employee_sts, p.pangkat,
      v.employee_nm AS verified_name,
      va.employee_nm AS validated_name
    FROM sdm_mutasi m
    LEFT JOIN sdm_pegawai p ON p.id = m.peg_id
    LEFT JOIN sdm_pegawai v ON v.id = m.verified_by
    LEFT JOIN sdm_pegawai va ON va.id = m.validated_by
    WHERE m.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Gagal ambil data mutasi:', err);
      return res.status(500).json({ message: 'Gagal ambil data mutasi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data mutasi tidak ditemukan' });
    }

    const data = results[0];

    const detail = {
      id: data.id,
      mutation_dt: data.mutation_dt,
      jabatan: data.jabatan,
      unit_id: data.unit_id,
      unit_nm: data.unit_nm,
      peg_id: data.peg_id,
      employee_nm: data.employee_nm, // langsung kirim nama pegawai
      verified_by: data.verified_by,
      verified_at: data.verified_at,
      validated_by: data.validated_by,
      validated_at: data.validated_at,
      pegawai: {
        nama_pegawai: data.employee_nm,
        employee_sts: data.employee_sts,
        pangkat: data.pangkat
      },
      verified_by_name: data.verified_name,
      validated_by_name: data.validated_name
    };

    res.json(detail);
  });
};


// ==========================
// CREATE Mutasi
// ==========================
exports.createMutasi = (req, res) => {
  const { mutation_dt, jabatan, unit_id, unit_nm, peg_id } = req.body;

  if (!mutation_dt || !jabatan || !unit_id || !unit_nm || !peg_id) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const query = `
    INSERT INTO sdm_mutasi (mutation_dt, jabatan, unit_id, unit_nm, peg_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [mutation_dt, jabatan, unit_id, unit_nm, peg_id], (err, result) => {
    if (err) {
      console.error('Gagal menyimpan mutasi:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan mutasi' });
    }

    res.status(201).json({ 
      message: 'Mutasi berhasil disimpan', 
      id: result.insertId 
    });
  });
};


// ==========================
// UPDATE Mutasi
// ==========================
exports.updateMutasi = (req, res) => {
  const { id } = req.params;
  const { mutation_dt, jabatan, unit_id, unit_nm, peg_id } = req.body;

  if (!mutation_dt || !jabatan || !unit_id || !unit_nm || !peg_id) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const query = `
    UPDATE sdm_mutasi
    SET mutation_dt = ?, jabatan = ?, unit_id = ?, unit_nm = ?, peg_id = ?
    WHERE id = ?
  `;

  db.query(query, [mutation_dt, jabatan, unit_id, unit_nm, peg_id, id], (err) => {
    if (err) {
      console.error('Gagal update mutasi:', err);
      return res.status(500).json({ message: 'Gagal update data mutasi' });
    }

    res.json({ message: 'Mutasi berhasil diperbarui' });
  });
};

// ==========================
// VERIFIKASI Mutasi
// ==========================
exports.verifyMutasi = (req, res) => {
  const { id } = req.params;
  const { verified_by } = req.body;

  // verified_at diisi otomatis kalau ada verified_by
  const verifiedAt = verified_by ? new Date() : null;

  const sql = `
    UPDATE sdm_mutasi
    SET verified_by = ?, verified_at = ?
    WHERE id = ?
  `;

  db.query(sql, [verified_by, verifiedAt, id], (err) => {
    if (err) {
      console.error('Gagal update verifikasi:', err);
      return res.status(500).json({ message: 'Gagal memverifikasi', error: err });
    }

    res.json({ message: 'Verifikasi berhasil diperbarui' });
  });
};


// ==========================
// VALIDASI Mutasi
// ==========================
exports.validateMutasi = (req, res) => {
  const { id } = req.params;
  const { validated_by } = req.body;

  // validated_at diisi otomatis jika ada validated_by
  const validatedAt = validated_by ? new Date() : null;

  const sql = `
    UPDATE sdm_mutasi
    SET validated_by = ?, validated_at = ?
    WHERE id = ?
  `;

  db.query(sql, [validated_by, validatedAt, id], (err) => {
    if (err) {
      console.error('Gagal update validasi:', err);
      return res.status(500).json({ message: 'Gagal memvalidasi', error: err });
    }

    res.json({ message: 'Validasi berhasil diperbarui' });
  });
};
