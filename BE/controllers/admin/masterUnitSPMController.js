const db = require('../../db/connection-lokal');
const db2 = require('../../db/connection-aset');

// ==========================
// GET DATA UNIT SPM
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
    where += ' AND u.kode_unit LIKE ? ';
    values.push(`%${kode}%`);
  }

  if (nama) {
    where += ' AND u.nama_unit LIKE ? ';
    values.push(`%${nama}%`);
  }

  // =========================
  // COUNT (TANPA JOIN GROUP)
  // =========================
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM spm_unit u
    ${where}
  `;

  // =========================
  // DATA QUERY
  // =========================
  const dataQuery = `
    SELECT
      u.id,
      u.kode_unit,
      u.nama_unit,
      u.srvc_unit_id,
      u.bidang_id,
      u.instalasi_id,
      u.kepala_unit,
      u.status,

      b.kode_bidang,
      b.nama_bidang,

      i.kode_instalasi,
      i.nama_instalasi,

      g.id AS group_pelayanan_id,
      g.kode_group,
      g.nama_group,

      p.employee_nm AS kepala_unit_nama

    FROM spm_unit u

    LEFT JOIN spm_bidang b ON b.id = u.bidang_id
    LEFT JOIN spm_instalasi i ON i.id = u.instalasi_id
    LEFT JOIN spm_unit_group_pelayanan ug ON ug.unit_id = u.id
    LEFT JOIN spm_group_pelayanan g ON g.id = ug.group_pelayanan_id
    LEFT JOIN sdm_pegawai p ON p.id = u.kepala_unit

    ${where}

    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...values, limit, offset];

  // =========================
  // EXECUTE COUNT
  // =========================
  db.query(countQuery, values, (err, countResult) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal hitung data unit' });
    }

    const total = countResult[0].total;

    // =========================
    // EXECUTE DATA
    // =========================
    db.query(dataQuery, dataValues, (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Gagal ambil data unit' });
      }

      if (results.length === 0) {
        return res.json({
          data: [],
          total,
          page,
          totalPages: Math.ceil(total / limit)
        });
      }

      // =========================
      // GROUPING (ANTI DUPLIKAT)
      // =========================
      const grouped = {};

      results.forEach(r => {

        if (!grouped[r.id]) {
          grouped[r.id] = {
            id: r.id,
            kode_unit: r.kode_unit,
            nama_unit: r.nama_unit,
            srvc_unit_id: r.srvc_unit_id,
            bidang_id: r.bidang_id,
            instalasi_id: r.instalasi_id,
            kepala_unit: r.kepala_unit,
            status: r.status,

            kode_bidang: r.kode_bidang,
            nama_bidang: r.nama_bidang,

            kode_instalasi: r.kode_instalasi,
            nama_instalasi: r.nama_instalasi,

            kepala_unit_nama: r.kepala_unit_nama,

            group_pelayanan: []
          };
        }

        if (r.group_pelayanan_id) {
          grouped[r.id].group_pelayanan.push({
            id: r.group_pelayanan_id,
            kode_group: r.kode_group,
            nama_group: r.nama_group
          });
        }

      });

      const groupedData = Object.values(grouped);

      // =========================
      // AMBIL MASTER UNIT (DB2)
      // =========================
      const ids = groupedData.map(r => r.srvc_unit_id).filter(Boolean);

      if (ids.length === 0) {
        return res.json({
          data: groupedData,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        });
      }

      const placeholders = ids.map(() => '?').join(',');

      const sqlMaster = `
        SELECT
          srvc_unit_id,
          service_unit_code,
          srvc_unit_nm
        FROM service_unit
        WHERE srvc_unit_id IN (${placeholders})
      `;

      db2.query(sqlMaster, ids, (err, masterUnits) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Gagal ambil master unit' });
        }

        const mapMaster = {};
        masterUnits.forEach(u => {
          mapMaster[u.srvc_unit_id] = u;
        });

        // =========================
        // FINAL MERGE
        // =========================
        const finalData = groupedData.map(u => ({
          ...u,
          master_unit_nama: mapMaster[u.srvc_unit_id]?.srvc_unit_nm || null,
          master_kode: mapMaster[u.srvc_unit_id]?.service_unit_code || null
        }));

        res.json({
          data: finalData,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        });

      });

    });

  });

};

exports.getUnitSearch = async (req, res) => {

  const search = `%${req.query.nama || ''}%`;

  const sql = `
    SELECT
      srvc_unit_id,
      service_unit_code,
      srvc_unit_nm
    FROM service_unit
    WHERE srvc_unit_nm LIKE ?
    ORDER BY srvc_unit_nm ASC
    LIMIT 20
  `;

  db2.query(sql, [search], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal ambil master unit' });
    }

    res.json(result);

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
// SEARCH INSTALASI
// ==========================
exports.searchInstalasi = (req, res) => {

  const search = `%${req.query.nama || ''}%`;
  const bidang_id = req.query.bidang_id || null;

  let sql = `
    SELECT
      id,
      bidang_id,
      nama_instalasi,
      kode_instalasi
    FROM spm_instalasi
    WHERE nama_instalasi LIKE ?
  `;

  const params = [search];

  if (bidang_id) {
    sql += ` AND bidang_id = ?`;
    params.push(bidang_id);
  }

  sql += `
    ORDER BY nama_instalasi ASC
    LIMIT 20
  `;

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal ambil instalasi' });
    }

    res.json(result);

  });

};

