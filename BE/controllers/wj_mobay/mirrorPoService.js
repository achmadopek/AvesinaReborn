require("dotenv").config();
const db = require("../../db/connection-lokal");
const db2 = require("../../db/connection-avesina");

/* ======================================================
 * 🔧 UTIL
 * ====================================================== */
function generateDateRange(start, end) {
  const arr = [];
  const dt = new Date(start);
  while (dt <= new Date(end)) {
    arr.push(dt.toISOString().slice(0, 10));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

/* ======================================================
 * 🟦 A1. SUMBER DATA (READ ONLY – DB AVESINA)
 * Digunakan OLEH: SumberController
 * ====================================================== */
async function getDataSumberByTanggal(startDate, endDate, typeTglFilter) {
  const allowedDateFields = {
    // ====== AVESINA ======
    tgl_po: "po.po_dt",
    tgl_invoice: "pa.invoice_dt",
    tgl_jatuh_tempo: "pa.invoice_due_dt",
    tgl_bayar: "pa.invoice_paid_dt",

    // ====== MIRROR ======
    tgl_inv_datang: "mirror.invoice_received_dt",
    tgl_konsolidasi: "mirror.invoice_consolidated_dt",
    tgl_diajukan: "mirror.invoice_submitted_dt",
    tgl_diterima: "mirror.invoice_accepted_dt",
    tgl_verifikasi: "mirror.invoice_verified_dt",
  };

  const column = allowedDateFields[typeTglFilter];
  if (!column) throw new Error("Invalid date filter");

  let sql = `
    SELECT 
      po.po_id, 
      po.po_dt, 
      po.po_total_amt,
      pa.po_acce_id, 
      pa.invoice_no, 
      pa.invoice_dt, 
      pa.invoice_due_dt, 
      pa.invoice_paid_dt,
      su.srvc_unit_nm, 
      su.srvc_unit_id,
      p.prvdr_id, 
      p.prvdr_str, 
      p.address AS prvdr_address, 
      p.city AS prvdr_city,
      pad.drug_equi_id,
      CASE
          WHEN de.drug_equi_type = 'D' THEN 'Obat'
          WHEN eg.equi_group_id = 1 THEN 'BMHP'
          WHEN eg.equi_group_id = 2 THEN 'Reagen'
          WHEN eg.equi_group_id = 4 THEN 'Konsinyasi'
          WHEN e.equi_type = 'E' THEN 'BMHP'
          WHEN e.equi_type = 'N' THEN 'Alat'
          WHEN de.drug_equi_type = 'E' THEN 'Alat'
          ELSE 'Lainnya'
      END AS jenis_item,
      CASE 
        WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 'Hibah'
        ELSE 'Pembelian'
      END AS jenis_pengadaan,
      COALESCE(d.drug_nm, e.equi_nm) AS item_name,
      pad.qty,
      CASE 
          WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 0 
          ELSE pad.price 
      END AS price,
      CASE 
          WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 0 
          ELSE pad.tax 
      END AS tax,
      CASE 
          WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 0 
          ELSE pad.discount 
      END AS discount,
      CASE 
          WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 0 
          ELSE pad.nettoprice 
      END AS nettoprice,
      CASE 
          WHEN (d.hibah_sts = 1 OR de.hibah_sts = 1) THEN 0 
          ELSE pad.nettoprice * pad.qty 
      END AS subtotal,
      eg.equi_code,
      d.hibah_sts,
      de.hibah_sts
  FROM po
  LEFT JOIN po_acce pa 
      ON pa.po_id = po.po_id
  LEFT JOIN po_acce_dtl pad 
      ON pad.po_acce_id = pa.po_acce_id
  LEFT JOIN drug_equipment de
      ON de.drug_equi_id = pad.drug_equi_id
  LEFT JOIN drug d
      ON d.drug_equi_id = de.drug_equi_id
      AND de.drug_equi_type = 'D'
  LEFT JOIN equipment e
      ON e.drug_equi_id = de.drug_equi_id
      AND de.drug_equi_type = 'E'
  LEFT JOIN equi_group eg 
      ON eg.equi_group_id = e.equi_group_id
  LEFT JOIN service_unit su 
      ON su.srvc_unit_id = po.srvc_unit_id
  LEFT JOIN provider p 
      ON p.prvdr_id = po.prvdr_id
  `;

  let params = [];
  if (!column.startsWith("mirror")) {
    sql += ` WHERE ${column} BETWEEN ? AND ? `;
    params = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
  }

  sql += ` ORDER BY po.po_id, pa.po_acce_id, d.drug_nm`;
  const [rows] = await db2.promise().query(sql, params);

  if (column.startsWith("mirror")) {
    const mirror = await getInvoiceMirrorList();

    const start = new Date(`${startDate} 00:00:00`);
    const end = new Date(`${endDate} 23:59:59`);

    const field = column.split(".")[1]; // ambil nama field mirror

    return rows.filter(r => {
      const m = mirror.get(r.po_acce_id);
      if (!m || !m[field]) return false;

      const dt = new Date(m[field]);
      return dt >= start && dt <= end;
    });
  }

  return rows;
}

async function getProviderList() {
  const [rows] = await db2.promise().query(`
    SELECT prvdr_id, prvdr_str, city
    FROM provider
    ORDER BY prvdr_str ASC
  `);
  return rows;
}

async function getDrugList() {
  const [rows] = await db2.promise().query(`
    SELECT 
      d.drug_equi_id AS item_id,
      d.drug_nm AS item_name,
      CASE 
        WHEN d.generic_sts = 'G' THEN 'Generik'
        ELSE 'Non Generik'
      END AS item_kategori,
      'OBAT' AS item_type
    FROM drug_equipment de
    JOIN drug d
      ON d.drug_equi_id = de.drug_equi_id
    WHERE de.drug_equi_type = 'D'
      AND d.active = 'A'

    UNION ALL

    SELECT 
      e.drug_equi_id AS item_id,
      e.equi_nm AS item_name,
      COALESCE(eg.equi_group_nm,'Lainnya') AS item_kategori,
      'ALAT' AS item_type
    FROM drug_equipment de
    JOIN equipment e
      ON e.drug_equi_id = de.drug_equi_id
    LEFT JOIN equi_group eg
      ON eg.equi_group_id = e.equi_group_id
    WHERE de.drug_equi_type = 'E'
      AND e.active = 'A'

    ORDER BY item_name ASC
  `);

  return rows;
}

/* ======================================================
 * 🟦 A2. MIRROR DATA (EDITABEL – DB REBORN)
 * Digunakan OLEH: MirrorController
 * ====================================================== */
async function getDataMirrorByTanggal(start, end, typeTglFilter) {
  const dateFieldMap = {
    tgl_po: "po.po_dt",
    tgl_invoice: "po.invoice_dt",
    tgl_jatuh_tempo: "po.invoice_due_dt",
    tgl_inv_datang: "po.invoice_received_dt",
    tgl_konsolidasi: "po.invoice_consolidated_dt",
    tgl_pengajuan: "po.invoice_submitted_dt",
    tgl_terima: "po.invoice_accepted_dt",
    tgl_verifikasi: "po.invoice_verified_dt",
    tgl_bayar: "po.invoice_paid_dt",
  };

  const field = dateFieldMap[typeTglFilter] || "po.po_dt";

  const sql = `
    SELECT 
      po.*,
      d.id AS item_id,
      d.drug_equi_id,
      d.drug_nm,
      d.qty, d.price, d.tax, d.discount,
      d.nettoprice, d.subtotal,
      d.nominal_ajukan, d.nominal_bayar,
      d.status_validasi AS item_status_validasi,
      d.status_pembayaran AS item_status_pembayaran,
      d.is_checked,
      d.jenis_item,
      d.jenis_pengadaan
    FROM mobay_mirror_po po
    LEFT JOIN mobay_mirror_po_dtl d ON d.mirror_po_id = po.id
    WHERE ${field} BETWEEN ? AND ?
    AND status_pengolahan in ('Konsolidasi', 'Proses Pengantaran','Proses Verifikasi','Proses Revisi','Proses Pembayaran')
    ORDER BY po.po_acce_id, d.id
  `;

  const [rows] = await db.promise().query(sql, [
    `${start} 00:00:00`,
    `${end} 23:59:59`,
  ]);

  return rows;
}

/* ======================================================
 * 🟦 A2b. MIRROR DATA (PENGANTARAN DATA)
 * Digunakan OLEH: MirrorController PENGAJUAN
 * ====================================================== */
async function getDataMirrorPengajuanByTanggal(start, end, typeTglFilter) {
  const dateFieldMap = {
    tgl_konsolidasi: "po.invoice_consolidated_dt",
  };

  const field = dateFieldMap[typeTglFilter] || "po.invoice_consolidated_dt";

  const sql = `
    SELECT 
      po.*,
      d.id AS item_id,
      d.drug_equi_id,
      d.drug_nm,
      d.qty, d.price, d.tax, d.discount,
      d.nettoprice, d.subtotal,
      d.nominal_ajukan, d.nominal_bayar,
      d.status_validasi AS item_status_validasi,
      d.status_pembayaran AS item_status_pembayaran,
      d.is_checked,
      d.jenis_item,
      d.jenis_pengadaan
    FROM mobay_mirror_po po
    LEFT JOIN mobay_mirror_po_dtl d ON d.mirror_po_id = po.id
    WHERE ${field} BETWEEN ? AND ?
      AND (
        po.status_pengolahan = 'Konsolidasi'
        OR po.status_pengolahan = 'Proses Revisi'
      )
    ORDER BY po.po_acce_id, d.id
  `;

  const [rows] = await db.promise().query(sql, [
    `${start} 00:00:00`,
    `${end} 23:59:59`,
  ]);

  return rows;
}

/* ======================================================
 * 🟦 A3. MIRROR DETAIL DATA (EDITABEL – DB REBORN)
 * Digunakan OLEH: MirrorController
 * ====================================================== */
async function getAllMirrorItemsMap() {
  const [rows] = await db.promise().query(`
    SELECT 
      h.po_acce_id,
      d.drug_equi_id,
      d.jenis_item,
      d.jenis_pengadaan
    FROM mobay_mirror_po_dtl d
    JOIN mobay_mirror_po h ON h.id = d.mirror_po_id
  `);

  const map = new Map();

  for (const r of rows) {
    const key = `${r.po_acce_id}__${r.drug_equi_id}`;
    map.set(key, r.jenis_item);
  }

  return map;
}

/* ======================================================
 * 🟨 B.a. MONITORING DATA
 * ====================================================== */
async function getMonitoringBySuratPengantar(start, end, typeTglFilter) {
  const dateFieldMap = {
    tgl_po: "po.po_dt",
    tgl_invoice: "po.invoice_dt",
    tgl_jatuh_tempo: "po.invoice_due_dt",
    tgl_inv_datang: "po.invoice_received_dt",
    tgl_konsolidasi: "po.invoice_consolidated_dt",
    tgl_pengajuan: "po.invoice_submitted_dt",
    tgl_terima: "po.invoice_accepted_dt",
    tgl_verifikasi: "po.invoice_verified_dt",
    tgl_bayar: "po.invoice_paid_dt",
  };

  const field = dateFieldMap[typeTglFilter] || "po.po_dt";

  const sql = `
    SELECT
      po.id,
      po.pengajuan_id,
      po.po_acce_id,
      po.invoice_no,
      po.prvdr_str,
      po.status_pengolahan,

      po.invoice_submitted_dt AS tgl_pengajuan,
      po.invoice_sent_dt AS tgl_pengiriman,

      po.total_tagihan,
      po.total_diajukan,
      po.total_bayar,

      d.drug_nm,
      d.qty,
      d.subtotal

    FROM mobay_mirror_po po
    LEFT JOIN mobay_mirror_po_dtl d 
      ON d.mirror_po_id = po.id

    WHERE ${field} BETWEEN ? AND ?
      AND po.pengajuan_id IS NOT NULL

    ORDER BY po.pengajuan_id DESC, po.po_acce_id
  `;

  const [rows] = await db.promise().query(sql, [
    `${start} 00:00:00`,
    `${end} 23:59:59`,
  ]);

  const suratMap = new Map();

  for (const r of rows) {
    // =========================
    // LEVEL 1: SURAT
    // =========================
    if (!suratMap.has(r.pengajuan_id)) {
      suratMap.set(r.pengajuan_id, {
        pengajuan_id: r.pengajuan_id,
        status_pengolahan: r.status_pengolahan,
        tgl_pengajuan: r.tgl_pengajuan,
        tgl_pengiriman: r.tgl_pengiriman,
        prvdr_str: r.prvdr_str,

        total_invoice: 0,
        total_tagihan: 0,
        total_diajukan: 0,
        total_bayar: 0,

        invoices: [],
      });
    }

    const surat = suratMap.get(r.pengajuan_id);

    // =========================
    // LEVEL 2: INVOICE
    // =========================
    let invoice = surat.invoices.find(
      (inv) => inv.po_acce_id === r.po_acce_id
    );

    if (!invoice) {
      invoice = {
        po_acce_id: r.po_acce_id,
        invoice_no: r.invoice_no,
        total_tagihan: 0,
        total_diajukan: r.total_diajukan || 0,
        total_bayar: r.total_bayar || 0,
        items: [],
      };

      surat.invoices.push(invoice);
      surat.total_invoice += 1;

      surat.total_diajukan += Number(r.total_diajukan || 0);
      surat.total_bayar += Number(r.total_bayar || 0);
    }

    // =========================
    // LEVEL 3: ITEM
    // =========================
    if (r.drug_nm) {
      invoice.items.push({
        drug_nm: r.drug_nm,
        qty: Number(r.qty || 0),
        subtotal: Number(r.subtotal || 0),
      });

      invoice.total_tagihan += Number(r.subtotal || 0);
    }

    // =========================
    // AKUMULASI SURAT
    // =========================
    surat.total_tagihan += Number(r.subtotal || 0);
  }

  return Array.from(suratMap.values());
}


/* ======================================================
 * 🟨 B. KONSOLIDASI → MIRROR ENTRY
 * Digunakan OLEH: SumberController
 * ====================================================== */

async function getMirroredPoMap() {
  const [rows] = await db.promise().query(`
    SELECT po_acce_id, status_pengolahan
    FROM mobay_mirror_po
  `);

  const map = new Map();

  for (const r of rows) {
    map.set(r.po_acce_id, r.status_pengolahan);
  }

  return map;
}

async function saveKonsolidasiHeader({
  po_acce_id,
  po_id,
  invoice_no,
  srvc_unit_id,
  srvc_unit_nm,
  prvdr_id,
  prvdr_str,
  prvdr_address,
  po_dt,
  invoice_dt,
  invoice_due_dt,
  invoice_received_dt,
  jenis_transaksi,

  total_tagihan,
  total_diajukan,

  conn
}) {
  if (!po_acce_id) {
    throw new Error("po_acce_id wajib diisi");
  }

  const executor = conn || db.promise();

  // cek apakah header mirror sudah ada
  const [exist] = await executor.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (exist.length === 0) {
    // ================= INSERT =================
    await executor.query(
      `
  INSERT INTO mobay_mirror_po (
    po_acce_id,
    po_id,
    invoice_no,
    srvc_unit_id,
    srvc_unit_nm,
    prvdr_id,
    prvdr_str,
    prvdr_address,
    po_dt,
    status_pengolahan,
    status_validasi,
    status_pembayaran,
    tahap,
    jenis_transaksi,
    invoice_dt,
    invoice_due_dt,
    invoice_received_dt,
    total_tagihan,
    total_diajukan,
    invoice_consolidated_dt
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?,
    'Konsolidasi',
    'Belum Validasi',
    'Belum Bayar',
    'KONSOLIDASI',
    ?, ?, ?, ?, ?, ?, NOW()
  )
`,
      [
        po_acce_id,
        po_id,
        invoice_no,
        srvc_unit_id,
        srvc_unit_nm,
        prvdr_id,
        prvdr_str,
        prvdr_address,
        po_dt,

        jenis_transaksi,
        invoice_dt,
        invoice_due_dt,
        invoice_received_dt,

        total_tagihan,
        total_diajukan
      ]
    );
  } else {
    // ================= UPDATE =================
    await executor.query(
      `
  UPDATE mobay_mirror_po
  SET
    invoice_no = ?,
    srvc_unit_id = ?,
    srvc_unit_nm = ?,
    prvdr_id = ?,
    prvdr_str = ?,
    prvdr_address = ?,
    po_dt = ?,
    invoice_dt = ?,
    invoice_due_dt = ?,
    invoice_received_dt = ?,

    status_pengolahan = 'Konsolidasi',
    tahap = 'KONSOLIDASI',

    total_tagihan = ?,
    total_diajukan = ?,

    invoice_consolidated_dt = NOW()
  WHERE po_acce_id = ?
`,
      [
        invoice_no,
        srvc_unit_id,
        srvc_unit_nm,
        prvdr_id,
        prvdr_str,
        prvdr_address,
        po_dt,
        invoice_dt,
        invoice_due_dt,
        invoice_received_dt,

        total_tagihan,
        total_diajukan,

        po_acce_id
      ]
    );
  }
}

async function saveKonsolidasiItems(po_acce_id, items, conn) {
  const executor = conn || db.promise();

  // ambil mirror_po_id
  const [header] = await executor.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (!header.length) {
    throw new Error("mobay_mirror_po belum ada untuk konsolidasi");
  }

  const mirror_po_id = header[0].id;

  for (const it of items) {
    const {
      drug_equi_id,
      item_name,
      qty,
      price,
      tax,
      discount,
      nettoprice,
      subtotal,
      jenis_item,
      is_checked,
      jenis_pengadaan,
    } = it;

    // UPSERT item
    await executor.query(`
      INSERT INTO mobay_mirror_po_dtl (
        mirror_po_id,
        drug_equi_id,
        drug_nm,
        qty,
        price,
        tax,
        discount,
        nettoprice,
        subtotal,
        jenis_item,
        jenis_pengadaan,
        is_checked,
        is_konsolidasi,
        status_validasi,
        status_pembayaran
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        1, 1,
        'Belum Validasi',
        'Belum Bayar'
      )
      ON DUPLICATE KEY UPDATE
        drug_nm = VALUES(drug_nm),
        qty = VALUES(qty),
        price = VALUES(price),
        tax = VALUES(tax),
        discount = VALUES(discount),
        nettoprice = VALUES(nettoprice),
        subtotal = VALUES(subtotal),
        jenis_item = VALUES(jenis_item),
        is_checked = VALUES(is_checked),
        jenis_pengadaan = VALUES(jenis_pengadaan)
    `, [
      mirror_po_id,
      drug_equi_id,
      item_name,
      qty,
      price,
      tax,
      discount,
      nettoprice,
      subtotal,
      jenis_item,
      jenis_pengadaan,
      is_checked
    ]);
  }
}

async function getKonsolidasiItems(po_acce_id, conn = db.promise()) {
  const [header] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (!header.length) return [];

  const [rows] = await conn.query(`
    SELECT *
    FROM mobay_mirror_po_dtl
    WHERE mirror_po_id = ?
      AND is_checked = 1
  `, [header[0].id]);

  return rows;
}

async function updateTahap(po_acce_id, tahap, conn = db.promise()) {
  await conn.query(
    `UPDATE mobay_mirror_po SET tahap = ? WHERE po_acce_id = ?`,
    [tahap, po_acce_id]
  );
}

async function recalcTotalTagihan(po_acce_id, conn) {
  const [[header]] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (!header) throw new Error("Header mirror tidak ditemukan");

  const [[row]] = await conn.query(
    `
      SELECT
        SUM(subtotal) AS total
      FROM mobay_mirror_po_dtl
      WHERE mirror_po_id = ?
    `,
    [header.id]
  );

  await conn.query(
    `
      UPDATE mobay_mirror_po
      SET total_tagihan = ?
      WHERE id = ?
    `,
    [row.total || 0, header.id]
  );
}

/* ======================================================
 * 🟩 C. MIRROR WORKFLOW (STATUS, VALIDASI, PEMBAYARAN)
 * Digunakan OLEH: MirrorController
 * ====================================================== */

async function updateMirrorStatus(
  po_acce_id,
  status_pengolahan,
  status_validasi,
  status_pembayaran,
  conn
) {
  const executor = conn || db.promise();

  const fields = [];
  const values = [];

  if (status_pengolahan !== undefined) {
    fields.push("status_pengolahan = ?");
    values.push(status_pengolahan);
  }
  if (status_validasi !== undefined) {
    fields.push("status_validasi = ?");
    values.push(status_validasi);
  }
  if (status_pembayaran !== undefined) {
    fields.push("status_pembayaran = ?");
    values.push(status_pembayaran);
  }

  if (!fields.length) {
    return { affectedRows: 0 };
  }

  const sql = `
    UPDATE mobay_mirror_po
    SET ${fields.join(", ")}
    WHERE po_acce_id = ?
  `;

  values.push(po_acce_id);

  const [result] = await executor.query(sql, values);
  return result; // INI KUNCI
}

async function updateCatatanVerifikasi(po_acce_id, catatan, conn) {
  const executor = conn || db.promise();
  await executor.query(
    `UPDATE mobay_mirror_po
     SET catatan_verifikasi = ?
     WHERE po_acce_id = ?`,
    [catatan, po_acce_id]
  );
}

async function updateItemPembayaran(po_acce_id, items, conn) {
  const [header] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (!header.length) {
    throw new Error("Header mirror tidak ditemukan");
  }

  const mirror_po_id = header[0].id;

  // 1️⃣ Reset semua item
  await conn.query(
    `
      UPDATE mobay_mirror_po_dtl
      SET is_checked = 0,
          nominal_ajukan = NULL
      WHERE mirror_po_id = ?
    `,
    [mirror_po_id]
  );

  // 2️⃣ Update item terpilih
  for (const it of items) {
    const nominal = Number(it.nominal_ajukan);

    if (Number.isNaN(nominal) || nominal < 0) {
      throw new Error("Nominal ajukan tidak valid");
    }

    await conn.query(
      `
        UPDATE mobay_mirror_po_dtl
        SET is_checked = 1,
            nominal_ajukan = ?
        WHERE mirror_po_id = ?
          AND drug_equi_id = ?
      `,
      [nominal, mirror_po_id, it.drug_equi_id]
    );
  }
}

async function updateItemNominalPembayaran(
  po_acce_id,
  drugId,
  status_pembayaran,
  nominal_bayar,
  conn
) {

  if (nominal_bayar === null) {
    // mode bayar total → skip item
    return;
  }
  const safeNominal = Number(nominal_bayar);

  if (!Number.isFinite(safeNominal)) {
    throw new Error("nominal_bayar tidak valid");
  }

  const [header] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (!header.length) {
    throw new Error("Mirror PO tidak ditemukan");
  }

  const [result] = await conn.query(
    `
    UPDATE mobay_mirror_po_dtl
    SET status_pembayaran = ?, nominal_bayar = ?
    WHERE mirror_po_id = ? AND drug_equi_id = ?
  `,
    [status_pembayaran, safeNominal, header[0].id, drugId]
  );

  return result;
}

async function recalcTotalDiajukan(po_acce_id, conn) {
  const [[header]] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  const [[row]] = await conn.query(
    `
      SELECT SUM(nominal_ajukan) AS total
      FROM mobay_mirror_po_dtl
      WHERE mirror_po_id = ?
        AND is_checked = 1
    `,
    [header.id]
  );

  await conn.query(
    `
      UPDATE mobay_mirror_po
      SET total_diajukan = ?
      WHERE id = ?
    `,
    [row.total || 0, header.id]
  );
}

async function recalcTotalBayar(po_acce_id, conn) {
  const [[header]] = await conn.query(
    `SELECT id, total_diajukan FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  const [[row]] = await conn.query(
    `
      SELECT SUM(nominal_bayar) AS total
      FROM mobay_mirror_po_dtl
      WHERE mirror_po_id = ?
    `,
    [header.id]
  );

  const totalBayar = row.total || 0;
  const selisih = Number(header.total_diajukan) - totalBayar;

  await conn.query(
    `
      UPDATE mobay_mirror_po
      SET total_bayar = ?, selisih_bayar = ?
      WHERE id = ?
    `,
    [totalBayar, selisih, header.id]
  );
}

async function updateTotalBayar(
  po_acce_id,
  total_bayar,
  selisih_bayar,
  tgl_bayar,
  catatan_bayar,
  conn
) {
  const executor = conn || db.promise();

  const [result] = await executor.query(
    `UPDATE mobay_mirror_po
     SET total_bayar = ?,
         selisih_bayar = ?,
         invoice_paid_dt = ?,
         catatan_bayar = ?
     WHERE po_acce_id = ?`,
    [total_bayar, selisih_bayar, tgl_bayar, catatan_bayar, po_acce_id]
  );

  return result;
}

async function resetItemsValidasi(po_acce_id) {
  await db.promise().query(
    `UPDATE mobay_mirror_po_dtl
     SET status_validasi = 'Belum Validasi'
     WHERE mirror_po_id = (SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?)`,
    [po_acce_id]
  );
}

async function resetItemsPembayaran(po_acce_id) {
  await db.promise().query(
    `UPDATE mobay_mirror_po_dtl
      SET status_pembayaran = 'Belum Bayar'
    WHERE mirror_po_id = (SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?)`,
    [po_acce_id]
  );
}

async function kunciInvoice(po_acce_id) {
  const [result] = await db
    .promise()
    .query(`UPDATE mobay_mirror_po SET kunci_invoice = 1 WHERE po_acce_id = ?`, [
      po_acce_id,
    ]);
  return result;
}

/* ======================================================
 * 🟥 D. PROVIDER SALDO & ADJUSTMENT
 * Digunakan OLEH: MirrorController
 * ====================================================== */

async function getProviderSaldo(prvdr_id, conn = db.promise()) {
  const [rows] = await conn.query(`
    SELECT COALESCE(SUM(
      CASE
        WHEN tipe = 'KREDIT' THEN nominal
        ELSE -nominal
      END
    ), 0) AS saldo
    FROM mobay_provider_saldo_tx
    WHERE prvdr_id = ?
  `, [prvdr_id]);

  return Number(rows[0].saldo);
}

async function insertProviderSaldoTx({
  prvdr_id,
  po_acce_id,
  tipe,
  nominal,
  keterangan,
  conn
}) {
  await conn.query(`
    INSERT INTO mobay_provider_saldo_tx
    (prvdr_id, ref_po_acce_id, tipe, nominal, keterangan)
    VALUES (?, ?, ?, ?, ?)
  `, [prvdr_id, po_acce_id, tipe, nominal, keterangan]);
}

async function applySaldoToInvoice(po_acce_id, prvdr_id, conn) {
  // 0️⃣ Guard: jangan apply dua kali
  const [exist] = await conn.query(`
    SELECT 1
    FROM mobay_mirror_po_dtl d
    JOIN mobay_mirror_po h ON h.id = d.mirror_po_id
    WHERE h.po_acce_id = ?
    AND d.is_adjustment = 1
    LIMIT 1
    FOR UPDATE
  `, [po_acce_id]);

  if (exist.length > 0) return;

  // 1️⃣ Hitung saldo dari ledger
  const saldo = await getProviderSaldo(prvdr_id, conn);
  if (saldo === 0) return;

  // 2️⃣ Ambil mirror_po_id
  const [header] = await conn.query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );

  if (header.length === 0) {
    throw new Error("mobay_mirror_po tidak ditemukan");
  }

  const mirror_po_id = header[0].id;

  // ======================
  // SALDO LEBIH BAYAR
  // ======================
  if (saldo > 0) {
    await conn.query(`
      INSERT INTO mobay_mirror_po_dtl
      (mirror_po_id, drug_nm, qty, price, subtotal, is_adjustment)
      VALUES (?, 'Pemakaian saldo sebelumnya', 1, ?, ?, 1)
    `, [mirror_po_id, -saldo, -saldo]);

    await insertProviderSaldoTx({
      prvdr_id,
      po_acce_id,
      tipe: "DEBIT",
      nominal: saldo,
      keterangan: "Pemakaian saldo",
      conn
    });
  }

  // ======================
  // SALDO KURANG BAYAR (HUTANG)
  // ======================
  if (saldo < 0) {
    const hutang = Math.abs(saldo);

    await conn.query(`
      INSERT INTO mobay_mirror_po_dtl
      (mirror_po_id, drug_nm, qty, price, subtotal, is_adjustment)
      VALUES (?, 'Penagihan saldo sebelumnya', 1, ?, ?, 1)
    `, [mirror_po_id, hutang, hutang]);

    await insertProviderSaldoTx({
      prvdr_id,
      po_acce_id,
      tipe: "KREDIT",
      nominal: hutang,
      keterangan: "Pelunasan hutang saldo",
      conn
    });
  }
}

/* ======================================================
 * 🟪 E. MIRROR READ (VIEW ONLY)
 * ====================================================== */

async function getInvoiceMirrorList() {
  const [rows] = await db.promise().query(`
    SELECT 
      id, po_id, invoice_no, po_acce_id,
      status_pengolahan, status_validasi, status_pembayaran,
      kunci_invoice, total_tagihan, total_diajukan, total_bayar, selisih_bayar,
      invoice_dt, invoice_received_dt, invoice_due_dt, invoice_consolidated_dt, invoice_submitted_dt, invoice_accepted_dt, invoice_verified_dt, invoice_paid_dt, 
      catatan_verifikasi, catatan_bayar
    FROM mobay_mirror_po
  `);

  const map = new Map();
  rows.forEach((r) => map.set(r.po_acce_id, r));
  return map;
}

async function getMirrorByPoAcce(po_acce_id, conn = db.promise()) {
  const [rows] = await conn.query(
    `SELECT * FROM mobay_mirror_po WHERE po_acce_id = ? LIMIT 1`,
    [po_acce_id]
  );
  return rows[0] || null;
}

async function getMirrorItemsByPoAcce(po_acce_id) {
  const [header] = await db.promise().query(
    `SELECT id FROM mobay_mirror_po WHERE po_acce_id = ?`,
    [po_acce_id]
  );
  if (!header.length) return [];

  const [rows] = await db.promise().query(
    `
      SELECT 
        drug_equi_id, drug_nm,
        qty, price, tax, discount, nettoprice, subtotal,
        nominal_ajukan, nominal_bayar,
        status_validasi, status_pembayaran,
        is_checked, jenis_item
      FROM mobay_mirror_po_dtl
      WHERE mirror_po_id = ?
    `,
    [header[0].id]
  );

  return rows;
}

/* ======================================================
 * 🟫 F. DASHBOARD & REPORT
 * ====================================================== */

async function getDashboardSummary(start, end, typeTglFilter) {
  const rows = await getDataSumberByTanggal(start, end, typeTglFilter);
  const mirrorMap = await getInvoiceMirrorList();

  const dateFieldMap = {
    tgl_po: "po_dt",
    tgl_invoice: "invoice_dt",
    tgl_jatuh_tempo: "invoice_due_dt",
    tgl_inv_datang: "invoice_received_dt",
    tgl_konsolidasi: "invoice_consolidated_dt",
    tgl_pengajuan: "invoice_submitted_dt",
    tgl_terima: "invoice_accepted_dt",
    tgl_verifikasi: "invoice_verified_dt",
    tgl_bayar: "invoice_paid_dt",
  };

  const field = dateFieldMap[typeTglFilter] || "po_dt";

  const labels = generateDateRange(start, end);

  const tagihan = labels.map(() => 0);
  const diajukan = labels.map(() => 0);
  const dibayar = labels.map(() => 0);
  const hutang = labels.map(() => 0);
  const sisaTagihan = labels.map(() => 0);
  const hutangDanSisaTagihan = labels.map(() => 0);

  // ==========================
  // GROUP PER INVOICE
  // ==========================
  const grouped = new Map();

  for (const r of rows) {
    if (!r.po_acce_id) continue;

    if (!grouped.has(r.po_acce_id)) {
      grouped.set(r.po_acce_id, {
        po_acce_id: r.po_acce_id,
        date: r[field],
        total_tagihan: 0,
      });
    }

    grouped.get(r.po_acce_id).total_tagihan += Number(r.subtotal ?? 0);
  }

  // ==========================
  // HITUNG PER HARI
  // ==========================
  for (const inv of grouped.values()) {
    if (!inv.date) continue;

    const dt = new Date(inv.date).toISOString().slice(0, 10);
    const index = labels.indexOf(dt);
    if (index === -1) continue;

    const mirror = mirrorMap.get(inv.po_acce_id);

    const total_tagihan =
      mirror?.total_tagihan != null
        ? Number(mirror.total_tagihan)
        : inv.total_tagihan;

    const total_diajukan = Number(mirror?.total_diajukan ?? 0);
    const total_bayar = Number(mirror?.total_bayar ?? 0);

    const total_hutang = Math.max(total_diajukan - total_bayar, 0);
    const total_sisa_tagihan = Math.max(total_tagihan - total_diajukan, 0);
    const hutang_dan_sisa_tagihan = total_hutang + total_sisa_tagihan;

    tagihan[index] += total_tagihan;
    diajukan[index] += total_diajukan;
    dibayar[index] += total_bayar;
    hutang[index] += total_hutang;
    sisaTagihan[index] += total_sisa_tagihan;
    hutangDanSisaTagihan[index] += hutang_dan_sisa_tagihan;
  }

  return {
    labels,
    tagihan,
    diajukan,
    dibayar,
    hutang,
    sisaTagihan,
    hutangDanSisaTagihan,

    totalTagihan: tagihan.reduce((s, v) => s + v, 0),
    totalDiajukan: diajukan.reduce((s, v) => s + v, 0),
    totalDibayar: dibayar.reduce((s, v) => s + v, 0),
    totalHutang: hutang.reduce((s, v) => s + v, 0),
    totalSisaTagihan: sisaTagihan.reduce((s, v) => s + v, 0),
    totalHutangDanSisaTagihan: hutangDanSisaTagihan.reduce((s, v) => s + v, 0),
  };
}


async function getTagihanGrouped(startDate, endDate, typeTglFilter) {
  const rows = await getDataSumberByTanggal(startDate, endDate, typeTglFilter);
  const mirrorMap = await getInvoiceMirrorList();

  const map = new Map();

  for (const r of rows) {
    const mirror = mirrorMap.get(r.po_acce_id) || null;

    if (!map.has(r.po_acce_id)) {
      map.set(r.po_acce_id, {
        po_acce_id: r.po_acce_id,
        invoice_no: r.invoice_no,
        prvdr_str: r.prvdr_str,
        srvc_unit_nm: r.srvc_unit_nm,

        invoice_due_dt:
          mirror?.invoice_due_dt ??
          r.invoice_due_dt ??
          null,

        invoice_dt:
          mirror?.invoice_dt ??
          r.invoice_dt ??
          null,

        total_tagihan: 0,
        total_diajukan: Number(mirror?.total_diajukan ?? 0),
        total_bayar: Number(mirror?.total_bayar ?? 0),

        mirror,
      });
    }

    const acc = map.get(r.po_acce_id);

    // =========================
    // HITUNG TAGIHAN DARI SUMBER
    // =========================
    acc.total_tagihan += Number(r.subtotal ?? 0);

    // Jika mirror override total_tagihan
    if (acc.mirror?.total_tagihan != null) {
      acc.total_tagihan = Number(acc.mirror.total_tagihan);
    }
  }

  // =========================
  // FINAL CALCULATION
  // =========================
  const result = [];

  for (const inv of map.values()) {
    const hutang = Math.max(inv.total_diajukan - inv.total_bayar, 0);
    const sisa_tagihan = Math.max(inv.total_tagihan - inv.total_diajukan, 0);

    result.push({
      ...inv,
      hutang,
      sisa_tagihan,
    });
  }

  return result;
}

async function ambilDataBySurat(surat_id) {

  const [rows] = await db.promise().query(`
    SELECT 
      po.id,
      po.invoice_no,
      po.prvdr_str,
      po.prvdr_address,
      po.total_diajukan,
      po.status_validasi,
      msp.no_surat,
      msp.no_verifikasi,
      msp.tanggal_surat
    FROM mobay_mirror_po po
    JOIN mobay_pengajuan msp 
      ON po.pengajuan_id = msp.id 
    WHERE po.pengajuan_id = ?
    ORDER BY po.id
  `, [surat_id]);

  if (!rows.length) {
    throw new Error("Data surat tidak ditemukan");
  }

  // =========================
  // DETAIL PER INVOICE
  // =========================
  const invoiceDetails = rows.map(r => {
    const total = Number(r.total_diajukan || 0);

    const kenaPajak = total > 2220000;
    const dpp = kenaPajak ? total / 1.11 : 0;
    const ppn = kenaPajak ? dpp * 0.11 : 0;
    const pph = kenaPajak ? dpp * 0.015 : 0;

    return {
      invoice_no: r.invoice_no,
      diajukan: total,
      dpp,
      ppn,
      pph,
      status_validasi: r.status_validasi || "Belum Validasi"
    };
  });

  // =========================
  // GRAND TOTAL
  // =========================
  const grandTotal = invoiceDetails.reduce((s, v) => s + v.diajukan, 0);
  const grandDPP = invoiceDetails.reduce((s, v) => s + v.dpp, 0);
  const grandPPN = invoiceDetails.reduce((s, v) => s + v.ppn, 0);
  const grandPPh = invoiceDetails.reduce((s, v) => s + v.pph, 0);

  return {
    no_surat: rows[0].no_surat,
    no_verifikasi: rows[0].no_verifikasi,
    tanggal_surat: rows[0].tanggal_surat,
    tujuan: "Bagian Keuangan",
    prvdr_str: rows[0].prvdr_str,
    prvdr_address: rows[0].prvdr_address,
    keterangan: "Pembayaran invoice sesuai terlampir",

    invoiceDetails,
    grandTotal,
    grandDPP,
    grandPPN,
    grandPPh,
  };
}

async function updateStatusKonsolidasi(po_acce_id, conn) {
  const executor = conn || db.promise();

  if (!po_acce_id) {
    throw new Error("po_acce_id wajib diisi");
  }

  const [res1] = await executor.query(
    `
    UPDATE mobay_mirror_po
    SET 
      status_pengolahan = 'Batal',
      tahap = 'Batal',
      invoice_consolidated_dt = NULL
    WHERE po_acce_id = ?
    `,
    [po_acce_id]
  );

  const [res2] = await executor.query(
    `
    UPDATE mobay_mirror_po_dtl d
    JOIN mobay_mirror_po h ON h.id = d.mirror_po_id
    SET 
      d.is_checked = 0,
      d.is_konsolidasi = 0
    WHERE h.po_acce_id = ?
    `,
    [po_acce_id]
  );

  return { success: true };
}

async function generateNoVerifikasi(conn) {

  const [rows] = await conn.query(`
    SELECT no_verifikasi
    FROM mobay_pengajuan
    WHERE no_verifikasi IS NOT NULL
      AND DATE_FORMAT(updated_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `);

  let lastNumber = 0;

  if (rows.length > 0) {
    const last = rows[0].no_verifikasi;

    const match = last.match(/\.(\d{4})\//);
    if (match) {
      lastNumber = parseInt(match[1], 10);
    }
  }

  const nextNumber = lastNumber + 1;
  const padded = String(nextNumber).padStart(4, "0");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const roman = [
    "", "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII"
  ];

  const bulanRomawi = roman[month];
  const kodePenunjang = "1";

  return `VER/${kodePenunjang}.${padded}/${bulanRomawi}/${year}`;
}

/* ======================================================
 * EXPORT
 * ====================================================== */
module.exports = {
  // SUMBER
  getDataSumberByTanggal,
  getProviderList,
  getDrugList,
  getMirroredPoMap,

  // MIRROR
  getDataMirrorByTanggal,
  getDataMirrorPengajuanByTanggal,
  getAllMirrorItemsMap,
  getMonitoringBySuratPengantar,

  // KONSOLIDASI
  saveKonsolidasiHeader,
  saveKonsolidasiItems,
  getKonsolidasiItems,
  updateTahap,
  recalcTotalTagihan,
  updateStatusKonsolidasi,

  // MIRROR WORKFLOW
  updateMirrorStatus,
  updateCatatanVerifikasi,
  updateItemPembayaran,
  updateItemNominalPembayaran,
  recalcTotalDiajukan,
  recalcTotalBayar,
  updateTotalBayar,
  resetItemsValidasi,
  resetItemsPembayaran,
  kunciInvoice,

  // SALDO
  getProviderSaldo,
  insertProviderSaldoTx,
  applySaldoToInvoice,

  // READ
  getInvoiceMirrorList,
  getMirrorByPoAcce,
  getMirrorItemsByPoAcce,

  // DASHBOARD
  getDashboardSummary,
  getTagihanGrouped,

  //SURAT PENGANTAR
  ambilDataBySurat,
  generateNoVerifikasi
};
