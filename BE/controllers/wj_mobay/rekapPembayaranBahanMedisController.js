const ExcelJS = require("exceljs");
const mirrorService = require("./mirrorPoService");
const db = require("../../db/connection-lokal");

// ===============================
// Helper: Tentukan status dari item (fallback)
// ===============================
function tentukanStatusInvoice(items) {
  const allValid = items.length > 0 && items.every(it => it.status_validasi === "Valid");
  const hasInvalid = items.some(it => it.status_validasi === "Tidak Valid");

  let statusValidasi = "Belum Validasi";
  if (allValid) statusValidasi = "Valid";
  else if (hasInvalid) statusValidasi = "Tidak Valid";

  return {
    statusValidasi,
    statusPembayaran: "Belum Bayar"
  };
}

// ===============================
// GET DATA REKAP PEMBAYARAN
// ===============================
exports.getRekapData = async (req, res) => {
  try {
    const { start, end, typeTglFilter = "tgl_po" } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Parameter start & end wajib diisi",
      });
    }

    const sumber = await mirrorService.getDataSumberByTanggal(
      start,
      end,
      typeTglFilter
    );

    const mirrorHeaderMap = await mirrorService.getInvoiceMirrorList();
    const mirrorItemMap = await mirrorService.getAllMirrorItemsMap();

    const map = new Map();

    // =========================
    // GROUPING
    // =========================
    for (const r of sumber) {
      if (!r.po_acce_id) continue;

      const key = r.po_acce_id;
      const header = mirrorHeaderMap.get(key);

      if (!map.has(key)) {
        map.set(key, {
          po_acce_id: key,
          invoice_no: r.invoice_no,
          po_id: r.po_id,
          srvc_unit_nm: r.srvc_unit_nm,
          prvdr_str: r.prvdr_str,

          po_dt: r.po_dt,
          invoice_dt: header?.invoice_dt ?? r.invoice_dt,
          invoice_due_dt: header?.invoice_due_dt ?? r.invoice_due_dt,
          invoice_paid_dt: header?.invoice_paid_dt ?? r.invoice_paid_dt,
          invoice_received_dt: header?.invoice_received_dt ?? null,

          invoice_consolidated_dt: header?.invoice_consolidated_dt ?? null,
          invoice_submitted_dt: header?.invoice_submitted_dt ?? null,
          invoice_accepted_dt: header?.invoice_accepted_dt ?? null,
          invoice_verified_dt: header?.invoice_verified_dt ?? null,

          status_pengolahan: header?.status_pengolahan ?? "Belum Proses",
          status_validasi: header?.status_validasi ?? "Belum Validasi",
          status_pembayaran: header?.status_pembayaran ?? "Belum Bayar",
          kunci_invoice: header?.kunci_invoice ?? 0,

          total_invoice: 0,
          total_diajukan: Number(header?.total_diajukan ?? 0),
          total_lunas: Number(header?.total_bayar ?? 0),
          total_hutang: 0,

          items: [],
        });
      }

      const itemKey = `${key}__${r.drug_equi_id}`;

      const item = {
        drug_equi_id: r.drug_equi_id,
        drug_nm: r.item_name,
        qty: Number(r.qty),
        price: Number(r.price),
        tax: Number(r.tax),
        discount: Number(r.discount),
        subtotal: Number(r.subtotal),

        jenis_item: mirrorItemMap.get(itemKey) ?? r.jenis_item,

        // default status biar FE gak nebak
        status_validasi: "Belum Validasi",
        status_pembayaran: "Belum Bayar",
        nominal_bayar: 0,
      };

      const inv = map.get(key);
      inv.items.push(item);
      inv.total_invoice += item.subtotal;
    }

    // =========================
    // FINAL CALCULATION
    // =========================
    for (const inv of map.values()) {
      inv.total_hutang = Math.max(
        inv.total_diajukan - inv.total_lunas,
        0
      );

      // fallback status kalau tidak ada mirror
      if (!mirrorHeaderMap.has(inv.po_acce_id)) {
        inv.total_diajukan = 0;
        inv.total_lunas = 0;
        inv.total_hutang = 0;

        const calc = tentukanStatusInvoice(inv.items);
        inv.status_validasi = calc.statusValidasi;
        inv.status_pembayaran = calc.statusPembayaran;
        inv.selisih = inv.total_invoice - inv.total_diajukan;
      }
    }

    return res.json({
      periode: { start, end },
      totalInvoice: map.size,
      data: Array.from(map.values()),
    });

  } catch (err) {
    console.error("Rekap Error:", err);
    res.status(500).json({ message: "Gagal memuat data" });
  }
};

// ===============================
// EXPORT EXCEL (TIDAK DIUBAH LOGIC)
// ===============================
exports.exportRekapPembayaranBahanMedis = async (req, res) => {
  try {
    const { start, end, typeTglFilter = "tgl_po" } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Parameter start dan end wajib diisi",
      });
    }

    // ===============================
    // AMBIL DATA REKAP (SAMA DENGAN VIEW)
    // ===============================
    const sumber = await mirrorService.getDataSumberByTanggal(
      start,
      end,
      typeTglFilter
    );

    const mirrorHeaderMap = await mirrorService.getInvoiceMirrorList();
    const result = {};

    for (const row of sumber) {
      if (!row.po_acce_id) continue;

      const key = row.po_acce_id;
      const header = mirrorHeaderMap.get(key) || {};

      if (!result[key]) {
        result[key] = {
          po_acce_id: key,
          invoice_no: row.invoice_no,
          srvc_unit_nm: row.srvc_unit_nm,
          prvdr_str: row.prvdr_str,
          po_dt: row.po_dt,

          status_pengolahan: header.status_pengolahan || "Belum Proses",
          status_pembayaran: header.status_pembayaran || "Belum Bayar",

          total_invoice: 0,
          total_diajukan: Number(header.total_diajukan ?? 0), // TAMBAH
          total_lunas: Number(header.total_bayar ?? 0),
          total_hutang: 0,
        };
      }

      result[key].total_invoice += Number(row.subtotal ?? 0);
    }

    // hitung hutang
    Object.values(result).forEach(inv => {
      inv.total_hutang = Math.max(
        inv.total_diajukan - inv.total_lunas,
        0
      );
    });

    const data = Object.values(result);

    // ===============================
    // GENERATE EXCEL
    // ===============================
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rekap Pembayaran");

    sheet.addRow(["REKAP PEMBAYARAN BAHAN MEDIS"]);
    sheet.addRow([`Periode: ${start} s/d ${end}`]);
    sheet.addRow([`Filter Tanggal: ${typeTglFilter}`]);
    sheet.addRow([]);

    sheet.addRow([
      "No",
      "Unit",
      "Provider",
      "Tanggal PO",
      "No Faktur",
      "Total Faktur",
      "Total Diajukan",
      "Status",
      "Lunas",
      "Hutang",
    ]);

    let no = 1;
    data.forEach(inv => {
      sheet.addRow([
        no++,
        inv.srvc_unit_nm,
        inv.prvdr_str,
        inv.po_dt,
        inv.invoice_no,
        inv.total_invoice,
        inv.total_diajukan,
        inv.status_pengolahan,
        inv.total_lunas,
        inv.total_hutang,
      ]);
    });

    // ===============================
    // FORMAT ANGKA
    // ===============================
    ["F", "G", "I", "J"].forEach(col => {
      sheet.getColumn(col).numFmt = "#,##0.00";
    });

    // ===============================
    // RESPONSE
    // ===============================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Pembayaran_${start}_${end}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ message: "Gagal export Excel" });
  }
};