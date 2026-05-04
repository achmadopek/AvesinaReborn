const bcrypt = require("bcryptjs");
const db = require("../../db/connection-lokal"); // Koneksi ke database lokal

// ==========================
// GET Semua Komponen (dengan paginasi) + Seacrh
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Filter dari frontend (semua opsional)
  const penghasilan_code = req.query.penghasilan_code || "";
  const penghasilan_nm = req.query.penghasilan_nm || "";
  const jenis = req.query.jenis || "";
  const employee_sts = req.query.employee_sts || "";
  const education = req.query.education || "";
  const golongan = req.query.golongan || "";
  const job_sts = req.query.job_sts || "";
  const unit_id = req.query.unit_id || "";
  const unit_nm = req.query.unit_nm || "";

  // WHERE clause dan nilai parameter
  let baseWhere = "";
  const whereValues = [];

  const addWhere = (field, value) => {
    if (value) {
      baseWhere += (baseWhere ? " AND" : " WHERE") + ` ${field} = ?`;
      whereValues.push(value);
    }
  };

  // LIKE filter
  if (penghasilan_code) {
    baseWhere += (baseWhere ? " AND" : " WHERE") + " penghasilan_code LIKE ?";
    whereValues.push(`%${penghasilan_code}%`);
  }

  if (penghasilan_nm) {
    baseWhere += (baseWhere ? " AND" : " WHERE") + " penghasilan_nm LIKE ?";
    whereValues.push(`%${penghasilan_nm}%`);
  }

  // Enum filters
  addWhere("jenis", jenis);
  addWhere("employee_sts", employee_sts);
  addWhere("education", education);
  addWhere("golongan", golongan);
  addWhere("job_sts", job_sts);
  addWhere("unit_id", unit_id);

  // Query total data
  const countQuery = `SELECT COUNT(*) AS total FROM thp_komponen_penghasilan ${baseWhere}`;

  // Query data paginated
  const dataQuery = `
    SELECT * FROM thp_komponen_penghasilan
    ${baseWhere}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Query total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error("Gagal ambil jumlah total komponen:", err);
      return res
        .status(500)
        .json({ message: "Gagal ambil total data komponen" });
    }

    const total = countResult[0].total;

    // Query data
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error("Gagal ambil data komponen:", err);
        return res.status(500).json({ message: "Gagal ambil data komponen" });
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

// Ambil semua komponen penghasilan (tanpa pagination) untuk keperluan pencocokan saat import
exports.getAllKomponenPenghasilan = (req, res) => {
  const query = `
    SELECT id, penghasilan_code, penghasilan_nm 
    FROM thp_komponen_penghasilan
    ORDER BY penghasilan_code ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Gagal fetch komponen:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server" });
    }

    res.json(results); // langsung array hasil
  });
};

// ==========================
// GET Detail Komponen
// ==========================
exports.getKomponenById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT *
    FROM thp_komponen_penghasilan k 
    WHERE k.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Gagal ambil data komponen" });
    if (results.length === 0)
      return res.status(404).json({ message: "Komponen tidak ditemukan" });

    // Gabungkan data komponen
    const komponen = {
      ...results[0],
    };

    res.json(komponen);
  });
};

// ==========================
// GET Komponen By Jenis
// ==========================
// Controller: getDataByJenis
exports.getDataByJenis = (req, res) => {
  const { jenis } = req.query; // gunakan query param, misal /jenis?jenis=kegiatan

  if (!jenis) {
    return res.status(400).json({ message: "Parameter jenis wajib diisi" });
  }

  const query = `
    SELECT *
    FROM thp_komponen_penghasilan k 
    WHERE k.jenis = ?
  `;

  db.query(query, [jenis], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Gagal ambil daftar komponen" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Komponen tidak ditemukan" });
    }

    // Kembalikan seluruh array komponen
    res.json(results);
  });
};

// ==========================
// CREATE Komponen
// ==========================
exports.createKomponen = (req, res) => {
  const {
    penghasilan_code,
    penghasilan_nm,
    jenis,
    employee_sts,
    education,
    job_sts,
    unit_id,
    unit_nm,
    default_nilai,
    entried_by,
  } = req.body;

  const query = `
    INSERT INTO thp_komponen_penghasilan (
      penghasilan_code, penghasilan_nm, jenis, employee_sts, education, job_sts, unit_id, unit_nm, default_nilai, entried_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    penghasilan_code,
    penghasilan_nm,
    jenis,
    employee_sts,
    education,
    job_sts,
    unit_id,
    unit_nm,
    default_nilai,
    entried_by,
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error("Gagal tambah komponen:", err);
      return res.status(500).json({ error: "Gagal menambahkan data komponen" });
    }
    res.json({ message: "Data komponen berhasil ditambahkan" });
  });
};

// ==========================
// UPDATE Data Komponen
// ==========================
exports.updateKomponen = (req, res) => {
  const { id } = req.params;
  const {
    penghasilan_code,
    penghasilan_nm,
    jenis,
    employee_sts,
    education,
    job_sts,
    unit_id,
    unit_nm,
    default_nilai,
    entried_by,
  } = req.body;

  const query = `
    UPDATE thp_komponen_penghasilan SET
      penghasilan_code = ?, penghasilan_nm = ?, jenis = ?, employee_sts = ?, education = ?, job_sts = ?, unit_id = ?, unit_nm = ?, default_nilai = ?, entried_by = ?
    WHERE id = ?
  `;

  const values = [
    penghasilan_code,
    penghasilan_nm,
    jenis,
    employee_sts,
    education,
    job_sts,
    unit_id,
    unit_nm,
    default_nilai,
    entried_by,
    id,
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error("Gagal update komponen:", err);
      return res.status(500).json({ error: "Gagal memperbarui data komponen" });
    }

    res.json({ message: "Data komponen berhasil diperbarui" });
  });
};
