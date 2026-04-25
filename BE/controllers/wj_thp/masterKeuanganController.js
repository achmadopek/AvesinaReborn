const bcrypt = require('bcrypt');
const db = require('../../db/connection-lokal'); // Koneksi ke database lokal
const { verify } = require('jsonwebtoken');

// ==========================
// GET Detail Pegawai by ID (beserta data rekening jika ada)
// ==========================
exports.getPegawaiById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT p.*, r.id AS rek_id, r.*
    FROM sdm_pegawai p 
    LEFT JOIN thp_rekening r ON r.peg_id = p.id 
    WHERE p.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil data pegawai' });
    if (results.length === 0) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });

    const pegawai = {
      ...results[0],
      rekenings: results
        .filter((r) => r.rek_id)
        .map((r) => ({
          id: r.rek_id,
          rek_number: r.rek_number,
          rek_name: r.rek_name,
          bank_name: r.bank_name,
          bank_code: r.bank_code,
          description: r.description,
          status: r.status,
          rek_verification_by: r.verified_by,
          rek_validation_by: r.validated_by,
        })),
    };

    res.json(pegawai);
  });
};

// ==========================
// UPDATE Data Rekening Pegawai
// ==========================
exports.updateRekening = (req, res) => {
  const { id } = req.params;
  const {
    rek_number,
    rek_name,
    description,
    bank_name,
    bank_code,
    status,
    verified_by,
  } = req.body;

  if (!rek_number || !rek_name || !bank_name || !bank_code) {
    return res.status(400).json({ message: 'Data untuk update rekening tidak lengkap' });
  }

  const checkQuery = 'SELECT * FROM thp_rekening WHERE id = ?';
  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      console.error('Gagal memeriksa rekening:', err);
      return res.status(500).json({ message: 'Gagal memeriksa rekening' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan' });
    }

    const verifiedByInt = verified_by ? parseInt(verified_by) : null;

    const updateQuery = `
      UPDATE thp_rekening SET
        rek_number = ?,
        rek_name = ?,
        description = ?,
        bank_name = ?,
        bank_code = ?,
        status = ?,
        verified_by = ?,
        verified_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateQuery,
      [
        rek_number,
        rek_name,
        description,
        bank_name,
        bank_code,
        status,
        verifiedByInt,
        id,
      ],
      (err, result) => {
        if (err) {
          console.error('Gagal mengupdate rekening:', err);
          return res.status(500).json({ message: 'Gagal mengupdate rekening' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Rekening tidak ditemukan' });
        }

        res.json({ message: 'Rekening berhasil diperbarui' });
      }
    );
  });
};

// ==========================
// CREATE Rekening Baru untuk Pegawai
// ==========================
exports.createRekening = async (req, res) => {
  const {
    peg_id,
    rek_number,
    rek_name,
    description,
    bank_name,
    bank_code,
    verified_by,
  } = req.body;

  if (!peg_id || !rek_number || !rek_name || !bank_name) {
    return res.status(400).json({ message: 'Data untuk create rekening tidak lengkap' });
  }

  // Cek duplikasi nomor rekening
  const checkRekQuery = 'SELECT * FROM thp_rekening WHERE rek_number = ?';
  db.query(checkRekQuery, [rek_number], (err, existing) => {
    if (err) {
      console.error('Gagal memeriksa nomor rekening:', err);
      return res.status(500).json({ message: 'Gagal memeriksa nomor rekening' });
    }

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nomor rekening sudah digunakan' });
    }

    // Ambil NIK pegawai (hanya sebagai validasi, password tidak digunakan di sini)
    const pegawaiQuery = 'SELECT nik FROM sdm_pegawai WHERE id = ?';
    db.query(pegawaiQuery, [peg_id], async (err, pegawaiResult) => {
      if (err) {
        console.error('Gagal mengambil data pegawai:', err);
        return res.status(500).json({ message: 'Gagal mengambil data pegawai' });
      }

      if (pegawaiResult.length === 0) {
        return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
      }

      const status = 'Aktif'; // Default status rekening
      const verifiedByInt = verified_by ? parseInt(verified_by) : null;

      const insertQuery = `
        INSERT INTO thp_rekening (
          peg_id,
          rek_number,
          rek_name,
          description,
          bank_name,
          bank_code,
          status,
          verified_by,
          verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        insertQuery,
        [
          peg_id,
          rek_number,
          rek_name,
          description,
          bank_name,
          bank_code,
          status,
          verifiedByInt,
        ],
        (err) => {
          if (err) {
            console.error('Gagal menyimpan rekening:', err);
            return res.status(500).json({ message: 'Gagal menyimpan rekening' });
          }

          res.json({ message: 'Rekening berhasil ditambahkan' });
        }
      );
    });
  });
};

// ==========================
exports.validityRekening = (req, res) => {
  const id = req.params.id;
  const { validated_by } = req.body;

  const validatedAt = validated_by ? new Date() : null;

  const sql = `
    UPDATE thp_rekening 
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
