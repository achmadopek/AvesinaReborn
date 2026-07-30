const db = require("../../db/connection-lokal");

// ======================================
// GET DATA (dengan filter jenis)
// ======================================
exports.getData = async (req, res) => {
  try {
    const { start, end, status, units, jenis } = req.body;

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
        u.unit_nm,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id 
            AND d.has_rincian = 1
          ) THEN 'JASA_DENGAN_RINCIAN'
          WHEN EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id
          ) THEN 'BARANG'
          ELSE 'JASA_TANPA_RINCIAN'
        END as jenis_transaksi
      FROM mobay_pembelian p
      LEFT JOIN mobay_unit u
        ON u.unit_id = p.unit_id
      WHERE p.unit_id IN (${placeholders})
    `;

    if (jenis) {
      if (jenis === "BARANG") {
        sql += `
          AND EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id
          )
          AND NOT EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id 
            AND d.has_rincian = 1
          )
        `;
      } else if (jenis === "JASA") {
        sql += `
          AND NOT EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id
          )
        `;
      } else if (jenis === "JASA_RINCIAN") {
        sql += `
          AND EXISTS (
            SELECT 1 
            FROM mobay_pembelian_detail d 
            WHERE d.pembelian_id = p.id 
            AND d.has_rincian = 1
          )
        `;
      }
    }

    if (start && end) {
      sql += `
        AND p.tanggal_beli BETWEEN ? AND ?
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

// ======================================
// GET DETAIL (dengan rincian)
// ======================================
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil header
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

    // Ambil detail barang/jasa
    const [detail] = await db.promise().query(
      `
      SELECT
        d.*,
        b.nama_barang,
        d.has_rincian
      FROM mobay_pembelian_detail d
      JOIN mobay_barang b
        ON b.id = d.barang_id
      WHERE d.pembelian_id = ?
      ORDER BY d.id
      `,
      [id],
    );

    // Ambil rincian berdasarkan pembelian_id
    const [rincian] = await db.promise().query(
      `
      SELECT 
        r.*,
        r.pembelian_id as jasa_id
      FROM mobay_pembelian_rincian r
      WHERE r.pembelian_id = ?
      ORDER BY r.id
      `,
      [id],
    );

    res.json({
      success: true,
      header: header[0],
      detail: detail,
      rincian: rincian || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
