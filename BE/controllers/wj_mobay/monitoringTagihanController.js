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
        message: "Parameter start dan end wajib diisi",
      });
    }

    const data =
      await mirrorService.getMonitoringBySuratPengantar(
        start,
        end,
        typeTglFilter
      );

    res.json({
      periode: { start, end },
      totalGroup: data.length,
      data,
    });
  } catch (err) {
    console.error("Error monitoring pengajuan", err);
    res.status(500).json({
      message: "Gagal memuat monitoring pengajuan",
    });
  }
};

const PDFDocument = require("pdfkit");

exports.cetakMonitoringPDF = async (req, res) => {
  try {
    const {
      is_rekap = false,           // Rekap 1 Surat Pengajuan (tanpa item)
      is_rekap_global = false,    // Rekap Global (per Surat Pengajuan)
      is_rekap_invoice = false,   // Rekap Semua Invoice
      data,                       // Untuk global & rekap invoice
      periode,
      ...surat                    // Data single surat
    } = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");

    let title = "MONITORING TAGIHAN";
    let filename = "Monitoring_Tagihan.pdf";

    if (is_rekap_global) {
      title = "REKAP GLOBAL MONITORING TAGIHAN";
      filename = `Rekap_Global_${periode?.start || ''}_sd_${periode?.end || ''}.pdf`;
    } else if (is_rekap_invoice) {
      title = "REKAP INVOICE MONITORING TAGIHAN";
      filename = `Rekap_Invoice_${periode?.start || ''}_sd_${periode?.end || ''}.pdf`;
    } else if (is_rekap) {
      title = "REKAP MONITORING TAGIHAN";
      filename = `Rekap_${surat.pengajuan_id || 'surat'}.pdf`;
    } else {
      filename = `Monitoring_${surat.pengajuan_id || 'surat'}.pdf`;
    }

    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    doc.pipe(res);

    const formatRupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
    const formatDate = (d) => (!d ? "-" : new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }));

    let y = 50;

    // Header Umum
    doc.fontSize(14).font("Helvetica-Bold").text("UOBK RSUD WALUYO JATI", 40, y, { align: "center" });
    y += 25;
    doc.fontSize(13).text(title, 40, y, { align: "center" });
    y += 25;

    if ((is_rekap_global || is_rekap_invoice) && periode) {
      doc.fontSize(10).font("Helvetica")
         .text(`Periode: ${periode.start} s/d ${periode.end}`, 40, y, { align: "center" });
      y += 35;
    }

    // ==================== ROUTING MODE ====================
    if (is_rekap_global && Array.isArray(data)) {
      generateRekapGlobal(doc, data, formatRupiah, y);
    } 
    else if (is_rekap_invoice && Array.isArray(data)) {
      generateRekapInvoice(doc, data, formatRupiah, y);
    } 
    else {
      generateSingleSurat(doc, surat, is_rekap, formatRupiah, formatDate, y);
    }

    doc.end();

  } catch (err) {
    console.error("Error cetakMonitoringPDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Gagal generate PDF" });
    }
  }
};

// ====================== FUNGSI PEMBANTU ======================

function generateRekapGlobal(doc, data, formatRupiah, startY) {
  let y = startY;

  doc.fontSize(10).font("Helvetica-Bold").text("DAFTAR SURAT PENGAJUAN", 40, y);
  y += 20;

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("No", 40, y);
  doc.text("Provider", 70, y, { width: 220 });
  doc.text("Jml Invoice", 300, y);
  doc.text("Total Diajukan", 420, y, { width: 110, align: "right" });

  y += 18;
  doc.moveTo(40, y).lineTo(550, y).stroke();
  y += 12;

  doc.font("Helvetica").fontSize(9);
  let grandTotal = 0;

  data.forEach((surat, i) => {
    if (y > 730) { doc.addPage(); y = 50; }

    const total = Number(surat.total_diajukan || 0);

    doc.text(i + 1, 40, y);
    doc.text(surat.prvdr_str || "-", 70, y, { width: 220 });
    doc.text(surat.invoices?.length || 0, 300, y);
    doc.text(formatRupiah(total), 420, y, { width: 110, align: "right" });

    grandTotal += total;
    y += 22;
  });

  // Grand Total
  y += 15;
  doc.moveTo(80, y).lineTo(550, y).stroke();
  y += 12;
  doc.font("Helvetica-Bold").fontSize(11)
     .text("GRAND TOTAL", 80, y)
     .text(formatRupiah(grandTotal), 420, y, { width: 110, align: "right" });
}

