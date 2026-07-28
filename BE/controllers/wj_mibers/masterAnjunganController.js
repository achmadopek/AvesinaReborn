const bcrypt = require("bcryptjs");
const db = require("../../db/connection-avesina"); // Koneksi ke database lokal

// ==========================
// GET Semua Pegawai (dengan paginasi) + Seacrh
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  //const search = req.query.search || '';
  let search = req.query.search || "";
  search = search.toString().trim().toLowerCase(); // buang spasi, newline, dll
  1;

  let baseWhere = "WHERE t.tanggal_periksa = CURDATE()"; // filter default
  const whereValues = [];

  if (search) {
    baseWhere += ` AND (
      LOWER(t.kode_booking) = ? 
      OR LOWER(t.no_rm) = ? 
      OR LOWER(t.nik) = ? 
      OR LOWER(p1.patient_nm) LIKE ? 
      OR LOWER(p2.patient_nm) LIKE ? 
      OR LOWER(t.nama_poli) LIKE ?
    )`;
    whereValues.push(
      `${search}`,
      `${search}`,
      `${search}`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    );
  }

  const countQuery = `SELECT COUNT(*) AS total FROM temp_antrian t 
    LEFT JOIN patient p1 ON p1.mr_id = t.mr_id
    LEFT JOIN patient p2 ON p2.mr_code = t.no_rm 
    ${baseWhere}`;
  const dataQuery = `
    SELECT 
        t.kode_booking, 
        t.kode_poli, 
        t.nama_poli, 
        t.no_rm,
        t.nik,
        COALESCE(p1.patient_nm, p2.patient_nm) AS patient_nm,
        COALESCE(p1.address, p2.address) AS address,
        t.no_antrian, 
        t.angka_antrian + 0 AS angka_antrian_num
    FROM temp_antrian t
    LEFT JOIN patient p1 ON p1.mr_id = t.mr_id
    LEFT JOIN patient p2 ON p2.mr_code = t.no_rm
    ${baseWhere}
    ORDER BY t.kode_poli, angka_antrian_num ASC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Query total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error("Gagal ambil jumlah total antrian:", err);
      return res
        .status(500)
        .json({ message: "Gagal ambil total data antrian" });
    }

    const total = countResult[0].total;

    // Query data
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error("Gagal ambil data antrian:", err);
        return res.status(500).json({ message: "Gagal ambil data antrian" });
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

exports.getDataPoli = (req, res) => {
  const dataQuery = `
    SELECT DISTINCT 
      nama_poli AS nama,
      kode_poli AS kode,
      CASE 
        WHEN kode_poli = 'IRM' THEN CONCAT('INSTALASI ', nama_poli)
        ELSE CONCAT('POLI ', nama_poli)
      END AS label
    FROM temp_antrian
    ORDER BY nama_poli ASC;
  `;

  db.query(dataQuery, (err, results) => {
    if (err) {
      console.error("Gagal ambil data poli:", err);
      return res.status(500).json({ message: "Gagal ambil data poli" });
    }

    res.json(results); // langsung array hasil
  });
};
