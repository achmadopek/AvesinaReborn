const db_lokal = require("../../db/connection-lokal");

// VERIFIKASI SPM HARIAN (HEADER SAJA)
exports.verifikasiHarian = (req, res) => {
  const {
    harian_id,
    status_verifikasi,
    catatan_verifikasi,
    verified_by,
  } = req.body;

  if (!harian_id || status_verifikasi === undefined) {
    return res.status(400).json({
      error: "Data verifikasi tidak lengkap",
    });
  }

  const sqlUpdateHarian = `
    UPDATE spm_harian
    SET
      status_verifikasi = ?,
      catatan_verifikasi = ?,
      verified_by = ?,
      verified_at = NOW(),
      updated_at = NOW()
    WHERE id = ?
  `;

  db_lokal.query(
    sqlUpdateHarian,
    [
      status_verifikasi,
      catatan_verifikasi || null,
      verified_by,
      harian_id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Data SPM harian tidak ditemukan",
        });
      }

      return res.json({
        success: true,
        harian_id,
        message: "Verifikasi SPM berhasil",
      });
    }
  );
};

/* ======================================================
   MASTER DATA
====================================================== */
exports.getRuanganByInstalasi = (req, res) => {

  const peg_id = req.query.peg_id;
  const role = req.query.role;
  const units = req.query.units;

  let sql = "";
  let params = [];

  if (!peg_id) {
    return res.status(400).json({
      success: false,
      message: "peg_id tidak ditemukan",
    });
  }

  if (role === "verifikator_spm") {
    sql = `
      SELECT 
        su.id as ruangan_id,
        su.nama_unit as nama_ruangan,
        su.kode_unit as kode_ruangan,
        su.srvc_unit_id
      FROM spm_unit su 
      JOIN spm_instalasi si ON si.id = su.instalasi_id
      WHERE si.user_instalasi = ?
      ORDER BY su.nama_unit ASC
    `;

    params = [peg_id];

  } else if (role === "user_spm") {

    // handle kalau units kosong
    if (!units || units.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    let unitArray = units;

    if (typeof units === "string") {
      unitArray = [units];
    }

    const placeholders = unitArray.map(() => "?").join(",");

    sql = `
      SELECT 
        su.id as ruangan_id,
        su.nama_unit as nama_ruangan,
        su.kode_unit as kode_ruangan,
        su.srvc_unit_id
      FROM spm_unit su
        WHERE su.srvc_unit_id IN (${placeholders})
      ORDER BY su.nama_unit ASC
    `;

    params = unitArray;

  } else {
    return res.status(403).json({
      success: false,
      message: "Role tidak diizinkan",
    });
  }

  db_lokal.query(sql, params, (err, rows) => {

    if (err) {
      console.error("SQL ERROR:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: rows,
    });

  });
};
