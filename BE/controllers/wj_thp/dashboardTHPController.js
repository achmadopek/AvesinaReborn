const db = require('../../db/connection-lokal');

exports.getTHPUtama = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    // Ambil total penghasilan, potongan, dan thp untuk pegawai & periode tertentu
    const [rows] = await conn.query(
      `SELECT 
        SUM(COALESCE(total_penghasilan, 0)) AS total_penghasilan,
        SUM(COALESCE(total_potongan, 0)) AS total_potongan,
        SUM(COALESCE(thp, 0)) AS thp
       FROM thp_take_home_pay
       WHERE peg_id = ?`,
      [peg_id]
    );

    if (!rows) {
      return res.status(404).json({ message: 'Total tidak ditemukan' });
    }

    res.json({
      total_penghasilan: rows[0].total_penghasilan,
      total_potongan: rows[0].total_potongan,
      thp: rows[0].thp
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal generate THP' });
  }
};

exports.getAllTHP = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    // Ambil semua data THP berdasarkan pegawai (periode semua)
    const [rows] = await conn.query(
      `SELECT
         id AS thp_id,
         thp.peg_id,
         DATE_FORMAT(periode, '%Y-%m-%d') AS periode,
         thp.total_penghasilan,
         thp.total_potongan,
         thp.thp
       FROM thp_take_home_pay thp
       WHERE thp.peg_id = ?
       GROUP BY thp.periode
       ORDER BY thp.periode DESC`,
      [peg_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal ambil history THP' });
  }
};

exports.getDataCart = async (req, res) => {
  try {
    const { peg_id } = req.query;
    if (!peg_id) {
      return res.status(400).json({ message: 'ID pegawai wajib diisi' });
    }

    const conn = db.promise();

    const [rows] = await conn.query(
      `SELECT
          DATE_FORMAT(periode, '%b') AS bulan, -- Jan, Feb, dst
          ROUND(SUM(COALESCE(total_penghasilan, 0)) / 1000000, 2) AS Pendapatan, -- dalam juta
          ROUND(SUM(COALESCE(total_potongan, 0)) / 1000000, 2) AS Potongan,     -- dalam juta
          ROUND(SUM(COALESCE(thp, 0)) / 1000000, 2) AS Bersih                   -- dalam juta
      FROM thp_take_home_pay
      WHERE peg_id = ?
        AND YEAR(periode) = YEAR(CURDATE())
      GROUP BY bulan
      ORDER BY MIN(periode) ASC`,
      [peg_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal ambil data chart THP' });
  }
};

exports.getTopTHP = async (req, res) => {
  try {
    const { periode } = req.query;
    if (!periode) {
      return res.status(400).json({ message: "Periode wajib diisi" });
    }
    
    const formatedPeriode = `${periode}-01`;
    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT 
         p.employee_nm AS nama,
         p.employee_sts AS status,
         t.thp AS gaji_bersih
       FROM thp_take_home_pay t
       JOIN sdm_pegawai p ON p.id = t.peg_id
       WHERE t.periode = ?
       ORDER BY t.thp DESC
       LIMIT 5`,
      [formatedPeriode]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil Top 5 THP" });
  }
};

exports.getBottomTHP = async (req, res) => {
  try {
    const { periode } = req.query;
    if (!periode) {
      return res.status(400).json({ message: "Periode wajib diisi" });
    }
    
    const formatedPeriode = `${periode}-01`;
    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT 
         p.employee_nm AS nama,
         p.employee_sts AS status,
         t.thp AS gaji_bersih
       FROM thp_take_home_pay t
       JOIN sdm_pegawai p ON p.id = t.peg_id
       WHERE t.periode = ?
       ORDER BY t.thp ASC
       LIMIT 5`,
      [formatedPeriode]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil Bottom 5 THP" });
  }
};