function generateRekapInvoice(doc, data, formatRupiah, startY) {
  let y = startY;
  let grandTotal = 0;

  data.forEach((surat, index) => {
    if (y > 650) { 
      doc.addPage(); 
      y = 50; 
    }

    // Header Surat Pengajuan
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(`${index + 1}. ${surat.prvdr_str || '-'}`, 40, y);
    y += 18;

    // Table Invoice per Surat
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("No", 50, y);
    doc.text("Invoice No", 80, y);
    doc.text("Status", 260, y);
    doc.text("Total Diajukan", 430, y, { width: 100, align: "right" });

    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 12;

    doc.font("Helvetica").fontSize(9);

    let subTotal = 0;

    (surat.invoices || []).forEach((inv, i) => {
      if (y > 730) { doc.addPage(); y = 50; }

      const totalInv = Number(inv.total_diajukan || 0);
      subTotal += totalInv;

      doc.text(i + 1, 50, y);
      doc.text(inv.invoice_no || "-", 80, y, { width: 160 });
      doc.text(inv.status_pengolahan || "-", 260, y, { width: 140 });
      doc.text(formatRupiah(totalInv), 430, y, { width: 100, align: "right" });

      y += 20;
    });

    // Subtotal per Surat
    y += 5;
    doc.font("Helvetica-Bold").fontSize(9.5);
    doc.text("Subtotal Pengajuan :", 300, y);
    doc.text(formatRupiah(subTotal), 430, y, { width: 100, align: "right" });

    grandTotal += subTotal;
    y += 35;
  });

  // Grand Total Semua
  y += 10;
  doc.moveTo(80, y).lineTo(550, y).stroke();
  y += 12;
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("GRAND TOTAL KESELURUHAN", 80, y);
  doc.text(formatRupiah(grandTotal), 430, y, { width: 100, align: "right" });
}

function generateSingleSurat(doc, surat, isRekap, formatRupiah, formatDate, startY) {
  let y = startY + 10;

  // Info Provider
  doc.fontSize(10).font("Helvetica");
  doc.text("Provider", 40, y);
  doc.text(`: ${surat.prvdr_str || "-"}`, 120, y);
  y += 18;

  const cleanAddress = (surat.prvdr_address || "").replace(/\r/g, "");
  const addressHeight = doc.heightOfString(`: ${cleanAddress}`, { width: 380 });

  doc.text("Alamat", 40, y);
  doc.text(`: ${cleanAddress}`, 120, y, { width: 380 });
  y += addressHeight + 15;

  // Summary
  doc.font("Helvetica-Bold").fontSize(10).text("SUMMARY", 40, y);
  y += 20;

  doc.font("Helvetica").fontSize(9);
  const summaryData = [
    ["Total Faktur", surat.total_invoice || 0],
    ["Total Tagihan", formatRupiah(surat.total_tagihan)],
    ["Total Diajukan", formatRupiah(surat.total_diajukan)],
    ["Total Dibayar", formatRupiah(surat.total_bayar)],
    ["Tgl Pengajuan", formatDate(surat.tgl_pengajuan)],
    ["Tgl Bayar", formatDate(surat.tgl_bayar)],
  ];

  summaryData.forEach(([label, value]) => {
    doc.text(label, 50, y);
    doc.text(":", 180, y);
    doc.text(String(value), 190, y);
    y += 18;
  });

  y += 25;

  // Table Invoice
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("No", 40, y);
  doc.text("Invoice No", 70, y);
  doc.text("Status", 250, y);
  doc.text("Total Diajukan", 430, y, { width: 100, align: "right" });

  y += 15;
  doc.moveTo(40, y).lineTo(550, y).stroke();
  y += 12;

  doc.font("Helvetica").fontSize(9);

  (surat.invoices || []).forEach((inv, i) => {
    if (y > 730) { doc.addPage(); y = 50; }

    doc.text(i + 1, 40, y);
    doc.text(inv.invoice_no || "-", 70, y, { width: 160 });
    doc.text(inv.status_pengolahan || "-", 250, y, { width: 140 });
    doc.text(formatRupiah(inv.total_diajukan), 430, y, { width: 100, align: "right" });

    y += 20;

    // Detail Item hanya jika bukan rekap
    if (!isRekap && inv.items?.length) {
      doc.fontSize(7.5);
      inv.items.forEach((item) => {
        if (y > 730) { doc.addPage(); y = 50; }
        doc.text(`• ${item.drug_nm || "-"}`, 80, y, { width: 240 });
        doc.text(Number(item.qty || 0).toLocaleString("id-ID"), 340, y, { width: 50, align: "right" });
        doc.text(formatRupiah(item.subtotal), 430, y, { width: 100, align: "right" });
        y += 15;
      });
      doc.fontSize(9);
      y += 5;
    }
  });

  // Footer Total
  y += 20;
  doc.moveTo(80, y).lineTo(550, y).stroke();
  y += 12;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL KESELURUHAN", 80, y);
  doc.text(formatRupiah(surat.total_diajukan || 0), 430, y, { width: 100, align: "right" });
}