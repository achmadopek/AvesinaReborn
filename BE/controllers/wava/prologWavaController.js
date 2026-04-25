const db2 = require("../../db/connection-lokal");

exports.getPerkenalanDiri = async (req, res) => {
  try {
    const [rows] = await db2.promise().query(`
      SELECT 
        id,
        kode,
        judul,
        teks,
        bahasa
      FROM wava_prolog
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Prolog WAVA belum tersedia"
      });
    }

    res.json({
      success: true,
      data: {
        text: rows[0].teks,
        lang: rows[0].bahasa,
        kode: rows[0].kode
      }
    });

  } catch (error) {
    console.error("getPerkenalanDiri error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil prolog WAVA"
    });
  }
};
