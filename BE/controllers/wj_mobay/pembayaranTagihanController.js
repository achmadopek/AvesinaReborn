const db = require("../../db/connection-lokal");
const mirrorService = require("./mirrorPoService");

exports.getData = async (req, res) => {
  try {
    const { start, end, typeTglFilter } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start dan End wajib diisi"
      });
    }

    const allowedDateFields = {
      po_dt: "h.po_dt",
      invoice_dt: "h.invoice_dt",
      invoice_received_dt: "h.invoice_received_dt",
      invoice_due_dt: "h.invoice_due_dt",
      tgl_konsolidasi: "h.invoice_consolidated_dt",
      tgl_pengajuan: "h.invoice_submitted_dt",
      tgl_terima: "h.invoice_accepted_dt",
      tgl_verifikasi: "h.invoice_verified_dt",
      invoice_paid_dt: "h.invoice_paid_dt",
    };

    const column = allowedDateFields[typeTglFilter] || "h.po_dt";

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
        sp.id AS pengajuan_id,

        sp.no_surat,
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

      WHERE h.status_validasi = 'Valid'
        AND h.status_pengolahan = 'Proses Pembayaran'
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
        resolve(results || []);
      });
    });

    // ===============================
    // GROUPING BY SURAT
    // ===============================

    const map = {};

    for (const r of rows) {

      // ------------------------------
      // INIT SURAT JIKA BELUM ADA
      // ------------------------------
      if (!map[r.pengajuan_id]) {

        map[r.pengajuan_id] = {
          surat_id: r.pengajuan_id,
          no_surat: r.no_surat,
          tgl_surat: r.tanggal_surat,
          tgl_konsolidasi: r.invoice_consolidated_dt,
          tgl_pengajuan: r.invoice_submitted_dt,
          tgl_terima: r.invoice_accepted_dt,
          tgl_verifikasi: r.invoice_verified_dt,

          provider: {},

          total_invoice: 0,
          total_diajukan: 0,
        };
      }

      const surat = map[r.pengajuan_id];

      // ------------------------------
      // GROUP PROVIDER
      // ------------------------------
      const providerKey = r.prvdr_id || "UNKNOWN";

      if (!surat.provider[providerKey]) {
        surat.provider[providerKey] = {
          prvdr_id: r.prvdr_id,
          prvdr_str: r.prvdr_str || "Provider Tidak Diketahui",
          invoices: []
        };
      }

      const providerGroup = surat.provider[providerKey];

      // ------------------------------
      // PUSH INVOICE (LEVEL HEADER)
      // ------------------------------
      if (r.po_acce_id) {

        // Cegah duplikat invoice (karena join item)
        let invoice = providerGroup.invoices.find(
          inv => inv.po_acce_id === r.po_acce_id
        );

        if (!invoice) {
          invoice = {
            mirror_po_id: r.mirror_po_id,
            po_acce_id: r.po_acce_id,
            invoice_no: r.invoice_no,
            status_pengolahan: r.status_pengolahan,
            total_tagihan: Number(r.total_tagihan || 0),
            total_diajukan: Number(r.total_diajukan || 0),
            total_bayar: Number(r.total_bayar || 0),
            selisih_bayar: Number(r.selisih_bayar || 0),
            invoice_dt: r.invoice_dt,
            invoice_received_dt: r.invoice_received_dt,
            invoice_due_dt: r.invoice_due_dt,
            invoice_consolidated_dt: r.invoice_consolidated_dt,
            invoice_submitted_dt: r.invoice_submitted_dt,
            invoice_accepted_dt: r.invoice_accepted_dt,
            invoice_paid_dt: r.invoice_paid_dt,
            items: []
          };

          providerGroup.invoices.push(invoice);

          // Hitung total surat
          surat.total_invoice += 1;
          surat.total_diajukan += invoice.total_diajukan;
        }

        // ------------------------------
        // PUSH ITEM
        // ------------------------------
        if (r.item_id) {

          const itemExists = invoice.items.find(
            it => it.item_id === r.item_id
          );

          if (!itemExists) {
            invoice.items.push({
              item_id: r.item_id,
              drug_nm: r.drug_nm,
              qty: Number(r.qty || 0),
              subtotal: Number(r.subtotal || 0),
              nominal_ajukan: Number(r.nominal_ajukan || 0),
              is_checked: Number(r.is_checked) === 1
            });
          }

        }

      }

    }

    // ===============================
    // PASTIKAN SURAT TETAP ADA PROVIDER
    // WALAU TIDAK ADA INVOICE
    // ===============================

    for (const suratId in map) {

      const surat = map[suratId];

      if (!Object.keys(surat.provider).length) {

        surat.provider["EMPTY"] = {
          prvdr_id: null,
          prvdr_str: "Belum Ada Invoice",
          invoices: []
        };

      }

    }

    res.json({
      periode: { start, end },
      totalInvoice: Object.keys(map).length,
      data: Object.values(map)
    });

  } catch (error) {
    console.error("Error getData Mirror:", error);
    res.status(500).json({ message: "Gagal memuat data mirror" });
  }
};

