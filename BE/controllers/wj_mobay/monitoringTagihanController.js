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

    const surat = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 40
    });

    const fileName = `Monitoring_${surat.pengajuan_id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
    );

    doc.pipe(res);

    // ===============================
    // HELPERS
    // ===============================

    const formatRupiah = (n) =>
      Number(n || 0).toLocaleString("id-ID");

    const formatDate = (d) => {
      if (!d) return "-";

      return new Date(d).toLocaleDateString("id-ID");
    };

    const X = {
      left: 40,
      right: 550,

      no: 40,
      invoice: 70,
      total: 320
    };

    let y = 40;

    // ===============================
    // HEADER
    // ===============================
    doc.fontSize(14).text("UOBK RSUD WALUYO JATI", 0, y, {
        align: "center",
      });

    y += 25;
      
    doc.fontSize(14)
      .font("Helvetica-Bold")
      .text("MONITORING TAGIHAN", 0, y, {
        align: "center"
      });

    y += 40;

    doc.fontSize(10)
      .font("Helvetica");

    doc.text("Provider", 40, y);

    doc.text(`: ${surat.prvdr_str}`, 120, y);

    y += 18;

    const cleanAddress = (surat.prvdr_address || "")
      .replace(/\r/g, "");

    const alamatHeight = doc.heightOfString(
      `: ${cleanAddress}`,
      {
        width: 380
      }
    );

    doc.text("Alamat", 40, y);

    doc.text(`: ${cleanAddress}`, 120, y, {
      width: 380
    });

    y += alamatHeight + 10;

    doc.text(`: ${surat.status_pengolahan}`, 120, y);

    y += 30;

    // ===============================
    // SUMMARY
    // ===============================

    doc.font("Helvetica-Bold");

    doc.text("SUMMARY", 40, y);

    y += 20;

    doc.font("Helvetica");

    const summary = [
      ["Total Faktur", surat.total_invoice],
      ["Total Tagihan", formatRupiah(surat.total_tagihan)],
      ["Total Diajukan", formatRupiah(surat.total_diajukan)],
      ["Total Dibayar", formatRupiah(surat.total_bayar)],
      ["Tanggal Pengajuan", formatDate(surat.tgl_pengajuan)],
      ["Tanggal Bayar", formatDate(surat.tgl_bayar)],
    ];

    summary.forEach(([label, value]) => {

      doc.text(label, 50, y);

      doc.text(":", 180, y);

      doc.text(String(value || "-"), 190, y);

      y += 18;

    });

    y += 20;

    // ===============================
    // TABLE HEADER
    // ===============================

    doc.font("Helvetica-Bold")
      .fontSize(9);

    doc.text("No", 40, y);

    doc.text("Invoice", 70, y);

    doc.text("Total", 430, y, {
      width: 90,
      align: "right"
    });

    y += 15;

    doc.moveTo(40, y)
      .lineTo(550, y)
      .stroke();

    y += 10;

    // ===============================
    // TABLE BODY
    // ===============================

    doc.font("Helvetica")
      .fontSize(8);

    surat.invoices?.forEach((inv, i) => {

      if (y > 730) {

        doc.addPage();

        y = 50;
      }

      doc.text(i + 1, 40, y);

      doc.text(inv.invoice_no || "-", 70, y, {
        width: 130
      });

      doc.text(
        formatRupiah(inv.total_diajukan),
        430,
        y,
        {
          width: 90,
          align: "right"
        }
      );

      y += 18;

      // ================= ITEMS
      if (inv.items?.length) {

        inv.items.forEach((it) => {

          if (y > 730) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(7);

          doc.text(
            `- ${it.drug_nm}`,
            90,
            y,
            {
              width: 220
            }
          );

          doc.text(
            formatRupiah(it.qty),
            340,
            y,
            {
              width: 40,
              align: "right"
            }
          );

          doc.text(
            formatRupiah(it.subtotal),
            430,
            y,
            {
              width: 90,
              align: "right"
            }
          );

          y += 14;
        });

        y += 5;
      }

    });

    // ===============================
    // FOOTER TOTAL
    // ===============================

    y += 15;

    doc.moveTo(320, y)
      .lineTo(520, y)
      .stroke();

    y += 10;

    doc.font("Helvetica-Bold")
      .fontSize(10);

    doc.text("TOTAL", 320, y);

    doc.text(
      formatRupiah(surat.total_diajukan),
      430,
      y,
      {
        width: 90,
        align: "right"
      }
    );

    doc.end();

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }
};