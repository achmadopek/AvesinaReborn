const bcrypt = require('bcrypt');
const db = require('../../db/connection-lokal'); // Koneksi ke database lokal

// ==========================
// GET Semua Komponen (dengan paginasi) + Seacrh
// ==========================
exports.getData = (req, res) => {  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const potongan_code = req.query.potongan_code || '';
  const potongan_nm = req.query.potongan_nm || '';

  let baseWhere = '';
  const whereValues = [];

  if (potongan_code) {
    baseWhere += (baseWhere ? ' AND' : ' WHERE') + ' kopot.potongan_code LIKE ?';
    whereValues.push(`%${potongan_code}%`);
  }

  if (potongan_nm) {
    baseWhere += (baseWhere ? ' AND' : ' WHERE') + ' kopot.potongan_nm LIKE ?';
    whereValues.push(`%${potongan_nm}%`);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM thp_komponen_potongan kopot ${baseWhere}`;
  const dataQuery = `
    SELECT kopot.id, kopot.potongan_code, kopot.potongan_nm, kopot.employee_sts, kopot.education, kopot.golongan, kopot.default_nilai, kopot.satuan, 
    kopot.penghasilan_id, kopot.jenis, kopot.entried_by, kopeng.id AS kopeng_id, kopeng.penghasilan_code, kopeng.penghasilan_nm
    FROM thp_komponen_potongan kopot 
    JOIN thp_komponen_penghasilan kopeng ON kopot.penghasilan_id = kopeng.id
    ${baseWhere}
    ORDER BY kopot.id DESC
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...whereValues, limit, offset];

  // Query total
  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error('Gagal ambil jumlah total komponen:', err);
      return res.status(500).json({ message: 'Gagal ambil total data komponen' });
    }

    const total = countResult[0].total;

    // Query data komponen potongan
    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error('Gagal ambil data komponen:', err);
        return res.status(500).json({ message: 'Gagal ambil data komponen' });
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

// Ambil semua komponen potongan (tanpa pagination) untuk keperluan pencocokan saat import
exports.getAllKomponenPotongan = (req, res) => {
  const query = `
    SELECT id, potongan_code, potongan_nm 
    FROM thp_komponen_potongan
    ORDER BY potongan_code ASC
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
    FROM thp_komponen_potongan k 
    WHERE k.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data komponen' });
    if (results.length === 0) return res.status(404).json({ message: 'Komponen tidak ditemukan' });

    // Gabungkan data komponen
    const komponen = {
      ...results[0],
    };

    res.json(komponen);
  });
};

// ==========================
// CREATE Komponen
// ==========================
exports.createKomponen = (req, res) => {

  const {
    potongan_code, potongan_nm, employee_sts, golongan, education, penghasilan_id, default_nilai, satuan, jenis, entried_by
  } = req.body;

  const query = `
    INSERT INTO thp_komponen_potongan (
      potongan_code, potongan_nm, employee_sts, golongan, education, penghasilan_id, default_nilai, satuan, jenis, entried_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    potongan_code, potongan_nm, employee_sts, golongan, education, penghasilan_id, default_nilai, satuan, jenis, entried_by
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Gagal tambah komponen:', err);
      return res.status(500).json({ error: 'Gagal menambahkan data komponen' });
    }
    res.json({ message: 'Data komponen berhasil ditambahkan' });
  });
};

// ==========================
// UPDATE Data Komponen
// ==========================
exports.updateKomponen = (req, res) => {
  const { id } = req.params;
  const {
    potongan_code, potongan_nm, employee_sts, golongan, education, penghasilan_id, default_nilai, satuan, jenis, entried_by
  } = req.body;

  const query = `
    UPDATE thp_komponen_potongan SET
      potongan_code = ?, potongan_nm = ?, employee_sts = ?,  golongan = ?, education = ?, penghasilan_id = ?, default_nilai = ?, satuan = ?, jenis = ?, entried_by = ?
    WHERE id = ?
  `;

  const values = [
    potongan_code, potongan_nm, employee_sts, golongan, education, penghasilan_id, default_nilai, satuan, jenis, entried_by, id
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Gagal update komponen:', err);
      return res.status(500).json({ error: 'Gagal memperbarui data komponen' });
    }

    res.json({ message: 'Data komponen berhasil diperbarui' });
  });
};
