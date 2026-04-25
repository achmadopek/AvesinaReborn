const db = require("../../db/connection-lokal");
const mirrorService = require("./mirrorPoService");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const formatTanggalIndo = (tgl) => {
  const date = new Date(tgl);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ===============================
// GET DATA MIRROR - SIAP VERIFIKASI
// ===============================
exports.getData = async (req, res) => {
  try {
    const { start, end, typeTglFilter } = req.query;

    const allowedDateFields = {
      po_dt: "h.po_dt",
      invoice_dt: "h.invoice_dt",
      invoice_received_dt: "h.invoice_received_dt",
      invoice_due_dt: "h.invoice_due_dt",
      tgl_surat: "sp.tanggal_surat",
      tgl_konsolidasi: "h.invoice_consolidated_dt",
      tgl_pengajuan: "h.invoice_submitted_dt",
      tgl_terima: "h.invoice_accepted_dt",
      tgl_verifikasi: "h.invoice_verified_dt",
      invoice_paid_dt: "h.invoice_paid_dt",
    };

    const column = allowedDateFields[typeTglFilter];

    if (!column) {
      return res.status(400).json({ message: "Invalid date filter" });
    }

    if (!start || !end) {
      return res.status(400).json({ message: "Start dan End wajib diisi" });
    }

    const sql = `
      SELECT 
        h.id AS mirror_po_id,
        h.po_acce_id,
        h.invoice_no,
        h.srvc_unit_nm,
        h.prvdr_id,
        h.prvdr_str,
        h.po_dt,
        h.invoice_dt,
        h.invoice_received_dt,
        h.invoice_due_dt,
        h.invoice_consolidated_dt,
        h.invoice_submitted_dt,
        h.invoice_accepted_dt,
        h.invoice_verified_dt,
        h.invoice_paid_dt,
        h.status_pengolahan,
        h.status_validasi,
        h.status_pembayaran,
        h.kunci_invoice,
        h.total_tagihan,
        h.total_diajukan,
        h.total_bayar,
        h.selisih_bayar,
        h.pengajuan_id,

        sp.no_surat,
        sp.no_verifikasi,
        sp.tanggal_surat,
        sp.created_at AS tgl_pengajuan,

        d.id AS item_id,
        d.drug_equi_id,
        d.drug_nm,
        d.qty,
        d.price,
        d.tax,
        d.discount,
        d.nettoprice,
        d.subtotal,
        d.nominal_ajukan,
        d.nominal_bayar,
        d.is_checked,
        d.status_validasi AS item_status_validasi,
        d.status_pembayaran AS item_status_pembayaran

      FROM mobay_mirror_po h
      LEFT JOIN mobay_mirror_po_dtl d 
        ON d.mirror_po_id = h.id

      LEFT JOIN mobay_pengajuan sp
        ON sp.id = h.pengajuan_id

      WHERE 
        (h.status_pengolahan = 'Berkas Diterima' 
        OR h.status_pengolahan = 'Proses Verifikasi')
        AND ${column} BETWEEN ? AND ?

      ORDER BY h.po_dt DESC
    `;

    const params = [
      `${start} 00:00:00`,
      `${end} 23:59:59`
    ];

    const rows = await new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    const map = {};

    for (const r of rows) {

      const suratId = r.pengajuan_id || "TANPA_SURAT";

      if (!map[suratId]) {
        map[suratId] = {
          surat_id: r.pengajuan_id,
          no_surat: r.no_surat,
          no_verifikasi: r.no_verifikasi,
          tgl_surat: r.tanggal_surat,
          tgl_pengajuan: r.tgl_pengajuan,
          tgl_konsolidasi: r.invoice_consolidated_dt,
          tgl_terima: r.invoice_accepted_dt,
          tgl_verifikasi: r.invoice_verified_dt,
          tgl_bayar: r.invoice_paid_dt,
          provider: {},
          invoices: []
        };
      }

      // =====================
      // GROUP PROVIDER DALAM SURAT
      // =====================
      const providerKey = r.prvdr_id || "UNKNOWN";

      if (!map[suratId].provider[providerKey]) {
        map[suratId].provider[providerKey] = {
          prvdr_id: r.prvdr_id,
          prvdr_str: r.prvdr_str,
          invoices: []
        };
      }

      // =====================
      // INVOICE
      // =====================
      let invoice = map[suratId].provider[providerKey].invoices
        .find(inv => inv.po_acce_id === r.po_acce_id);

      if (!invoice) {
        invoice = {
          po_acce_id: r.po_acce_id,
          invoice_no: r.invoice_no,
          srvc_unit_nm: r.srvc_unit_nm,
          total_tagihan: Number(r.total_tagihan ?? 0),
          total_diajukan: Number(r.total_diajukan ?? 0),
          total_bayar: Number(r.total_bayar ?? 0),
          status_pengolahan: r.status_pengolahan,
          status_validasi: r.status_validasi,
          status_pembayaran: r.status_pembayaran,
          kunci_invoice: r.kunci_invoice,
          invoice_dt: r.invoice_dt,
          invoice_received_dt: r.invoice_received_dt,
          invoice_due_dt: r.invoice_due_dt,
          invoice_consolidated_dt: r.invoice_consolidated_dt,
          invoice_submitted_dt: r.invoice_submitted_dt,
          invoice_accepted_dt: r.invoice_accepted_dt,
          invoice_paid_dt: r.invoice_paid_dt,
          items: []
        };

        map[suratId].provider[providerKey].invoices.push(invoice);
      }

      // =====================
      // ITEM DETAIL
      // =====================
      if (r.item_id) {
        invoice.items.push({
          item_id: r.item_id,
          drug_nm: r.drug_nm,
          qty: Number(r.qty ?? 0),
          subtotal: Number(r.subtotal ?? 0),
          nominal_ajukan: Number(r.nominal_ajukan ?? 0),
          nominal_bayar: Number(r.nominal_bayar ?? 0),
          is_checked: Number(r.is_checked) === 1
        });
      }
    }

    res.json({
      periode: { start, end },
      data: Object.values(map)
    });

  } catch (error) {
    console.error("Error getData Mirror:", error);
    res.status(500).json({ message: "Gagal memuat data mirror" });
  }
};

exports.getNoVerifikasi = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const no = await mirrorService.generateNoVerifikasi(conn);

    await conn.commit();

    res.json({ no_verifikasi: no });

  } catch (err) {
    await conn.rollback();
    console.error("ERROR getNoVerifikasi:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

exports.mulaiVerifikasi = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {

    const {
      pengajuan_id,
      status_pengolahan,
      peg_id
    } = req.body;

    const no_verifikasi = await mirrorService.generateNoVerifikasi(conn);

    if (!pengajuan_id)
      throw new Error("pengajuan_id wajib");

    await conn.beginTransaction();

    // Update semua invoice dalam surat itu
    await conn.query(
      `
      UPDATE mobay_mirror_po
      SET 
        status_pengolahan = ?,
        invoice_verified_dt = NOW()
      WHERE pengajuan_id = ?
      `,
      [
        status_pengolahan,
        pengajuan_id
      ]
    );

    // Update nomor surat invoice surat itu
    await conn.query(
      `
      UPDATE mobay_pengajuan
      SET 
        no_verifikasi = ?,
        updated_at = NOW(),
        updated_by = ?
      WHERE id = ?
      `,
      [
        no_verifikasi,
        peg_id,
        pengajuan_id
      ]
    );

    await conn.commit();

    res.json({
      message: "Berhasil mulai verifikasi"
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({
      message: err.message
    });
  } finally {
    conn.release();
  }
};

// ===============================
// VALIDASI PEMBAYARAN (HEADER)
// ===============================
exports.validasiPembayaran = async (req, res) => {
  try {
    const {
      po_acce_id,
      status_validasi,
      catatan_verifikasi
    } = req.body;

    if (!po_acce_id || !status_validasi) {
      return res.status(400).json({
        message: "po_acce_id dan status_validasi wajib diisi",
      });
    }

    const status_pengolahan =
      status_validasi === "Valid"
        ? "Proses Pembayaran"
        : "Proses Revisi";

    // update status utama
    await mirrorService.updateMirrorStatus(
      po_acce_id,
      status_pengolahan,
      status_validasi,
      null
    );

    // update catatan
    await mirrorService.updateCatatanVerifikasi(
      po_acce_id,
      catatan_verifikasi
    );

    res.json({ message: "Invoice berhasil divalidasi" });

  } catch (error) {
    console.error("Error Validasi Pembayaran", error);
    res.status(500).json({ message: "Gagal validasi" });
  }
};

exports.cetakVerifikasi = async (req, res) => {
  try {
    const { surat_id } = req.body;

    if (!surat_id) {
      return res.status(400).json({ message: "surat_id wajib" });
    }

    let data;

    try {
      data = await mirrorService.ambilDataBySurat(surat_id);
    } catch (err) {
      console.error("ERROR ambilDataBySurat:", err);
      return res.status(500).json({ message: "Gagal ambil data surat" });
    }

    generatePDF(res, data);

  } catch (err) {
    console.error("ERROR cetakVerifikasi:", err);
    res.status(500).json({ message: err.message });
  }
};

const generatePDF = (res, payload) => {
  const {
    no_surat,
    no_verifikasi,
    tujuan,
    prvdr_str,
    prvdr_address,
    keterangan,
    tanggal_surat,
    invoiceDetails = []
  } = payload;

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const safeNo = (no_verifikasi || "NO").replace(/[\/\\]/g, "-");

  const fileName = `Lembar_Verifikasi_${safeNo}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  doc.pipe(res);

  // ================= SPLIT DATA =================
  const validInvoices = invoiceDetails.filter(i => i.status_validasi === "Valid");
  const invalidInvoices = invoiceDetails.filter(i => i.status_validasi !== "Valid");

  const grandTotal = validInvoices.reduce((s, v) => s + Number(v.diajukan || 0), 0);
  const grandPPN = validInvoices.reduce((s, v) => s + Number(v.ppn || 0), 0);
  const grandPPh = validInvoices.reduce((s, v) => s + Number(v.pph || 0), 0);

  const formatRupiah = (angka) =>
    Number(angka || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

  const formatTanggalIndo = (tgl) =>
    new Date(tgl).toLocaleDateString("id-ID");

  let y = 50;
  let isFirstPage = true;

  // ================= HEADER FULL (HANYA HALAMAN 1) =================
  const renderHeaderFull = () => {
    y = 140;

    doc.rect(50, 40, 130, 40).stroke();
    doc.fontSize(10).text("BELANJA\nBARANG / JASA", 55, 50);

    doc.rect(420, 40, 100, 40).stroke();
    doc.fontSize(18).text("V6", 455, 50);

    doc.fontSize(12).text("LEMBAR VERIFIKASI", 225, 50);
    doc.fontSize(10).text(`No. ${no_verifikasi}`, 230, 70);

    doc.text(`Kepada Yth.\n${tujuan} \ndi Tempat`, 370, 100);

    doc.fontSize(11);

    doc.text("Mohon dibayar atas belanja Rumah Sakit, kepada:", 50, y);
    y += 25;

    doc.text("Nama", 50, y);
    doc.text(`: ${prvdr_str}`, 150, y);
    y += 20;

    doc.text("Alamat", 50, y);
    doc.text(`: ${prvdr_address}`, 150, y);
    y += 30;

    doc.text("Kegiatan belanja", 50, y);
    doc.text(`: ${keterangan}`, 150, y, { width: 350 });
    y += 20;

    doc.text("Kelengkapan dokumen :", 50, y);
    y += 20;

    const checklist = [
      "Kwitansi",
      "Invoice dari Sistem",
      "Surat Pesanan dari Sistem",
      "BAST dari Sistem",
      "Fotokopi RBA",
      "Dokumentasi Kegiatan",
    ];

    checklist.forEach((item, index) => {
      doc.rect(60, y - 2, 12, 12).stroke();
      doc.text(`${index + 1}. ${item}`, 80, y);
      y += 20;
    });

    y += 30;

    doc.text("Mengetahui,", 50, y);
    y += 18;
    doc.text("Pejabat Penatausahaan Keuangan", 50, y);

    doc.text(`Kraksaan, ${formatTanggalIndo(tanggal_surat)}`, 350, y - 18);
    doc.text("Petugas Verifikasi,", 350, y);

    y += 60;

    doc.font("Helvetica-Bold");

    doc.text("YULI SUCIATI ZAINI PUTRI, S.E.", 50, y);
    doc.text("SAFI'I, S.H.", 350, y);

    y += 15;

    doc.font("Helvetica");
    doc.text("NIP. 19790713 201001 2 002", 50, y);
    doc.text("NIP. 19811004 200903 1 001", 350, y);

    y += 40;

  };

  // ================= HEADER TABEL =================
  const drawTableHeader = () => {
    doc.font("Helvetica-Bold").fontSize(8);

    doc.text("No", 50, y);
    doc.text("No Invoice", 70, y);
    doc.text("Total (Rp)", 170, y);
    doc.text("DPP (Rp)", 270, y);
    doc.text("PPN (Rp)", 370, y);
    doc.text("PPh (Rp)", 450, y);
    doc.text("Verif", 525, y);

    y += 15;

    doc.moveTo(50, y).lineTo(550, y).stroke();

    y += 5;
    doc.font("Helvetica");
  };

  // ================= TABLE =================
  const renderTable = (data, isValidPage = true) => {

    if (isFirstPage) {
      renderHeaderFull();
      isFirstPage = false;
    } else {
      y = 50;
    }

    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("Rincian Invoice :", 50, y);
    y += 20;

    drawTableHeader();

    const pageHeight = doc.page.height - doc.page.margins.bottom;

    data.forEach((inv, i) => {

      const rowHeight = 20;

      if (y + rowHeight > pageHeight) {
        doc.addPage();
        y = 50;

        doc.font("Helvetica-Bold").fontSize(8);
        doc.text("Rincian Invoice :", 50, y);
        y += 20;

        drawTableHeader();
      }

      doc.font("Helvetica").fontSize(8);

      doc.text(i + 1, 50, y);
      doc.text(inv.invoice_no, 70, y);

      doc.text(formatRupiah(inv.diajukan), 170, y);
      doc.text(formatRupiah(inv.dpp), 270, y);
      doc.text(formatRupiah(inv.ppn), 370, y);
      doc.text(formatRupiah(inv.pph), 450, y);

      // checkbox
      doc.rect(535, y, 10, 10).stroke();

      doc.font("Helvetica-Bold").fontSize(8);
      doc.text(
        inv.status_validasi === "Valid" ? "V" : "X",
        537,
        y + 2
      );

      doc.font("Helvetica");

      y += rowHeight;
    });

    // ================= TOTAL =================
    if (isValidPage) {

      const sisa = doc.page.height - doc.page.margins.bottom - y;

      if (sisa < 60) {
        doc.addPage();
        y = 50;
      }

      y += 10;

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.font("Helvetica-Bold").fontSize(10);

      doc.text("Jumlah Belanja", 50, y);
      doc.text("Rp. " + formatRupiah(grandTotal), 220, y);

      y += 20;
      doc.text("PPN", 50, y);
      doc.text("Rp. " + formatRupiah(grandPPN), 220, y);

      y += 20;
      doc.text("PPh 22", 50, y);
      doc.text("Rp. " + formatRupiah(grandPPh), 220, y);

      doc.font("Helvetica");
    }
  };

  // ================= RENDER =================
  renderTable(validInvoices, true);

  if (invalidInvoices.length > 0) {
    doc.addPage();
    doc.text("DAFTAR INVOICE TIDAK VALID", 50, 30);
    renderTable(invalidInvoices, false);
  }

  doc.end();
};