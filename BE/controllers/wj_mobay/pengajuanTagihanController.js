const db = require("../../db/connection-lokal");
const mirrorService = require("./mirrorPoService");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const formatRupiah = (angka) => {
  return "Rp." + Number(angka).toLocaleString("id-ID") + ",-";
};

const formatTanggalIndo = (tgl) => {
  const date = new Date(tgl);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// HELPER
const MIRROR_WORKFLOW_STATUS = [
  "Proses Pengajuan",
  "Proses Pengantaran",
  "Proses Verifikasi",
  "Valid",
  "Tidak Valid",
  "Proses Pembayaran",
  "Selesai"
];

const isMirrorSource = (header) =>
  header && MIRROR_WORKFLOW_STATUS.includes(header.status_pengolahan);


exports.getData = async (req, res) => {
  try {
    const { start, end, typeTglFilter } = req.query;

    const rows = await mirrorService.getDataMirrorPengajuanByTanggal(
      start,
      end,
      typeTglFilter
    );

    const map = {};

    for (const r of rows) {
      if (!map[r.po_acce_id]) {
        map[r.po_acce_id] = {
          po_acce_id: r.po_acce_id,
          invoice_no: r.invoice_no,
          srvc_unit_nm: r.srvc_unit_nm,
          prvdr_id: r.prvdr_id,
          prvdr_str: r.prvdr_str,
          prvdr_address: r.prvdr_address,

          id: r.id,

          invoice_dt: r.invoice_dt,
          invoice_due_dt: r.invoice_due_dt,
          invoice_paid_dt: r.invoice_paid_dt,
          invoice_received_dt: r.invoice_received_dt,
          invoice_consolidated_dt: r.invoice_consolidated_dt,

          status_pengolahan: r.status_pengolahan,
          status_validasi: r.status_validasi,
          status_pembayaran: r.status_pembayaran,
          catatan_verifikasi: r.catatan_verifikasi,
          kunci_invoice: r.kunci_invoice,

          total_tagihan: Number(r.total_tagihan ?? 0),
          total_diajukan: Number(r.total_diajukan ?? 0),
          total_bayar: Number(r.total_bayar ?? 0),
          selisih_bayar: Number(r.selisih_bayar ?? 0),

          items: [],
          data_source: "MIRROR"
        };
      }

      if (r.item_id) {
        map[r.po_acce_id].items.push({
          drug_equi_id: r.drug_equi_id,
          drug_nm: r.drug_nm,
          qty: Number(r.qty ?? 0),
          price: Number(r.price ?? 0),
          tax: Number(r.tax ?? 0),
          discount: Number(r.discount ?? 0),
          nettoprice: Number(r.nettoprice ?? 0),
          subtotal: Number(r.subtotal ?? 0),
          nominal_ajukan: Number(r.nominal_ajukan ?? 0),
          nominal_bayar: Number(r.nominal_bayar ?? 0),
          is_checked: Number(r.is_checked) === 1,
          status_validasi: r.item_status_validasi,
          status_pembayaran: r.item_status_pembayaran,
          jenis_item: r.jenis_item
        });
      }
    }

    res.json({
      periode: { start, end },
      totalInvoice: Object.keys(map).length,
      data: Object.values(map),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Gagal memuat data mirror" });
  }
};

// ===============================
// CREATE SURAT PENGANTAR
// ===============================
exports.createSuratPengantar = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const {
      no_surat,
      tanggal_surat,
      tujuan,
      keterangan,
      jenis_pengajuan,
      invoice_ids
    } = req.body;

    if (!no_surat || !tanggal_surat || !invoice_ids?.length) {
      return res.status(400).json({
        message: "No surat, tanggal dan minimal 1 invoice wajib diisi",
      });
    }

    await conn.beginTransaction();

    // Insert Header
    const [result] = await conn.query(
      `INSERT INTO mobay_pengajuan
       (no_surat, tanggal_surat, tujuan, keterangan, jenis_pengajuan, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'Proses Pengajuan', NOW())`,
      [no_surat, tanggal_surat, tujuan, keterangan, jenis_pengajuan ? jenis_pengajuan : 'V5']
    );

    const suratId = result.insertId;

    // Ambil Data Invoice
    const [invoices] = await conn.query(
      `SELECT id, po_acce_id, invoice_no, total_tagihan, total_diajukan, prvdr_str, prvdr_address
      FROM mobay_mirror_po
      WHERE id IN (?)`,
      [invoice_ids]
    );

    // Ambil detail item
    const [items] = await conn.query(
      `SELECT 
        mirror_po_id,
        jenis_item,
        SUM(subtotal) subtotal
        FROM mobay_mirror_po_dtl
        WHERE mirror_po_id IN (?)
        GROUP BY mirror_po_id, jenis_item`,
      [invoices.map(i => i.id)]
    );

    const itemMap = {};

    items.forEach(it => {

      if (!itemMap[it.mirror_po_id]) {
        itemMap[it.mirror_po_id] = {
          OBAT: 0,
          BMHP: 0,
          LAINNYA: 0
        };
      }

      const subtotal = Number(it.subtotal || 0);

      if (it.jenis_item === "Obat") {
        itemMap[it.mirror_po_id].OBAT += subtotal;
      }
      else if (it.jenis_item === "BMHP") {
        itemMap[it.mirror_po_id].BMHP += subtotal;
      }
      else {
        itemMap[it.mirror_po_id].LAINNYA += subtotal;
      }

    });

    const invoiceDetails = invoices.map(inv => {

      const detail = itemMap[inv.id] || {
        OBAT: 0,
        BMHP: 0,
        LAINNYA: 0
      };

      const total =
        detail.OBAT +
        detail.BMHP +
        detail.LAINNYA;

      const diajukan = Number(inv.total_diajukan ?? inv.total_tagihan ?? 0);

      const kenaPajak = diajukan > 2220000;

      const dpp = kenaPajak ? diajukan * 1.11 : 0;
      const ppn = kenaPajak ? dpp * 0.11 : 0;
      const pph = kenaPajak ? dpp * 0.015 : 0;

      return {
        invoice_no: inv.invoice_no,
        obat: detail.OBAT,
        bmhp: detail.BMHP,
        lainnya: detail.LAINNYA,
        total,
        diajukan,
        dpp,
        ppn,
        pph
      };
    });

    const grandTotal = invoiceDetails.reduce((a, b) => a + b.diajukan, 0);

    await conn.query(`
      UPDATE mobay_pengajuan
      SET total_pengajuan = ?
      WHERE id = ?
    `, [grandTotal, suratId]);

    const grandDPP = invoiceDetails.reduce((a, b) => a + b.dpp, 0);
    const grandPPN = invoiceDetails.reduce((a, b) => a + b.ppn, 0);
    const grandPPh = invoiceDetails.reduce((a, b) => a + b.pph, 0);

    // VALIDASI: Semua invoice harus dari provider yg sama
    const providerList = [...new Set(invoices.map(inv => inv.prvdr_str))];

    if (providerList.length > 1) {
      throw new Error("Invoice harus berasal dari provider yang sama");
    }

    // ambil provider pertama
    const prvdr_str = invoices[0]?.prvdr_str || "-";
    const prvdr_address = invoices[0]?.prvdr_address || "-";

    const totalTagihan = invoices.reduce(
      (sum, inv) => sum + Number(inv.total_tagihan || 0),
      0
    );

    //total ajukan samakan dg total tagihan krn tidak ada proses editing nominal saat ajukan
    // Update Invoice satu per satu
    for (const inv of invoices) {
      await conn.query(
        `UPDATE mobay_mirror_po
        SET status_pengolahan = 'Proses Pengajuan',
            pengajuan_id = ?,
            total_diajukan = ?,
            invoice_submitted_dt = NOW()
        WHERE id = ?`,
        [suratId, Number(inv.total_diajukan || 0), inv.id]
      );
    }

    await conn.commit();

    // ==========================
    // GENERATE PDF FORMAL
    // ==========================

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const fileName = `Surat_Pengantar_${no_surat}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    doc.pipe(res);

    // ================= HEADER =================
    doc.rect(50, 40, 100, 40).stroke();
    doc.fontSize(10).text("BELANJA\nBARANG / JASA", 55, 50);

    doc.rect(420, 40, 100, 40).stroke();
    doc.fontSize(18).text(`${jenis_pengajuan}`, 455, 50);

    doc.fontSize(12).text("SURAT PENGANTAR PENGAJUAN", 190, 50);
    doc.fontSize(10).text(`No. ${no_surat}`, 230, 70);

    // ================= KEPADA =================
    doc.fontSize(10).text(
      `Kepada Yth.\n${tujuan} \ndi Tempat`,
      370,
      100
    );

    // ================= BODY =================
    doc.moveDown(4);
    doc.fontSize(11);

    let y = 140;

    doc.text("Mohon diverifikasi pengajuan belanja Rumah Sakit, kepada:", 50, y);
    y += 25;

    doc.text("Nama", 50, y);
    doc.text(`: ${prvdr_str}`, 150, y);
    y += 20;

    doc.text("Alamat", 50, y);
    doc.text(`: ${prvdr_address}`, 150, y);
    y += 50;

    doc.text("Kegiatan belanja", 50, y);
    doc.text(`: ${keterangan}`, 150, y, { width: 350 });
    y += 30;

    // ================= CHECKLIST =================
    doc.font("Helvetica");
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
      //doc.rect(60, y - 2, 12, 12).stroke();
      doc.text(`${index + 1}. ${item}`, 55, y);
      y += 20;
    });

    // ================= TTD =================
    y += 20;

    // Kolom kiri
    doc.font("Helvetica");
    //doc.text("Mengetahui,", 50, y);
    //y += 18;

    //doc.text("Pejabat Penatausahaan Keuangan", 50, y);

    // Kolom kanan (tanggal & jabatan)
    doc.text(`Kraksaan, ${formatTanggalIndo(tanggal_surat)}`, 350, y - 18);
    doc.text("Pejabat Penunjang,", 350, y);

    y += 50;

    /// ================= NAMA (BOLD + UNDERLINE) =================
    doc.font("Helvetica-Bold");

    // ----- NAMA KIRI -----
    //const namaKiri = "YULI SUCIATI ZAINI PUTRI, S.E.";
    //doc.text(`${namaKiri}`, 50, y);

    // hitung lebar teks untuk underline
    //const widthKiri = doc.widthOfString(`(${namaKiri})`);
    //doc.moveTo(50, y + 15)
    //  .lineTo(50 + widthKiri, y + 15)
    //  .stroke();

    // ----- NAMA KANAN -----
    const namaKanan = "SUGIANTO, S.Kep.,Ns., M.M.";
    doc.text(`${namaKanan}`, 350, y);

    const widthKanan = doc.widthOfString(`(${namaKanan})`);
    doc.moveTo(350, y + 15)
      .lineTo(350 + widthKanan, y + 15)
      .stroke();

    y += 22;

    // ================= NIP (NORMAL) =================
    doc.font("Helvetica");
    //doc.text("NIP. 19781012 200903 1 001", 50, y);
    doc.text("NIP. 19681212 199303 1 017", 350, y);
    y += 40;

    // ================= DAFTAR INVOICE =================
    doc.font("Helvetica-Bold");
    doc.fontSize(8);
    doc.text("Rincian Invoice :", 50, y);
    y += 20;

    doc.text("No", 50, y);
    doc.text("No Invoice", 70, y);

    //y += 15;

    doc.text("Obat", 200, y);
    doc.text("BMHP", 270, y);
    doc.text("Lainnya", 340, y);
    //doc.text("Total", 390, y);
    //doc.text("PPN", 380, y);
    //doc.text("PPh", 460, y);
    //doc.text("Verifikasi", 520, y);
    doc.text("Total Diajukan", 410, y);

    doc.moveDown(0.5);
    doc.font("Helvetica");
    y += 15;

    const pageHeight = doc.page.height;

    invoiceDetails.forEach((inv, index) => {

      // kalau sudah mendekati bawah
      if (y > pageHeight - 100) {
        doc.addPage();
        y = 50; // reset ke atas

        // ulang header tabel di halaman baru
        doc.font("Helvetica-Bold");
        doc.text("No", 50, y);
        doc.text("No Invoice", 70, y);
        doc.text("Obat", 200, y);
        doc.text("BMHP", 270, y);
        doc.text("Lainnya", 340, y);
        //doc.text("Total", 390, y);
        doc.text("Total Diajukan", 410, y);

        y += 20;
        doc.font("Helvetica");
      }

      // baris 1
      doc.text(index + 1, 50, y);
      doc.text(inv.invoice_no, 70, y);

      //y += 15;

      // baris 2
      doc.text(formatRupiah(inv.obat), 200, y);
      doc.text(formatRupiah(inv.bmhp), 270, y);
      doc.text(formatRupiah(inv.lainnya), 340, y);
      //doc.text(formatRupiah(inv.total), 390, y);
      //doc.text(formatRupiah(inv.ppn), 380, y);
      doc.text(formatRupiah(inv.diajukan), 410, y);
      //doc.rect(540, y - 2, 12, 12).stroke();

      y += 22;

    });

    y += 15;

    // ================= TOTAL =================
    doc.font("Helvetica-Bold");
    doc.fontSize(10);

    doc.text("Jumlah Belanja", 50, y);
    doc.text(formatRupiah(grandTotal), 410, y);
    y += 20;

    //doc.text("PPN 11%", 50, y);
    //doc.text(formatRupiah(grandPPN), 220, y);
    //y += 20;

    //doc.text("PPh 1.5%", 50, y);
    //doc.text(formatRupiah(grandPPh), 220, y);
    //y += 40;

    doc.end();

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
};

exports.hapusKonsolidasi = async (req, res) => {
  const { po_acce_id } = req.body;

  try {
    if (!po_acce_id) {
      return res.status(400).json({
        message: "ID wajib diisi",
      });
    }

    await mirrorService.updateStatusKonsolidasi(po_acce_id);

    return res.json({
      message: "Konsolidasi berhasil dihapus",
    });
  } catch (err) {
    console.error("Error hapus konsolidasi:", err);

    return res.status(500).json({
      message: "Gagal menghapus konsolidasi",
    });
  }
};