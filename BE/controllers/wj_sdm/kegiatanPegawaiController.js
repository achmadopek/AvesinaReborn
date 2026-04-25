const db = require('../../db/connection-lokal');

// ==========================
// GET Semua Event Kegiatan Pegawai (paginasi + search by event)
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  const whereClause = search ? `WHERE event_nm LIKE ?` : '';
  const whereValues = search ? [`%${search}%`] : [];

  const countQuery = `SELECT COUNT(*) AS total FROM sdm_kegiatan ${whereClause}`;
  const dataQuery = `
    SELECT * FROM sdm_kegiatan
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal ambil jumlah total event:', err);
      return res.status(500).json({ message: 'Gagal ambil total data' });
    }

    const total = countResult[0].total;
    const dataValues = [...whereValues, limit, offset];

    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data event:', err);
        return res.status(500).json({ message: 'Gagal ambil data event' });
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

// Ambil History Kegiatan
exports.getHistoryKegiatan = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    // Ambil semua data THP milik pegawai ini
   const [rows] = await conn.query(
    `SELECT 
      k.id,
      k.event_code AS kode_kegiatan,
      k.event_nm AS nama_kegiatan,
      k.event_dt AS tgl_kegiatan,
      dh.nilai
    FROM sdm_kegiatan k
    JOIN sdm_daftar_hadir dh ON k.id = dh.event_id
    WHERE dh.peg_id = ?
    ORDER BY k.id DESC`,
    [peg_id]
  );

    res.json(rows);
  } catch (err) {
    console.error('Gagal ambil history Kegiatan:', err);
    res.status(500).json({ message: 'Gagal ambil history Kegiatan', error: err });
  }
};

// ==========================
// CREATE Event
// ==========================
exports.createKegiatan = (req, res) => {
  const { event_code, event_nm, event_dt, location_nm, penghasilan_id } = req.body;

  if (!event_code || !event_nm || !event_dt || !location_nm) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const sql = `
    INSERT INTO sdm_kegiatan (event_code, event_nm, event_dt, location_nm, penghasilan_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [event_code, event_nm, event_dt, location_nm, penghasilan_id], (err, result) => {
    if (err) {
      console.error('Gagal menyimpan kegiatan:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
    res.status(201).json({ message: 'Kegiatan berhasil disimpan' });
  });
};


// ==========================
// GET Event by ID
// ==========================
exports.getKegiatanById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT k.*, dh.id AS dafdir_id, dh.event_id, dh.peg_id, p.employee_nm, p.employee_sts, p.pangkat, dh.nilai,
      v.employee_nm AS verified_name,
      va.employee_nm AS validated_name 
    FROM sdm_kegiatan k 
    LEFT JOIN sdm_daftar_hadir dh ON dh.event_id = k.id 
    LEFT JOIN sdm_pegawai p on p.id = dh.peg_id
    LEFT JOIN sdm_pegawai v ON v.id = k.verified_by
    LEFT JOIN sdm_pegawai va ON va.id = k.validated_by
    WHERE k.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Gagal ambil data mutasi:', err);
      return res.status(500).json({ message: 'Gagal ambil data mutasi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data kegiatan tidak ditemukan' });
    }

    // Gabungkan data pegawai dengan data user (jika ada)
    const kegiatan = {
      ...results[0],
      pesertas: results
        .filter((r) => r.dafdir_id)
        .map((r) => ({
          id: r.dafdir_id,
          event_id: r.event_id,
          peg_id: r.peg_id,
          employee_nm: r.employee_nm,
          employee_sts: r.employee_sts,
          pangkat: r.pangkat,
          nilai: r.nilai,
        })),
    };

    res.json(kegiatan);
  });
};

// ==========================
// UPDATE Event
// ==========================
exports.updateKegiatan = (req, res) => {
  const { id } = req.params;
  const { event_code, event_nm, event_dt, location_nm, penghasilan_id } = req.body;

  const query = `
    UPDATE sdm_kegiatan SET 
      event_code = ?, event_nm = ?, event_dt = ?, location_nm = ?, penghasilan_id = ?
    WHERE id = ?
  `;

  db.query(query, [event_code, event_nm, event_dt, location_nm, penghasilan_id, id], (err) => {
    if (err) {
      console.error('Gagal update event:', err);
      return res.status(500).json({ message: 'Gagal update event' });
    }

    res.json({ message: 'Event berhasil diperbarui' });
  });
};

// ==========================
// DELETE Event
// ==========================
exports.deleteKegiatan = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM sdm_kegiatan WHERE id = ?';

  db.query(query, [id], (err) => {
    if (err) {
      console.error('Gagal hapus event:', err);
      return res.status(500).json({ message: 'Gagal hapus event' });
    }

    res.json({ message: 'Event berhasil dihapus' });
  });
};

// Cari pegawai berdasarkan nama
exports.searchPegawaiByName = (req, res) => {
  const { nama } = req.query;

  if (!nama || nama.length < 3) {
    return res.status(400).json({ message: 'Minimal 3 huruf untuk pencarian' });
  }

  const query = `
    SELECT id, nik, employee_nm, golongan, nip
    FROM sdm_pegawai
    WHERE employee_nm LIKE ?
    ORDER BY employee_nm ASC
    LIMIT 10
  `;

  db.query(query, [`%${nama}%`], (err, results) => {
    if (err) {
      console.error('Gagal cari pegawai:', err);
      return res.status(500).json({ message: 'Gagal ambil data pegawai' });
    }
    res.json(results);
  });
};