// BAYAR BENDEL
exports.bayarBendel = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const {
      pengajuan_id,
      catatan,
      tgl_bayar,
      invoice_actions = []
    } = req.body;

    if (!pengajuan_id) {
      throw new Error("pengajuan_id wajib");
    }

    if (!invoice_actions.length) {
      throw new Error("Invoice pembayaran belum dipilih");
    }

    // ===============================
    // VALIDASI INVOICE
    // ===============================
    const poIds = invoice_actions.map(i => i.po_acce_id);

    const [invoices] = await conn.query(
      `
      SELECT
        id,
        po_acce_id,
        total_tagihan,
        total_diajukan
      FROM mobay_mirror_po
      WHERE pengajuan_id = ?
        AND status_validasi = 'Valid'
        AND po_acce_id IN (?)
      `,
      [pengajuan_id, poIds]
    );

    if (!invoices.length) {
      throw new Error("Invoice valid tidak ditemukan");
    }

    // ===============================
    // PROCESS EACH INVOICE
    // ===============================
    for (const actionInv of invoice_actions) {

      const dbInvoice = invoices.find(
        i => i.po_acce_id === actionInv.po_acce_id
      );

      if (!dbInvoice) {
        continue;
      }

      const selisih =
        Number(dbInvoice.total_tagihan || 0) -
        Number(dbInvoice.total_diajukan || 0);

      await conn.query(
        `
        UPDATE mobay_mirror_po
        SET
          total_bayar = total_diajukan,
          selisih_bayar = ?,
          status_pengolahan = 'Selesai',
          status_pembayaran =
            CASE
              WHEN ? = 0 THEN 'Lunas'
              ELSE 'Kurang Bayar'
            END,
          invoice_paid_dt = ?,
          catatan_bayar = ?
        WHERE po_acce_id = ?
        `,
        [
          selisih,
          selisih,
          tgl_bayar || new Date(),
          catatan || null,
          actionInv.po_acce_id
        ]
      );
    }

    // ===============================
    // OPTIONAL:
    // UPDATE STATUS SURAT
    // ===============================

    const [summary] = await conn.query(
      `
      SELECT
        COUNT(*) total,
        SUM(
          CASE WHEN status_pengolahan = 'Selesai'
          THEN 1 ELSE 0 END
        ) selesai,
        SUM(
          CASE WHEN status_pengolahan = 'Batal'
          THEN 1 ELSE 0 END
        ) batal
      FROM mobay_mirror_po
      WHERE pengajuan_id = ?
      `,
      [pengajuan_id]
    );

    await conn.commit();

    res.json({
      message: "Pembayaran bendel berhasil",
      summary: summary[0]
    });

  } catch (err) {

    await conn.rollback();

    console.error("Error bayarBendel:", err);

    res.status(500).json({
      message: err.message
    });

  } finally {
    conn.release();
  }
};

// ===============================
// VBATALKAN INVOICE
// ===============================
exports.batalkanInvoice = async (req, res) => {

  try {

    const { po_acce_id } = req.body;

    if (!po_acce_id) {
      throw new Error("po_acce_id wajib");
    }

    await db.promise().query(
      `
      UPDATE mobay_mirror_po
      SET
        status_pengolahan = 'Batal',
        status_pembayaran = 'Tidak Dibayar',
        total_bayar = 0,
        invoice_paid_dt = NULL
      WHERE po_acce_id = ?
      `,
      [po_acce_id]
    );

    res.json({
      message: "Invoice berhasil dibatalkan"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }

};

// ===============================
// KUNCI INVOICE
// ===============================
exports.kunciInvoice = async (req, res) => {
  try {
    const { po_acce_id } = req.body;
    const result = await mirrorService.kunciInvoice(po_acce_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invoice tidak ditemukan" });
    }

    res.json({ message: "Invoice berhasil dikunci" });
  } catch (error) {
    console.error("Error kunciInvoice", error);
    res.status(500).json({ message: "Gagal mengunci invoice" });
  }
};

