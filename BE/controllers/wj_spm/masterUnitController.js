const bcrypt = require("bcryptjs");
const db_lokal = require("../../db/connection-lokal"); // Koneksi ke database spm

// ==========================
// GET Semua Unit (dengan paginasi)
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const nama = req.query.nama || "";

  let baseWhere = "";
  const whereValues = [];

  if (nama) {
    baseWhere += (baseWhere ? " AND" : " WHERE") + " nama LIKE ?";
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
      console.error("Gagal ambil jumlah total unit:", err);
      return res.status(500).json({ message: "Gagal ambil total data unit" });
    }

    const total = countResult[0].total;

    // Query data pegawai
    db_lokal.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error("Gagal ambil data unit:", err);
        return res.status(500).json({ message: "Gagal ambil data unit" });
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