// ==========================
// SEARCH GROUP PELAYANAN
// ==========================
exports.searchGroupPelayanan = (req, res) => {

  const search = `%${req.query.nama || ''}%`;

  const sql = `
    SELECT
      id,
      nama_group,
      kode_group
    FROM spm_group_pelayanan
    WHERE nama_group LIKE ?
    ORDER BY nama_group ASC
    LIMIT 20
  `;

  db.query(sql, [search], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal ambil group pelayanan' });
    }

    res.json(result);

  });

};

exports.createUnit = (req, res) => {

  const {
    instalasi_id,
    bidang_id,
    group_pelayanan_id,
    srvc_unit_id,
    nama_unit,
    kode_unit,
    kepala_unit
  } = req.body;

  if (!group_pelayanan_id || group_pelayanan_id.length === 0) {
    return res.status(400).json({
      message: "group_pelayanan_id wajib diisi"
    });
  }

  db.getConnection((err, conn) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Gagal ambil koneksi" });
    }

    conn.beginTransaction((err) => {

      if (err) {
        conn.release();
        return res.status(500).json({ message: "Gagal start transaction" });
      }

      // 1. insert spm_unit (TANPA group_pelayanan_id)
      const sqlUnit = `
        INSERT INTO spm_unit (
          instalasi_id,
          bidang_id,
          srvc_unit_id,
          nama_unit,
          kode_unit,
          kepala_unit,
          status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
      `;

      conn.query(sqlUnit, [
        instalasi_id,
        bidang_id,
        srvc_unit_id,
        nama_unit,
        kode_unit,
        kepala_unit
      ], (err, result) => {

        if (err) {
          return db.rollback(() => {
            console.error(err);
            res.status(500).json({ message: "Gagal insert unit" });
          });
        }

        const unit_id = result.insertId;

        // pastikan array
        let groupArray = group_pelayanan_id;
        if (!Array.isArray(groupArray)) {
          groupArray = [groupArray];
        }

        // 2. insert relasi
        const values = groupArray.map(gid => [unit_id, gid]);

        const sqlRelasi = `
          INSERT INTO spm_unit_group_pelayanan (unit_id, group_pelayanan_id)
          VALUES ?
        `;

        conn.query(sqlRelasi, [values], (err) => {

          if (err) {
            return conn.rollback(() => {
              console.error(err);
              res.status(500).json({ message: "Gagal insert relasi group pelayanan" });
            });
          }

          conn.commit((err) => {
            if (err) {
              return conn.rollback(() => {
                console.error(err);
                res.status(500).json({ message: "Gagal commit transaction" });
              });
            }

            res.json({
              message: "Unit berhasil ditambahkan",
              unit_id
            });
          });

        });

      });

    });
  });
};

exports.updateUnit = (req, res) => {

  const id = req.params.id;

  const {
    instalasi_id,
    bidang_id,
    group_pelayanan_id,
    srvc_unit_id,
    nama_unit,
    kode_unit,
    kepala_unit,
    status
  } = req.body;

  db.getConnection((err, conn) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Gagal ambil koneksi" });
    }

    conn.beginTransaction((err) => {

      if (err) {
        conn.release();
        return res.status(500).json({ message: "Gagal start transaction" });
      }

      const sqlUpdate = `
        UPDATE spm_unit SET
          instalasi_id = ?,
          bidang_id = ?,
          srvc_unit_id = ?,
          nama_unit = ?,
          kode_unit = ?,
          kepala_unit = ?,
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      conn.query(sqlUpdate, [
        instalasi_id,
        bidang_id,
        srvc_unit_id,
        nama_unit,
        kode_unit,
        kepala_unit,
        status,
        id
      ], (err) => {

        if (err) {
          return conn.rollback(() => {
            conn.release();
            console.error(err);
            res.status(500).json({ message: "Gagal update unit" });
          });
        }

        const sqlDeleteRelasi = `
          DELETE FROM spm_unit_group_pelayanan
          WHERE unit_id = ?
        `;

        conn.query(sqlDeleteRelasi, [id], (err) => {

          if (err) {
            return conn.rollback(() => {
              conn.release();
              console.error(err);
              res.status(500).json({ message: "Gagal hapus relasi lama" });
            });
          }

          if (!group_pelayanan_id || group_pelayanan_id.length === 0) {
            return conn.commit((err) => {
              conn.release();

              if (err) {
                console.error(err);
                return res.status(500).json({ message: "Gagal commit" });
              }

              return res.json({ message: "Unit berhasil diupdate (tanpa group)" });
            });
          }

          let groupArray = Array.isArray(group_pelayanan_id)
            ? group_pelayanan_id
            : [group_pelayanan_id];

          groupArray = [...new Set(groupArray)];

          const values = groupArray.map(gid => [id, gid]);

          const sqlInsertRelasi = `
            INSERT INTO spm_unit_group_pelayanan (unit_id, group_pelayanan_id)
            VALUES ?
          `;

          conn.query(sqlInsertRelasi, [values], (err) => {

            if (err) {
              return conn.rollback(() => {
                conn.release();
                console.error(err);
                res.status(500).json({ message: "Gagal insert relasi baru" });
              });
            }

            conn.commit((err) => {
              conn.release();

              if (err) {
                console.error(err);
                return res.status(500).json({ message: "Gagal commit" });
              }

              res.json({ message: "Unit berhasil diupdate" });
            });

          });

        });

      });

    });

  });

};

exports.deleteUnit = (req, res) => {

  const id = req.params.id;

  const sql = `
    UPDATE spm_unit
    SET status = 0,
        updated_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal nonaktifkan unit' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }

    res.json({ message: 'Unit berhasil dinonaktifkan' });

  });

};