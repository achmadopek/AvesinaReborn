const db_lokal = require("../../db/connection-lokal");

// VERIFIKASI INM HARIAN (HEADER SAJA)
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
    UPDATE inm_harian
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
          error: "Data INM harian tidak ditemukan",
        });
      }

      return res.json({
        success: true,
        harian_id,
        message: "Verifikasi INM berhasil",
      });
    }
  );
};
