const db = require("../../db/connection-lokal");

// ===============================
// GET LIST SURAT PENGANTAR (Proses Pengantaran)
// ===============================
exports.getSuratPengantarList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start,
      end,
      provider,
      invoice,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];

    // ===============================
    // FILTER TANGGAL SURAT
    // ===============================
    if (start && end) {
      where.push("sp.tanggal_surat BETWEEN ? AND ?");
      params.push(start, end);
    }

    // ===============================
    // FILTER PROVIDER / INVOICE
    // pakai EXISTS supaya grouping aman
    // ===============================
    if (provider && provider.trim() !== "") {
      where.push(`
        EXISTS (
          SELECT 1 FROM mobay_mirror_po mp2
          WHERE mp2.pengajuan_id = sp.id
          AND mp2.prvdr_str LIKE ?
        )
      `);
      params.push(`%${provider}%`);
    }

    if (invoice && invoice.trim() !== "") {
      where.push(`
        EXISTS (
          SELECT 1 FROM mobay_mirror_po mp3
          WHERE mp3.pengajuan_id = sp.id
          AND mp3.invoice_no LIKE ?
        )
      `);
      params.push(`%${invoice}%`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ===============================
    // QUERY DATA
    // ===============================
    const [rows] = await db.promise().query(
      `
      SELECT 
        sp.id,
        sp.no_surat,
        sp.tanggal_surat,
        mp.invoice_consolidated_dt,
        mp.invoice_submitted_dt,
        MAX(mp.prvdr_str) as prvdr_str,
        COUNT(mp.id) as total_invoice,
        SUM(mp.total_diajukan) as total_diajukan
      FROM mobay_pengajuan sp
      JOIN mobay_mirror_po mp 
        ON mp.pengajuan_id = sp.id
        AND mp.status_pengolahan = 'Proses Pengantaran'
      ${whereSQL}
      GROUP BY sp.id
      ORDER BY sp.tanggal_surat DESC
      LIMIT ?, ?
      `,
      [...params, offset, limitNum]
    );

    // ===============================
    // QUERY TOTAL COUNT
    // ===============================
    const [countRows] = await db.promise().query(
      `
      SELECT COUNT(DISTINCT sp.id) as total
      FROM mobay_pengajuan sp
      LEFT JOIN mobay_mirror_po mp 
        ON mp.pengajuan_id = sp.id
      ${whereSQL}
      `,
      params
    );

    const totalData = countRows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    res.json({
      page: pageNum,
      limit: limitNum,
      totalData,
      totalPage,
      data: rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// GET DETAIL SURAT PENGANTAR
// ===============================
exports.getDetailSuratPengantar = async (req, res) => {
  try {
    const { id } = req.params;

    const [suratRows] = await db.promise().query(
      `SELECT *
       FROM mobay_pengajuan
       WHERE id = ?`,
      [id]
    );

    if (!suratRows.length) {
      return res.status(404).json({
        message: "Surat tidak ditemukan",
      });
    }

    const [invoices] = await db.promise().query(
      `
      SELECT id,
        po_acce_id,
        invoice_no,
        total_tagihan,
        total_diajukan,
        status_pengolahan
      FROM mobay_mirror_po
      WHERE pengajuan_id = ?
      `,
      [id]
    );

    res.json({
      ...suratRows[0],
      invoices,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil detail surat",
    });
  }
};

// ===============================
// TERIMA BERKAS (BY SURAT)
// ===============================
exports.terimaBerkas = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    const { surat_id, received_by } = req.body;

    if (!surat_id) {
      return res.status(400).json({
        message: "Surat wajib dipilih",
      });
    }

    if (!received_by) {
      return res.status(400).json({
        message: "User penerima tidak valid",
      });
    }

    await conn.beginTransaction();

    // Validasi surat masih dalam status Proses Pengantaran
    const [cek] = await conn.query(
      `
      SELECT sp.id
      FROM mobay_pengajuan sp
      JOIN mobay_mirror_po mp
        ON mp.pengajuan_id = sp.id
      WHERE sp.id = ?
        AND mp.status_pengolahan = 'Proses Pengantaran'
      LIMIT 1
      `,
      [surat_id]
    );

    if (!cek.length) {
      throw new Error("Surat tidak dalam status Proses Pengantaran");
    }

    // 1️⃣ Update header surat
    await conn.query(
      `
      UPDATE mobay_pengajuan
      SET status = 'Berkas Diterima',
          received_at = NOW(),
          received_by = ?
      WHERE id = ?
      `,
      [received_by, surat_id]
    );

    // 2️⃣ Update semua invoice dalam surat
    await conn.query(
      `
      UPDATE mobay_mirror_po
        SET status_pengolahan = 'Berkas Diterima',
            invoice_accepted_dt = NOW()
      WHERE pengajuan_id = ?
      `,
      [surat_id]
    );

    await conn.commit();

    res.json({
      message: "Berkas berhasil diterima"
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