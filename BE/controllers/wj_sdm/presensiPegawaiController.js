const bcrypt = require('bcrypt');
const db = require('../../db/connection-lokal'); // Koneksi ke database lokal

// ==========================
// GET Data Presensi (dengan paginasi)
// ==========================
exports.getPresensi = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const pegId = req.query.peg_id || null;
  const periode = req.query.periode || null;

  let whereClause = '';
  const whereValues = [];

  if (pegId) {
    whereClause += (whereClause ? ' AND' : ' WHERE') + ' sdm_presensi.peg_id = ?';
    whereValues.push(pegId);
  }

  if (periode) {
    whereClause += (whereClause ? ' AND' : ' WHERE') + ' sdm_presensi.periode = ?';
    whereValues.push(periode);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM sdm_presensi ${whereClause}`;
  const dataQuery = `
    SELECT 
      sdm_presensi.*, 
      p.employee_nm AS nama_pegawai
    FROM sdm_presensi
    LEFT JOIN sdm_pegawai p ON p.id = sdm_presensi.peg_id
    ${whereClause}
    ORDER BY sdm_presensi.periode DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Hitung total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal menghitung total presensi:', err);
      return res.status(500).json({ message: 'Gagal ambil total data presensi' });
    }

    const total = countResult[0].total;

    // Ambil data
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data presensi:', err);
        return res.status(500).json({ message: 'Gagal ambil data presensi' });
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

// Ambil History Presensi
exports.getHistoryPresensi = async (req, res) => {
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
      periode,
      prosentase_alpha,
      nilai
    FROM sdm_presensi
    WHERE peg_id = ?
    ORDER BY id DESC`,
    [peg_id]
  );

    res.json(rows);
  } catch (err) {
    console.error('Gagal ambil history Presensi:', err);
    res.status(500).json({ message: 'Gagal ambil history Presensi', error: err });
  }
};

// controllers/presensiController.js
exports.getPresensiById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      ps.*,
      p.employee_nm AS nama_pegawai, 
      p.employee_sts, 
      p.pangkat,
      v.employee_nm AS verified_name,
      va.employee_nm AS validated_name
    FROM sdm_presensi ps
    LEFT JOIN sdm_pegawai p ON p.id = ps.peg_id
    LEFT JOIN sdm_pegawai v ON v.id = ps.verified_by
    LEFT JOIN sdm_pegawai va ON va.id = ps.validated_by
    WHERE ps.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Gagal ambil data presensi:', err);
      return res.status(500).json({ message: 'Gagal ambil data presensi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data presensi tidak ditemukan' });
    }

    const data = results[0];

    const detail = {
      id: data.id,
      periode: data.periode,
      prosentase_alpha: data.prosentase_alpha,
      nilai: data.nilai,
      peg_id: data.peg_id,
      verified_by: data.verified_by,
      verified_at: data.verified_at,
      validated_by: data.validated_by,
      validated_at: data.validated_at,
      pegawai: {
        nama_pegawai: data.nama_pegawai,
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
// CREATE Presensi
// ==========================
exports.createPresensi = (req, res) => {
  const { periode, prosentase_alpha, nilai, peg_id } = req.body;

  if (!periode || prosentase_alpha == null || nilai == null || !peg_id) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const query = `
    INSERT INTO sdm_presensi (periode, prosentase_alpha, nilai, peg_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [periode, prosentase_alpha, nilai, peg_id], (err, result) => {
    if (err) {
      console.error('Gagal menyimpan presensi:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan presensi' });
    }

    res.status(201).json({ message: 'Presensi berhasil disimpan' });
  });
};

// ==========================
// UPDATE Presensi
// ==========================
exports.updatePresensi = (req, res) => {
  const { id } = req.params;
  const { periode, prosentase_alpha, nilai, peg_id } = req.body;

  if (!periode || prosentase_alpha == null || nilai == null || !peg_id) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const query = `
    UPDATE sdm_presensi
    SET periode = ?, prosentase_alpha = ?, nilai = ?, peg_id = ?
    WHERE id = ?
  `;

  db.query(query, [periode, prosentase_alpha, nilai, peg_id, id], (err) => {
    if (err) {
      console.error('Gagal update presensi:', err);
      return res.status(500).json({ message: 'Gagal update data presensi' });
    }

    res.json({ message: 'Presensi berhasil diperbarui' });
  });
};

// ==========================
// VERIFIKASI Presensi
// ==========================
exports.verifyPresensi = (req, res) => {
  const id = req.params.id;
  const { verified_by } = req.body;

  const verifiedAt = verified_by ? new Date() : null;

  const sql = `
    UPDATE sdm_presensi 
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
// VALIDASI Presensi
// ==========================
exports.validatePresensi = (req, res) => {
  const id = req.params.id;
  const { validated_by } = req.body;

  const validatedAt = validated_by ? new Date() : null;

  const sql = `
    UPDATE sdm_presensi 
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
