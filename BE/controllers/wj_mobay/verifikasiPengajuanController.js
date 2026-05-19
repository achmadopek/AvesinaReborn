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
        sp.jenis_pengajuan,
        sp.checklist_verifikasi,

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
        h.status_pengolahan IN ('Berkas Diterima','Proses Verifikasi','Terverifikasi', 'Proses Pembayaran')
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
          checklist_verifikasi: r.checklist_verifikasi
            ? JSON.parse(r.checklist_verifikasi)
            : null,
          tgl_surat: r.tanggal_surat,
          tgl_pengajuan: r.tgl_pengajuan,
          jenis_pengajuan: r.jenis_pengajuan,
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

    // =====================
    // Split jadi dua kelompok data (Working List dan History)
    // =====================
    const verifikasiStatuses = [
      "Berkas Diterima",
      "Proses Verifikasi",
      "Terverifikasi",
      "Proses Revisi"
    ];
    
    const historiStatuses = [
      "Proses Pembayaran",
      "Selesai",
      "Batal"
    ];
    
    const finalData = Object.values(map);
    
    const verifikasi = [];
    const histori = [];
    
    for (const surat of finalData) {
      let hasVerifikasi = false;
      let hasHistori = false;
    
      for (const provider of Object.values(surat.provider)) {
        for (const invoice of provider.invoices) {
          if (verifikasiStatuses.includes(invoice.status_pengolahan)) {
            hasVerifikasi = true;
          }
          if (historiStatuses.includes(invoice.status_pengolahan)) {
            hasHistori = true;
          }
        }
      }
    
      if (hasVerifikasi) {
        verifikasi.push(surat);
      }
    
      if (hasHistori) {
        histori.push(surat);
      }
    }

    res.json({
      periode: { start, end },
      verifikasi,
      histori
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
      status_pengolahan,
      catatan_verifikasi
    } = req.body;

    if (!po_acce_id || !status_validasi) {
      return res.status(400).json({
        message: "po_acce_id dan status_validasi wajib diisi",
      });
    }

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
    const { surat_id, checklist = {} } = req.body;

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

    // SIMPAN CHECKLIST
    await db.promise().query(`
    UPDATE mobay_pengajuan
    SET checklist_verifikasi = ?
    WHERE id = ?
    `, [
    JSON.stringify(checklist),
    surat_id
    ]);

    // UPDATE STATUS
    await db.promise().query(`
    UPDATE mobay_mirror_po
    SET status_pengolahan = 'Proses Pembayaran'
    WHERE pengajuan_id = ?
    `, [surat_id]);

    generatePDF(res, data, checklist);

  } catch (err) {
    console.error("ERROR cetakVerifikasi:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.cetakVerifikasiUlang = async (req, res) => {
  try {

    const {
      surat_id,
      checklist = {}
    } = req.body;

    if (!surat_id) {
      return res.status(400).json({
        message: "surat_id wajib"
      });
    }

    const data =
      await mirrorService.ambilDataBySurat(surat_id);

    await db.promise().query(`
      UPDATE mobay_pengajuan
      SET checklist_verifikasi = ?
      WHERE id = ?
    `, [
      JSON.stringify(checklist),
      surat_id
    ]);

    generatePDF(
      res,
      data,
      checklist
    );

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
};

exports.editNoVerifikasi = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {

    const {
      surat_id,
      no_verifikasi,
      peg_id
    } = req.body;

    if (!surat_id) {
      throw new Error("surat_id wajib");
    }

    if (!no_verifikasi) {
      throw new Error("no_verifikasi wajib");
    }

    await conn.beginTransaction();

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
        surat_id
      ]
    );

    await conn.commit();

    res.json({
      message: "Nomor verifikasi berhasil diupdate"
    });

  } catch (err) {

    await conn.rollback();

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  } finally {

    conn.release();

  }
};

