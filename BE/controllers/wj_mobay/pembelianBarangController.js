const db = require("../../db/connection-lokal");

// ======================================
// UNIT LIST
// ======================================
exports.fetchUnitList = async (req, res) => {
  try {
    const allowedUnits = req.user.units || [];

    if (allowedUnits.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const placeholders = allowedUnits.map(() => "?").join(",");

    const [rows] = await db.promise().query(
      `
      SELECT
        unit_id,
        unit_nm
      FROM mobay_unit
      WHERE unit_id IN (${placeholders})
      ORDER BY unit_nm
      `,
      allowedUnits,
    );

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
// BARANG LIST
// ======================================
exports.fetchKategoriList = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT
        *
      FROM mobay_kategori_barang kb
      WHERE kb.aktif = 'Y'
      ORDER BY kb.nama
    `);

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
// BARANG LIST
// ======================================
exports.fetchBarangList = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT
        b.id,
        b.kode_barang,
        b.nama_barang,
        b.satuan,
        b.last_price,
        k.nama AS kategori
      FROM mobay_barang b
      LEFT JOIN mobay_kategori_barang k
        ON k.id = b.kategori_id
      WHERE b.aktif = 'Y'
      ORDER BY b.nama_barang
    `);

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
// DATA PEMBELIAN
// ======================================
exports.getData = async (req, res) => {
  try {
    const { start, end } = req.query;

    const allowedUnits = req.user.units || [];

    if (allowedUnits.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const placeholders = allowedUnits.map(() => "?").join(",");

    const [rows] = await db.promise().query(
      `
      SELECT
        p.*
      FROM mobay_pembelian p
      WHERE p.unit_id IN (${placeholders})
      AND p.tanggal_beli BETWEEN ? AND ?
      ORDER BY p.id DESC
      `,
      [...allowedUnits, start, end],
    );

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
// DETAIL
// ======================================
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [header] = await db.promise().query(
      `
      SELECT *
      FROM mobay_pembelian
      WHERE id = ?
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
      `,
      [id],
    );

    res.json({
      success: true,
      header: header[0] || null,
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

// ======================================
// SAVE BARANG BARU
// ======================================
exports.saveBarang = async (req, res) => {
  try {
    const { kategori_id, nama_barang, satuan } = req.body;

    if (!kategori_id) {
      return res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih",
      });
    }

    if (!nama_barang) {
      return res.status(400).json({
        success: false,
        message: "Nama barang wajib diisi",
      });
    }

    if (!satuan) {
      return res.status(400).json({
        success: false,
        message: "Satuan wajib diisi",
      });
    }

    // cek duplikat
    const [exist] = await db.promise().query(
      `
      SELECT id
      FROM mobay_barang
      WHERE UPPER(nama_barang) = UPPER(?)
      LIMIT 1
      `,
      [nama_barang],
    );

    if (exist.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Barang sudah terdaftar",
      });
    }

    // generate kode barang
    const kodeBarang = "BRG-" + Date.now().toString().slice(-8);

    const [result] = await db.promise().query(
      `
      INSERT INTO mobay_barang
      (
        kode_barang,
        kategori_id,
        nama_barang,
        satuan,
        last_price,
        aktif,
        created_by,
        created_at
      )
      VALUES
      (
        ?, ?, ?, ?, 0,
        'Y',
        ?,
        NOW()
      )
      `,
      [
        kodeBarang,
        kategori_id,
        nama_barang,
        satuan,
        req.user?.employee_id || null,
      ],
    );

    return res.json({
      success: true,
      message: "Barang berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================
// SAVE
// ======================================
exports.save = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const { header, details, employee_id, units } = req.body;

    const allowedUnits = units || [];

    if (!allowedUnits.includes(header.unit_id)) {
      return res.status(403).json({
        message: "Tidak memiliki akses ke unit tersebut",
      });
    }

    await conn.beginTransaction();

    const total = details.reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.harga || 0),
      0,
    );

    const nomorPembelian = "PBL-" + Date.now();

    const [result] = await conn.query(
      `
        INSERT INTO mobay_pembelian
        (
          nomor_pembelian,
          tanggal_beli,
          tanggal_terima,
          unit_id,
          supplier,
          nomor_nota,
          total,
          status,
          keterangan,
          created_by
        )
        VALUES
        (
          ?,?,?,?,?,?,?,?,
          ?,?
        )
        `,
      [
        nomorPembelian,
        header.tanggal_beli,
        header.tanggal_terima,
        header.unit_id,
        header.supplier,
        header.nomor_nota,
        total,
        "DRAFT",
        header.keterangan,
        employee_id,
      ],
    );

    const pembelianId = result.insertId;

    for (const item of details) {
      await conn.query(
        `
        INSERT INTO mobay_pembelian_detail
        (
          pembelian_id,
          barang_id,
          qty,
          satuan,
          harga,
          subtotal
        )
        VALUES
        (
          ?,?,?,?,?,?
        )
        `,
        [
          pembelianId,
          item.barang_id,
          item.qty,
          item.satuan,
          item.harga,
          Number(item.qty) * Number(item.harga),
        ],
      );

      await conn.query(
        `
        UPDATE mobay_barang
        SET
          last_price = ?
        WHERE id = ?
        `,
        [item.harga, item.barang_id],
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Pembelian berhasil disimpan",
      id: pembelianId,
    });
  } catch (err) {
    await conn.rollback();

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    conn.release();
  }
};
