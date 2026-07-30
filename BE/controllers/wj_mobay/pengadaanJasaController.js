const db = require("../../db/connection-lokal");

// ======================================
// UNIT LIST
// ======================================
exports.fetchUnitList = async (req, res) => {
  try {
    const allowedUnits = req.body.units || [];

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
// GET BY ID
// ======================================
exports.getById = async (req, res) => {
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
      SELECT *
      FROM mobay_pembelian_detail
      WHERE pembelian_id = ?
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
      header: header[0] || null,
      detail: detail || [],
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

// ======================================
// GET DETAIL (dengan join nama barang)
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

    // Ambil rincian - menggunakan pembelian_id
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
      header: header[0] || null,
      detail: detail || [],
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

// ======================================
// SAVE BARANG BARU
// ======================================
// ======================================
// SAVE BARANG/JASA BARU
// ======================================
exports.saveBarang = async (req, res) => {
  try {
    const { kategori_id, nama_barang, satuan, harga_satuan } = req.body;

    if (!kategori_id) {
      return res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih",
      });
    }

    if (!nama_barang) {
      return res.status(400).json({
        success: false,
        message: "Nama barang/jasa wajib diisi",
      });
    }

    if (!satuan) {
      return res.status(400).json({
        success: false,
        message: "Satuan wajib diisi",
      });
    }

    // TAMBAHKAN VALIDASI HARGA SATUAN
    if (!harga_satuan || Number(harga_satuan) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Harga satuan wajib diisi dan harus lebih dari 0",
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
        message: "Barang/jasa sudah terdaftar",
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
        ?, ?, ?, ?, ?, 'Y', ?, NOW()
      )
      `,
      [
        kodeBarang,
        kategori_id,
        nama_barang,
        satuan,
        harga_satuan, // PAKAI HARGA SATUAN DARI INPUT
        req.user?.employee_id || null,
      ],
    );

    return res.json({
      success: true,
      message: "Barang/jasa berhasil ditambahkan",
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
// SAVE (dengan rincian dari details)
// ======================================
exports.save = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const { header, details, employee_id, units } = req.body;

    // DEBUG: Cek data masuk
    console.log("📥 Data masuk - header:", JSON.stringify(header, null, 2));
    console.log("📥 Data masuk - details:", JSON.stringify(details, null, 2));

    const allowedUnits = units || [];

    if (!allowedUnits.includes(header.unit_id)) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses ke unit tersebut",
      });
    }

    await conn.beginTransaction();

    // =====================================
    // HITUNG TOTAL
    // =====================================
    let total = 0;
    for (const item of details) {
      // Cek apakah item memiliki rincian (dari properti rincian di dalam details)
      const hasRincian = item.rincian && item.rincian.length > 0;

      if (hasRincian) {
        const subtotalRincian = item.rincian.reduce(
          (sum, r) => sum + Number(r.qty || 0) * Number(r.harga || 0),
          0,
        );
        item.harga = subtotalRincian;
        item.subtotal = subtotalRincian * Number(item.qty || 1);
        total += item.subtotal;
        console.log(
          `💰 Item ${item.barang_id} pakai rincian, subtotal: ${item.subtotal}`,
        );
      } else {
        item.subtotal = Number(item.qty || 1) * Number(item.harga || 0);
        total += item.subtotal;
        console.log(
          `💰 Item ${item.barang_id} tanpa rincian, subtotal: ${item.subtotal}`,
        );
      }
    }

    console.log(`💰 Total keseluruhan: ${total}`);

    let pembelianId = header.id || null;

    // =====================================
    // UPDATE DRAFT (jika ada ID)
    // =====================================
    if (pembelianId) {
      const [cek] = await conn.query(
        `
        SELECT id, status
        FROM mobay_pembelian
        WHERE id = ?
        `,
        [pembelianId],
      );

      if (cek.length === 0) {
        throw new Error("Data pembelian tidak ditemukan");
      }

      if (cek[0].status !== "DRAFT") {
        throw new Error("Transaksi sudah difinalisasi dan tidak dapat diubah");
      }

      await conn.query(
        `
        UPDATE mobay_pembelian
        SET
          tanggal_beli = ?,
          tanggal_terima = ?,
          unit_id = ?,
          supplier = ?,
          nomor_nota = ?,
          total = ?,
          keterangan = ?
        WHERE id = ?
        `,
        [
          header.tanggal_beli,
          header.tanggal_terima,
          header.unit_id,
          header.supplier,
          header.nomor_nota,
          total,
          header.keterangan,
          pembelianId,
        ],
      );

      // Hapus detail dan rincian lama
      await conn.query(
        `
        DELETE FROM mobay_pembelian_detail
        WHERE pembelian_id = ?
        `,
        [pembelianId],
      );

      await conn.query(
        `
        DELETE FROM mobay_pembelian_rincian
        WHERE pembelian_id = ?
        `,
        [pembelianId],
      );

      //console.log(`🔄 Update draft ID: ${pembelianId}`);
    }
    // =====================================
    // INSERT BARU (jika tidak ada ID)
    // =====================================
    else {
      const nomorPembelian = "PBL-" + Date.now();

      const [result] = await conn.query(
        `
        INSERT INTO mobay_pembelian
        (
          nomor_pembelian,
          tanggal_beli,
          tanggal_terima,
          unit_id,
          unit_pengaju,
          supplier,
          nomor_nota,
          total,
          status,
          keterangan,
          created_by,
          created_at
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )
        `,
        [
          nomorPembelian,
          header.tanggal_beli,
          header.tanggal_terima,
          header.unit_id,
          header.unit_id,
          header.supplier,
          header.nomor_nota,
          total,
          "DRAFT",
          header.keterangan,
          employee_id,
        ],
      );

      pembelianId = result.insertId;
      //console.log(`🆕 Insert baru ID: ${pembelianId}`);
    }

    // =====================================
    // INSERT DETAIL DAN RINCIAN
    // =====================================

    //console.log(      `📝 Menyimpan ${details.length} detail untuk pembelian_id: ${pembelianId}`,);

    for (let idx = 0; idx < details.length; idx++) {
      const item = details[idx];

      // Cek apakah item memiliki rincian
      const hasRincian = item.rincian && item.rincian.length > 0 ? 1 : 0;

      console.log(
        `  - Detail ${idx + 1}: barang_id=${item.barang_id}, has_rincian=${hasRincian}`,
      );

      // Insert detail
      const [detailResult] = await conn.query(
        `
        INSERT INTO mobay_pembelian_detail
        (
          pembelian_id,
          barang_id,
          qty,
          satuan,
          harga,
          subtotal,
          has_rincian
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?
        )
        `,
        [
          pembelianId,
          item.barang_id,
          item.qty || 1,
          item.satuan || "",
          item.harga || 0,
          Number(item.qty || 1) * Number(item.harga || 0),
          hasRincian,
        ],
      );

      const detailId = detailResult.insertId;
      console.log(`    ✅ Detail ID: ${detailId}`);

      // =====================================
      // INSERT RINCIAN (jika ada)
      // =====================================
      if (hasRincian && item.rincian) {
        console.log(
          `    📋 Menyimpan ${item.rincian.length} rincian untuk detail_id: ${detailId}`,
        );

        for (let ridx = 0; ridx < item.rincian.length; ridx++) {
          const r = item.rincian[ridx];
          const subtotal = Number(r.qty || 0) * Number(r.harga || 0);

          console.log(
            `      - Rincian ${ridx + 1}: ${r.nama_item} | ${r.qty} x ${r.harga} = ${subtotal}`,
          );

          await conn.query(
            `
            INSERT INTO mobay_pembelian_rincian
            (
              pembelian_id,
              nama_item,
              qty,
              satuan,
              harga,
              subtotal
            )
            VALUES
            (
              ?, ?, ?, ?, ?, ?
            )
            `,
            [
              pembelianId,
              r.nama_item,
              r.qty || 1,
              r.satuan || "",
              r.harga || 0,
              subtotal,
            ],
          );
        }
      }

      // =====================================
      // UPDATE LAST PRICE
      // =====================================
      if (item.harga && item.harga > 0) {
        await conn.query(
          `
          UPDATE mobay_barang
          SET last_price = ?
          WHERE id = ?
          `,
          [item.harga, item.barang_id],
        );
        console.log(
          `    💾 Update last_price ${item.barang_id} = ${item.harga}`,
        );
      }
    }

    // =====================================
    // COMMIT
    // =====================================
    await conn.commit();

    console.log(
      `✅ Transaksi ${pembelianId} berhasil disimpan dengan total ${total}`,
    );

    return res.json({
      success: true,
      message: "Pembelian berhasil disimpan",
      id: pembelianId,
    });
  } catch (err) {
    // =====================================
    // ROLLBACK
    // =====================================
    await conn.rollback();
    console.error("❌ Error save:", err);
    console.error("❌ Stack trace:", err.stack);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    conn.release();
  }
};

exports.finalisasi = async (req, res) => {
  try {
    const { id } = req.body;

    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM mobay_pembelian
      WHERE id = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
    }

    if (rows[0].status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Status bukan DRAFT",
      });
    }

    await db.promise().query(
      `
      UPDATE mobay_pembelian
      SET status='FINAL'
      WHERE id=?
      `,
      [id],
    );

    res.json({
      success: true,
      message: "Data berhasil difinalisasi",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
