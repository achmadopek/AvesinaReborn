const db = require("../../db/connection-lokal");

exports.getData = async (req, res) => {
  try {
    const { start, end, status, units } = req.body;

    const allowedUnits = units || [];

    if (allowedUnits.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const params = [...allowedUnits];

    const placeholders = allowedUnits.map(() => "?").join(",");

    let sql = `
      SELECT
        p.*,
        u.unit_nm
      FROM mobay_pembelian p
      LEFT JOIN mobay_unit u
        ON u.unit_id = p.unit_id
      WHERE p.unit_id IN (${placeholders})
    `;

    if (start && end) {
      sql += `
        AND p.tanggal_beli
        BETWEEN ? AND ?
      `;

      params.push(start);
      params.push(end);
    }

    if (status) {
      sql += `
        AND p.status = ?
      `;

      params.push(status);
    }

    sql += `
      ORDER BY p.id DESC
    `;

    const [rows] = await db.promise().query(sql, params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [header] = await db.promise().query(
      `
        SELECT
          p.*,
          u.unit_nm
        FROM mobay_pembelian p
        LEFT JOIN mobay_unit u
          ON u.unit_id = p.unit_id
        WHERE p.id = ?
        `,
      [id],
    );

    const [detail] = await db.promise().query(
      `
        SELECT
          d.*,
          b.nama_barang
        FROM mobay_pembelian_detail d
        JOIN mobay_barang b
          ON b.id = d.barang_id
        WHERE d.pembelian_id = ?
        ORDER BY b.nama_barang
        `,
      [id],
    );

    res.json({
      success: true,
      header: header[0],
      detail,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