// ==========================
// VERIFIKASI Presensi
// ==========================
exports.verifyKegiatan = (req, res) => {
  const id = req.params.id;
  const { verified_by } = req.body;
  const verifiedAt = verified_by ? new Date() : null;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Gagal ambil connection dari pool:", err);
      return res.status(500).json({ message: "Gagal ambil connection", error: err });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Gagal memulai transaksi:", err);
        return res.status(500).json({ message: "Gagal memulai transaksi", error: err });
      }

      const sql1 = `
        UPDATE sdm_kegiatan 
        SET verified_by = ?, verified_at = ?
        WHERE id = ?
      `;

      connection.query(sql1, [verified_by, verifiedAt, id], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Gagal update verifikasi kegiatan:", err);
            return res.status(500).json({ message: "Gagal verifikasi kegiatan", error: err });
          });
        }

        const sql2 = `
          UPDATE sdm_daftar_hadir 
          SET verified_by = ?, verified_at = ?
          WHERE event_id = ?
        `;

        connection.query(sql2, [verified_by, verifiedAt, id], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Gagal update verifikasi daftar hadir:", err);
              return res.status(500).json({ message: "Gagal verifikasi daftar hadir", error: err });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Gagal commit transaksi:", err);
                return res.status(500).json({ message: "Gagal commit transaksi", error: err });
              });
            }

            connection.release(); // penting: balikin ke pool
            return res.json({ message: "Verifikasi berhasil diperbarui" });
          });
        });
      });
    });
  });
};

// ==========================
// VALIDASI Kegiatan
// ==========================
exports.validityKegiatan = (req, res) => {
  const id = req.params.id;
  const { validated_by } = req.body;
  const validatedAt = validated_by ? new Date() : null;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Gagal ambil connection dari pool:", err);
      return res.status(500).json({ message: "Gagal ambil connection", error: err });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Gagal memulai transaksi:", err);
        return res.status(500).json({ message: "Gagal memulai transaksi", error: err });
      }

      const sql1 = `
        UPDATE sdm_kegiatan 
        SET validated_by = ?, validated_at = ?
        WHERE id = ?
      `;

      connection.query(sql1, [validated_by, validatedAt, id], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Gagal update validasi kegiatan:", err);
            return res.status(500).json({ message: "Gagal memvalidasi kegiatan", error: err });
          });
        }

        const sql2 = `
          UPDATE sdm_daftar_hadir 
          SET validated_by = ?, validated_at = ?
          WHERE event_id = ?
        `;

        connection.query(sql2, [validated_by, validatedAt, id], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Gagal update validasi daftar hadir:", err);
              return res.status(500).json({ message: "Gagal memvalidasi daftar hadir", error: err });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Gagal commit transaksi:", err);
                return res.status(500).json({ message: "Gagal commit transaksi", error: err });
              });
            }

            connection.release(); // penting, biar balik ke pool
            return res.json({ message: "Validasi berhasil diperbarui" });
          });
        });
      });
    });
  });
};

// Tambah peserta ke daftar hadir
exports.addPeserta = (req, res) => {
  const { peg_id, event_id, nilai, verified_by } = req.body;

  if (!peg_id || !event_id) {
    return res.status(400).json({ message: 'Pegawai dan event wajib diisi' });
  }

  // Cek apakah peserta sudah terdaftar
  const checkQuery = `
    SELECT 1 FROM sdm_daftar_hadir
    WHERE peg_id = ? AND event_id = ?
    LIMIT 1
  `;

  db.query(checkQuery, [peg_id, event_id], (err, result) => {
    if (err) {
      console.error('Gagal cek peserta:', err);
      return res.status(500).json({ message: 'Gagal memeriksa peserta' });
    }

    if (result.length > 0) {
      return res.status(409).json({ message: 'Peserta sudah terdaftar dalam kegiatan ini' });
    }

    // Insert peserta baru
    const insertQuery = `
      INSERT INTO sdm_daftar_hadir (peg_id, event_id, nilai, verified_by)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertQuery, [peg_id, event_id, nilai, verified_by || null], (err2) => {
      if (err2) {
        console.error('Gagal tambah peserta ke daftar hadir:', err2);
        return res.status(500).json({ message: 'Gagal simpan peserta' });
      }

      res.status(201).json({ message: 'Peserta berhasil ditambahkan' });
    });
  });
};

// Hapus peserta dari daftar hadir berdasarkan ID
exports.deletePeserta = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID daftar hadir wajib diisi' });
  }

  const query = `
    DELETE FROM sdm_daftar_hadir
    WHERE id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Gagal hapus peserta dari daftar hadir:', err);
      return res.status(500).json({ message: 'Gagal hapus peserta' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }

    res.status(200).json({ message: 'Peserta berhasil dihapus' });
  });
};

// Update peserta di daftar hadir berdasarkan ID
exports.updatePeserta = (req, res) => {
  const { id } = req.params;
  const { peg_id, event_id, verified_by, nilai } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID daftar hadir wajib diisi' });
  }

  if (!peg_id || !event_id) {
    return res.status(400).json({ message: 'Pegawai dan event wajib diisi' });
  }

  // Update data peserta
  const updateQuery = `
    UPDATE sdm_daftar_hadir
    SET peg_id = ?, event_id = ?, verified_by = ?, nilai = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [peg_id, event_id, verified_by || null, nilai || null, id], (err, result) => {
    if (err) {
      console.error('Gagal update peserta di daftar hadir:', err);
      return res.status(500).json({ message: 'Gagal update peserta' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }

    res.status(200).json({ message: 'Peserta berhasil diperbarui' });
  });
};