const generatePDF = (res, payload, checklist = {}) => {
  const {
    no_surat,
    no_verifikasi,
    tujuan = "Bagian Keuangan",
    prvdr_str,
    prvdr_address,
    keterangan,
    tanggal_surat,
    jenis_pengajuan = 'V6',
    invoiceDetails = []
  } = payload;

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const safeNo = (no_verifikasi || "NO").replace(/[\/\\]/g, "-");
  const fileName = `Lembar_Verifikasi_${safeNo}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  doc.pipe(res);

  // ================= DATA PREPARATION =================
  const validInvoices = invoiceDetails.filter(i => i.status_validasi === "Valid");
  const invalidInvoices = invoiceDetails.filter(i => i.status_validasi !== "Valid");

  const grandTotal = validInvoices.reduce((sum, inv) => sum + Number(inv.diajukan || 0), 0);
  const grandPPN   = validInvoices.reduce((sum, inv) => sum + Number(inv.ppn || 0), 0);
  const grandPPh   = validInvoices.reduce((sum, inv) => sum + Number(inv.pph || 0), 0);

  const cleanAddress = (prvdr_address || "").replace(/\r/g, "").trim();

  let y = 50;
  let isFirstPage = true;

  // ================= HELPER =================
  const formatRupiah = (angka) =>
    Math.ceil(Number(angka || 0)).toLocaleString("id-ID");

  const formatTanggalPanjang = (tgl) => 
    new Date(tgl).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });

  const getChecklistItems = () => {
    if (jenis_pengajuan === 'V5') {
      return [
        { key: "kwitansi", label: "Kwitansi" },
        { key: "faktur_nota", label: "Faktur / Nota" },
        { key: "faktur_pajak", label: "Faktur Pajak" },
        { key: "kelengkapan", label: "Kelengkapan (SIUP, TDP, NPWP, No. Rek)" },
        { key: "rba", label: "Fotokopi RBA" },
        { key: "dokumentasi", label: "Dokumentasi Kegiatan" },
      ];
    }
    return [
      { key: "kwitansi", label: "Kwitansi" },
      { key: "invoice", label: "Invoice dari Sistem" },
      { key: "sp", label: "Surat Pesanan dari Sistem" },
      { key: "bast", label: "BAST dari Sistem" },
      { key: "rba", label: "Fotokopi RBA" },
      { key: "dokumentasi", label: "Dokumentasi Kegiatan" },
    ];
  };

  const checklistItems = getChecklistItems();

  // ================= HEADER FULL =================
  const renderHeaderFull = () => {
    y = 140;

    doc.rect(50, 40, 130, 40).stroke();
    doc.fontSize(10).text("BELANJA\nBARANG / JASA", 55, 50);

    doc.rect(420, 40, 100, 40).stroke();
    doc.fontSize(18).text(jenis_pengajuan, 455, 52);

    doc.fontSize(12).text("LEMBAR VERIFIKASI", 225, 50);
    doc.fontSize(10).text(`No. ${no_verifikasi}`, 230, 70);

    doc.text(`Kepada Yth.\n${tujuan} \ndi Tempat`, 370, 100);

    doc.fontSize(11);

    doc.text("Mohon dibayar atas belanja Rumah Sakit, kepada:", 50, y);
    y += 25;

    doc.text("Nama", 50, y);
    doc.text(`: ${prvdr_str || "-"}`, 150, y);
    y += 20;

    doc.text("Alamat", 50, y);
    doc.text(`: ${cleanAddress}`, 150, y, { width: 350 });
    y += 25 + 25;

    doc.text("Kegiatan belanja", 50, y);
    doc.text(`: ${keterangan || "-"}`, 150, y, { width: 350 });
    
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Rp. " + formatRupiah(grandTotal), 370, y);
    y += 30;

    doc.font("Helvetica").fontSize(11);

    // ================= CHECKLIST =================
    doc.text("Kelengkapan dokumen :", 50, y);
    y += 22;

    checklistItems.forEach((item, index) => {
      const isChecked = !!checklist?.[item.key];

      doc.rect(60, y - 2, 12, 12).stroke();

      if (isChecked) {
        doc.font("Helvetica-Bold").text("V", 62.5, y - 1);
        doc.font("Helvetica");
      }

      doc.text(`${index + 1}. ${item.label}`, 80, y);
      y += 19;                    // <-- dikurangi sedikit
    });

    y += 15;   // Jarak setelah checklist (sebelum tanda tangan)

    renderSignatureSection();
  };

  // ================= TANDA TANGAN =================
  const renderSignatureSection = () => {
    const leftX = 50;
    const rightX = 350;
    const signWidth = 200;
    const startY = y;

    doc.font("Helvetica").fontSize(11);

    doc.text("Mengetahui,", leftX, startY, { width: signWidth, align: "center" });
    doc.text(`Kraksaan, ${formatTanggalPanjang(tanggal_surat)}`, rightX, startY, { width: signWidth, align: "center" });

    doc.text("Pejabat Penatausahaan Keuangan", leftX, startY + 18, { width: signWidth, align: "center" });
    doc.text("Petugas Verifikasi,", rightX, startY + 18, { width: signWidth, align: "center" });

    // Nama
    doc.font("Helvetica-Bold");
    doc.text("YULI SUCIATI ZAINI PUTRI, S.E.", leftX, startY + 75, { width: signWidth, align: "center" });
    doc.text("SAFI'I, S.H.", rightX, startY + 75, { width: signWidth, align: "center" });

    // NIP
    doc.font("Helvetica");
    doc.text("NIP. 19790713 201001 2 002", leftX, startY + 93, { width: signWidth, align: "center" });
    doc.text("NIP. 19811004 200903 1 001", rightX, startY + 93, { width: signWidth, align: "center" });

    y = startY + 130;   // Naikkan y setelah tanda tangan
  };

  // ================= TABLE HEADER =================
  const drawTableHeader = () => {
    doc.font("Helvetica-Bold").fontSize(10);
  
    doc.text("No", 50, y);
    doc.text("No Invoice", 80, y);
  
    doc.text("Total (Rp)", 170, y, {
      width: 90,
      align: "right"
    });
  
    doc.text("DPP (Rp)", 270, y, {
      width: 80,
      align: "right"
    });
  
    doc.text("PPN (Rp)", 360, y, {
      width: 80,
      align: "right"
    });
  
    doc.text("PPh (Rp)", 450, y, {
      width: 70,
      align: "right"
    });
  
    doc.text("Verif", 525, y);
  
    y += 18;
  
    doc.moveTo(50, y).lineTo(550, y).stroke();
  
    y += 10;
  
    doc.font("Helvetica");
  };

  // ================= RENDER TABLE =================
  const renderTable = (invoices, isValidPage = true) => {
    if (isFirstPage) {
      renderHeaderFull();
      isFirstPage = false;
    } else {
      y = 50;
    }

    doc.font("Helvetica-Bold").fontSize(8).text("Rincian Invoice :", 50, y);
    y += 20;
    drawTableHeader();

    const pageHeight = doc.page.height - doc.page.margins.bottom;

    invoices.forEach((inv, i) => {
      if (y + 25 > pageHeight) {
        doc.addPage();
        y = 50;
        doc.font("Helvetica-Bold").fontSize(8).text("Rincian Invoice :", 50, y);
        y += 20;
        drawTableHeader();
      }

      doc.font("Helvetica").fontSize(10);

      doc.text(i + 1, 50, y);

      doc.text(inv.invoice_no || "-", 80, y, {
        width: 80
      });

      doc.text(formatRupiah(inv.diajukan), 170, y, {
        width: 90,
        align: "right"
      });

      doc.text(formatRupiah(inv.dpp), 270, y, {
        width: 80,
        align: "right"
      });

      doc.text(formatRupiah(inv.ppn), 360, y, {
        width: 80,
        align: "right"
      });

      doc.text(formatRupiah(inv.pph), 450, y, {
        width: 70,
        align: "right"
      });

      doc.rect(535, y, 10, 10).stroke();
      doc.font("Helvetica-Bold").text(
        inv.status_validasi === "Valid" ? "V" : "X", 537, y + 2
      );
      doc.font("Helvetica");

      y += 20;
    });

    if (isValidPage) {
      if (y + 90 > pageHeight) doc.addPage(), y = 50;

      y += 12;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      doc.font("Helvetica-Bold").fontSize(10);

      doc.text("Jumlah Belanja", 50, y);

      doc.text("Rp. " + formatRupiah(grandTotal), 350, y, {
        width: 150,
        align: "right"
      });

      y += 18;

      doc.text("PPN", 50, y);

      doc.text("Rp. " + formatRupiah(grandPPN), 350, y, {
        width: 150,
        align: "right"
      });

      y += 18;

      doc.text("PPh 22", 50, y);

      doc.text("Rp. " + formatRupiah(grandPPh), 350, y, {
        width: 150,
        align: "right"
      });
    }
  };

  // ================= RENDER PDF =================
  renderTable(validInvoices, true);

  if (invalidInvoices.length > 0) {
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(12).text("DAFTAR INVOICE TIDAK VALID", 50, 45);
    renderTable(invalidInvoices, false);
  }

  doc.end();
};

//module.exports = { generatePDF }; // kalau mau di-export