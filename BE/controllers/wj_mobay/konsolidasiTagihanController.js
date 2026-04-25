const db = require("../../db/connection-lokal");
const mirrorService = require("./mirrorPoService");

// ===============================
// GET DATA SUMBER
// ===============================
exports.getData = async (req, res) => {
  try {
    const { start, end, typeTglFilter } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Parameter ?start= dan ?end= wajib diisi"
      });
    }

    // Ambil data sumber murni
    const sumber =
      await mirrorService.getDataSumberByTanggal(
        start,
        end,
        typeTglFilter
      );

    // Ambil daftar po_acce_id yg SUDAH DIMIRROR
    const mirroredMap =
      await mirrorService.getMirroredPoMap();
    // return Set<string>

    const result = {};

    for (const row of sumber) {
      if (!row.po_acce_id) continue;

      //  SKIP yang sudah masuk mirror (biar tdk tampil lagi disini)
      const status = mirroredMap.get(row.po_acce_id);

      // tampilkan kalau:
      // - belum pernah mirror
      // - atau statusnya Batal
      if (status && status !== "Batal") continue;

      const key = row.po_acce_id;

      if (!result[key]) {
        result[key] = {
          po_acce_id: key,
          po_id: row.po_id,
          po_code: row.po_code,
          po_dt: row.po_dt,

          srvc_unit_id: row.srvc_unit_id,
          srvc_unit_nm: row.srvc_unit_nm,

          prvdr_id: row.prvdr_id,
          prvdr_str: row.prvdr_str,
          prvdr_address: row.prvdr_address,
          prvdr_city: row.prvdr_city,

          invoice_no: row.invoice_no,

          invoice_dt: row.invoice_dt,
          invoice_due_dt: row.invoice_due_dt,
          invoice_received_dt: row.invoice_received_dt,

          total_tagihan: 0,
          items: []
        };
      }

      const item = {
        drug_equi_id: row.drug_equi_id,
        item_name: row.item_name,
        qty: Number(row.qty ?? 0),
        price: Number(row.price ?? 0),
        tax: Number(row.tax ?? 0),
        discount: Number(row.discount ?? 0),
        nettoprice: Number(row.nettoprice ?? 0),
        subtotal: Number(row.subtotal ?? 0),
        jenis_item: row.jenis_item,
        jenis_pengadaan: row.jenis_pengadaan
      };

      result[key].items.push(item);
      result[key].total_tagihan += item.subtotal;
    }

    res.json({
      periode: { start, end },
      totalInvoice: Object.keys(result).length,
      data: Object.values(result),
    });
  } catch (error) {
    console.error("Error getData sumber", error);
    res.status(500).json({ message: "Gagal memuat data sumber" });
  }
};

// ===============================
// GET PROVIDER LIST
// ===============================
exports.fetchProviderList = async (req, res) => {
  try {
    const data = await mirrorService.getProviderList();

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("fetch Provider List error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ===============================
// GET BARANG LIST
// ===============================
exports.fetchDrugList = async (req, res) => {
  try {
    const data = await mirrorService.getDrugList();

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("fetch Drug List error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ===============================
// Konsolidasi INVOICE
// ===============================
exports.konsolidasiInvoice = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const { header, items } = req.body;

    /*if (header.total_diajukan > header.total_tagihan) {
      throw new Error("total_diajukan tidak boleh melebihi total_tagihan");
    }*/ // jika nnti tidak diperbolehkan pembulatan ke atas

    if (!header?.po_acce_id) {
      return res.status(400).json({
        message: "po_acce_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await mirrorService.saveKonsolidasiHeader({
      ...header,
      conn,
    });

    await mirrorService.saveKonsolidasiItems(
      header.po_acce_id,
      items,
      conn
    );

    await conn.commit();
    res.json({ message: "Konsolidasi berhasil disimpan" });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
};

exports.fetchProviderSaldo = async (req, res) => {
  try {
    const { prvdr_id } = req.query;

    if (!prvdr_id) {
      return res.status(400).json({ message: "prvdr_id wajib diisi" });
    }

    const saldo = await mirrorService.getProviderSaldo(prvdr_id);

    res.json({ prvdr_id, saldo });
  } catch (error) {
    console.error("Error fetchProviderSaldo", error);
    res.status(500).json({ message: "Gagal mengambil saldo provider" });
  }
};

