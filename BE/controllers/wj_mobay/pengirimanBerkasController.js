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


exports.getDataPengajuan = async (req, res) => {
  try {
    const { start, end } = req.query;

    const [rows] = await db.promise().query(`
      SELECT 
        mp.id AS pengajuan_id,
        mp.no_surat,
        mp.tanggal_surat,
        mpo.id,
        mpo.po_acce_id,
        mpo.invoice_no,
        mpo.srvc_unit_nm,
        mpo.prvdr_id,
        mpo.prvdr_str,
        mpo.prvdr_address,
        mpo.po_dt,
        mpo.invoice_dt,
        mpo.invoice_due_dt,
        mpo.invoice_received_dt,
        mpo.invoice_consolidated_dt,
        mpo.invoice_submitted_dt,
        mpo.total_tagihan,
        mpo.total_diajukan,
        mpo.total_bayar,
        mpo.status_pengolahan,
        mpo.status_validasi,
        mpo.status_pembayaran,
        mpo.kunci_invoice,
        mpod.id AS item_id,
        mpod.drug_nm,
        mpod.qty,
        mpod.price,
        mpod.tax,
        mpod.discount,
        mpod.nettoprice,
        mpod.subtotal,
        mpod.nominal_ajukan,
        mpod.nominal_bayar,
        mpod.jenis_item
      FROM mobay_pengajuan mp
      LEFT JOIN mobay_mirror_po mpo
        ON mpo.pengajuan_id = mp.id
      LEFT JOIN mobay_mirror_po_dtl mpod
        ON mpod.mirror_po_id = mpo.id
      WHERE mp.status = 'Proses Pengajuan'
        AND mp.tanggal_surat BETWEEN ? AND ?
      ORDER BY mp.tanggal_surat DESC, mpo.prvdr_str
    `, [`${start}`, `${end}`]);

    const map = {};

    rows.forEach(row => {

      if (!row.id || !row.po_acce_id) return;

      const providerKey = row.prvdr_id || "UNKNOWN";

      // ===== PROVIDER =====
      if (!map[providerKey]) {
        map[providerKey] = {
          prvdr_id: row.prvdr_id,
          prvdr_str: row.prvdr_str || "PROVIDER TIDAK DIKETAHUI",
          data: [],
          groups: {
            OBAT: [],
            BMHP: [],
            CAMPURAN: [],
            LAIN: []
          }
        };
      }

      const provider = map[providerKey];

      // ===== INVOICE =====
      let inv = provider.data.find(i => i.id === row.id);

      if (!inv) {
        inv = {
          id: row.id,
          pengajuan_id: row.pengajuan_id,
          po_acce_id: row.po_acce_id,

          prvdr_id: row.prvdr_id,
          prvdr_str: row.prvdr_str,
          prvdr_address: row.prvdr_address,

          srvc_unit_nm: row.srvc_unit_nm,
          invoice_no: row.invoice_no,

          po_dt: row.po_dt,

          invoice_dt: row.invoice_dt,
          invoice_due_dt: row.invoice_due_dt,
          invoice_received_dt: row.invoice_received_dt,
          invoice_consolidated_dt: row.invoice_consolidated_dt,
          invoice_submitted_dt: row.invoice_submitted_dt,

          total_tagihan: Number(row.total_tagihan || 0),
          total_diajukan: Number(row.total_diajukan || 0),
          total_bayar: Number(row.total_bayar || 0),

          status_pengolahan: row.status_pengolahan,
          status_validasi: row.status_validasi,
          status_pembayaran: row.status_pembayaran,
          kunci_invoice: Number(row.kunci_invoice || 0),

          items: []
        };

        provider.data.push(inv);
      }

      // ===== ITEM =====
      if (row.item_id) {
        inv.items.push({
          id: row.item_id,
          drug_nm: row.drug_nm,
          qty: row.qty,
          price: row.price,
          tax: row.tax,
          discount: row.discount,
          nettoprice: row.nettoprice,
          subtotal: row.subtotal,
          nominal_ajukan: row.nominal_ajukan,
          nominal_bayar: row.nominal_bayar,
          jenis_item: row.jenis_item
        });
      }
    });

    // ===== GROUPING (OBAT/BMHP) =====
    Object.values(map).forEach(provider => {
      provider.data.forEach(inv => {
        const items = inv.items || [];

        let type = "LAIN";

        if (items.length > 0) {
          const allObat = items.every(it => it.jenis_item === "Obat");
          const allBmhp = items.every(it => it.jenis_item === "BMHP");

          if (allObat) type = "OBAT";
          else if (allBmhp) type = "BMHP";
          else type = "CAMPURAN";
        }

        if (!provider.groups[type]) {
          provider.groups[type] = [];
        }

        provider.groups[type].push(inv);
      });
    });

    const cleaned = Object.values(map).filter(provider =>
      provider.data.length > 0
    );

    return res.json({
      data: cleaned
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil pengajuan" });
  }
};

// ===============================
// CREATE PENGIRIMAN
// ===============================
exports.createPengiriman = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const {
      no_pengiriman,
      tanggal_pengiriman,
      tujuan,
      keterangan,
      pengajuan_ids
    } = req.body;

    if (!no_pengiriman || !tanggal_pengiriman) {
      throw new Error("No dan tanggal pengiriman wajib diisi");
    }

    if (!pengajuan_ids?.length) {
      throw new Error("Minimal 1 pengajuan dipilih");
    }

    await conn.beginTransaction();

    // ================= INSERT HEADER =================
    const [result] = await conn.query(`
      INSERT INTO mobay_pengiriman
      (no_pengiriman, tanggal_pengiriman, tujuan, keterangan, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [no_pengiriman, tanggal_pengiriman, tujuan, keterangan]);

    const pengirimanId = result.insertId;

    // ================= AMBIL DATA PENGAJUAN =================
    const [pengajuanList] = await conn.query(`
      SELECT id, no_surat, tanggal_surat, tujuan, keterangan, total_pengajuan
      FROM mobay_pengajuan
      WHERE id IN (?)
    `, [pengajuan_ids]);

    // ================= INSERT DETAIL + UPDATE STATUS =================
    // ================= INSERT DETAIL + UPDATE STATUS =================
    for (const p of pengajuanList) {
      await conn.query(`
        INSERT INTO mobay_pengiriman_dtl
        (pengiriman_id, pengajuan_id)
        VALUES (?, ?)
      `, [pengirimanId, p.id]);

      await conn.query(`
        UPDATE mobay_pengajuan
        SET status = 'Proses Pengantaran'
        WHERE id = ?
      `, [p.id]);
    }

    // ================= UPDATE STATUS PO (FIX DISINI) =================
    await conn.query(`
      UPDATE mobay_mirror_po
      SET status_pengolahan = 'Proses Pengantaran'
      WHERE pengajuan_id IN (?)
    `, [pengajuan_ids]);

    await conn.commit();

    // WAJIB return di sini
    // ==========================
    // GENERATE PDF
    // ==========================
    return generatePDFPengiriman(res, {
      no_pengiriman,
      tanggal_pengiriman,
      tujuan,
      keterangan,
      pengajuanList
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

const generatePDFPengiriman = (res, data) => {
  const {
    no_pengiriman,
    tanggal_pengiriman,
    tujuan,
    keterangan,
    pengajuanList
  } = data;

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const fileName = `Pengiriman_${no_pengiriman}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  doc.pipe(res);

  // ================= HEADER =================
  doc.fontSize(14).text("DAFTAR PENGIRIMAN BERKAS PENGAJUAN", {
    align: "center",
  });

  doc.moveDown(0.5);
  doc.fontSize(10).text(`No: ${no_pengiriman}`, { align: "center" });
  doc.moveDown(1);

  let y = doc.y + 20;

  // ================= INFO =================
  doc.fontSize(11);
  doc.text(`Tgl Pengiriman`, 50, y);
  doc.text(`: ${formatTanggalIndo(tanggal_pengiriman)}`, 180, y);
  y += 20;

  doc.text(`Tujuan`, 50, y);
  doc.text(`: ${tujuan}`, 180, y);
  y += 20;

  doc.text(`Keterangan`, 50, y);
  doc.text(`: ${keterangan || "-"} `, 180, y);
  y += 40;

  doc.moveDown(1.5);

  // ================= TABLE HEADER =================
  doc.font("Helvetica-Bold");
  doc.fontSize(9);
  doc.text("No", 50, y);
  doc.text("No Surat", 80, y);
  doc.text("Tgl Surat", 220, y);
  doc.text("Keterangan", 280, y);
  doc.text("Total", 400, y);

  y += 20;
  doc.font("Helvetica");

  const pageHeight = doc.page.height;

  pengajuanList.forEach((p, index) => {

    if (y > pageHeight - 80) {
      doc.addPage();
      y = 50;

      doc.font("Helvetica-Bold");
      doc.text("No", 50, y);
      doc.text("No Surat", 80, y);
      doc.text("Tgl Surat", 220, y);
      doc.text("Keterangan", 280, y);
      doc.text("Total", 420, y);

      y += 20;
      doc.font("Helvetica");
    }

    doc.text(index + 1, 50, y);
    doc.text(p.no_surat, 80, y);
    doc.text(formatTanggalIndo(p.tanggal_surat), 220, y);
    doc.text(p.keterangan || "-", 280, y, { width: 110 });
    doc.text(formatRupiah(p.total_pengajuan) || "-", 420, y, { width: 150 });

    y += 20;
  });

  y += 20;

  // ================= FOOTER =================
  doc.moveDown(2);
  doc.fontSize(11);

  doc.text(`Kraksaan, diterima tgl: ________________________ `, 50, y);
  doc.text(`Kraksaan, ${formatTanggalIndo(tanggal_pengiriman)} `, 350, y);

  doc.text("Penerima,", 50, y + 20);
  doc.text("Pengirim,", 350, y + 20);

  doc.moveDown(4);
  doc.font("Helvetica-Bold");
  doc.text("_________________________", 50);
  doc.text("_________________________", 350);

  doc.end();
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