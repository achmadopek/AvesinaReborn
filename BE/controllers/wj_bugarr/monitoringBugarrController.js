const db2 = require("../../db/connection-lokal");

// ==============================
// GET MASTER ELEMEN BUGARR
// ==============================
exports.getElemenBugarr = async (req, res) => {

  try {

    const [rows] = await db2.promise().query(
      `SELECT 
        id,
        kode,
        nama
      FROM bugarr_elemen
      ORDER BY id`
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data elemen BUGARR"
    });

  }

};

// ==============================
// GET MASTER RUANGAN
// ==============================
exports.getRuangan = async (req, res) => {

  try {

    const [rows] = await db2.promise().query(
      `SELECT 
        id,
        nama_ruangan
      FROM bugarr_ruangan
      ORDER BY nama_ruangan`
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data ruangan"
    });

  }

};

// ==============================
// GET DATA MONITORING
// ==============================
exports.getData = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tgl = req.query.tgl;

    const offset = (page - 1) * limit;

    let where = "";
    let params = [];

    if (tgl && tgl !== "") {
      where = "WHERE DATE_FORMAT(l.tanggal_laporan,'%Y-%m') = ?";
      params.push(tgl);
    }

    const sql = `
      SELECT 
        l.id,
        l.tanggal_laporan,
        r.nama_ruangan,
        r.kepala_ruangan,

        COUNT(d.id) AS total_elemen,
        SUM(CASE WHEN d.foto IS NOT NULL THEN 1 ELSE 0 END) AS upload_foto

      FROM bugarr_laporan l
      JOIN bugarr_ruangan r 
        ON r.id = l.id_ruangan

      LEFT JOIN bugarr_detail d
        ON d.laporan_id = l.id

      ${where}

      GROUP BY l.id

      ORDER BY l.tanggal_laporan DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit);
    params.push(offset);

    const [rows] = await db2.promise().query(sql, params);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error("BUGARR getData error:", err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data"
    });

  }
};


// ==============================
// GET DETAIL BUGARR
// ==============================
exports.getDetail = async (req, res) => {

  try {

    const { laporan_id } = req.params;

    const [rows] = await db2.promise().query(`
      SELECT 
        e.kode,
        e.nama,
        d.foto,
        d.keterangan
      FROM bugarr_detail d
      JOIN bugarr_elemen e
        ON e.id = d.elemen_id
      WHERE d.laporan_id = ?
      ORDER BY e.urutan
    `, [laporan_id]);

    const data = rows.map(r => ({
      kode: r.kode,
      nama: r.nama,
      foto: r.foto ? `/uploads/bugarr/${r.foto}` : null,
      keterangan: r.keterangan
    }));

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail BUGARR"
    });

  }

};


// ==============================
// SAVE BUGARR
// ==============================
exports.saveBugarr = async (req, res) => {

  const conn = await db2.promise().getConnection();

  try {

    const {
      tanggal_laporan,
      id_ruangan,
      keterangan
    } = req.body;

    const files = req.files || [];

    const fileMap = {};

    files.forEach(file => {
      fileMap[file.fieldname] = file;
    });

    await conn.beginTransaction();

    // ======================
    // INSERT LAPORAN
    // ======================

    const [laporan] = await conn.query(
      `INSERT INTO bugarr_laporan 
        (tanggal_laporan,id_ruangan,created_at)
       VALUES (?,?,NOW())`,
      [tanggal_laporan, id_ruangan]
    );

    const laporanId = laporan.insertId;

    // ======================
    // AMBIL MASTER ELEMEN
    // ======================

    const [elemen] = await conn.query(
      `SELECT id,kode FROM bugarr_elemen`
    );

    for (const el of elemen) {

      const key = el.kode.toLowerCase();

      let foto = null;

      if (fileMap[key]) {
        foto = fileMap[key].filename;
      }

      await conn.query(
        `INSERT INTO bugarr_detail
     (laporan_id,elemen_id,foto,keterangan)
     VALUES (?,?,?,?)`,
        [
          laporanId,
          el.id,
          foto,
          keterangan?.[key] || null
        ]
      );

    }

    await conn.commit();

    res.json({
      success: true,
      message: "Laporan BUGARR berhasil disimpan"
    });

  } catch (err) {

    await conn.rollback();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan BUGARR"
    });

  } finally {

    conn.release();

  }
};