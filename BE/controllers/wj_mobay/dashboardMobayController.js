// dashboardMobayController.js
const db = require("../../db/connection-lokal");
const db2 = require("../../db/connection-avesina");

const { getDashboardSummary, getTagihanGrouped } = require("./mirrorPoService");

const cleanNumber = (val) => {
  if (!val) return 0;

  // Buang semua karakter kecuali digit dan titik
  const cleaned = String(val).replace(/[^\d.]/g, "");

  // Jika lebih dari satu titik → ambil titik terakhir
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    const last = parts.pop(); // ambil bagian setelah titik terakhir
    return parseFloat(parts.join("") + "." + last) || 0;
  }

  return parseFloat(cleaned) || 0;
};

/**
 * ============================
 * 1. DATA GRAFIK (PO, LUNAS, HUTANG)
 * ============================
 */
exports.getGrafikDashboard = async (req, res) => {
  try {
    const { start, end, typeTglFilter } = req.query;

    const result = await getDashboardSummary(
      start,
      end,
      typeTglFilter || "tgl_po",
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
};

/**
 * ============================
 * 2. TAGIHAN JATUH TEMPO (DATA SUMBER + MIRROR)
 * ============================
 */
exports.getTagihanJatuhTempo = async (req, res) => {
  try {
    const { start, end } = req.query;

    const data = await getTagihanGrouped(start, end, "tgl_po");

    const now = new Date();

    // masih punya hutang
    const belumLunas = data.filter((r) => r.total_tagihan - r.total_bayar > 0);

    const jatuhTempoTerdekat = belumLunas
      .filter((r) => r.invoice_due_dt && new Date(r.invoice_due_dt) >= now)
      .sort((a, b) => new Date(a.invoice_due_dt) - new Date(b.invoice_due_dt))
      .slice(0, 10);

    const jatuhTempoTerlewat = belumLunas
      .filter((r) => r.invoice_due_dt && new Date(r.invoice_due_dt) < now)
      .sort((a, b) => new Date(a.invoice_due_dt) - new Date(b.invoice_due_dt))
      .slice(0, 10);

    res.json({
      periode: { start, end },
      jatuhTempoTerdekat,
      jatuhTempoTerlewat,
    });
  } catch (err) {
    console.error("Error getTagihanJatuhTempo", err);
    res.status(500).json({ message: "Gagal load jatuh tempo" });
  }
};

/**
 * ============================
 * 3. TOP 5 TAGIHAN TERTINGGI
 * ============================
 */
exports.getTopTagihan = async (req, res) => {
  try {
    const { start, end, type } = req.query;

    const data = await getTagihanGrouped(start, end, "tgl_po");

    const sorted = data
      .sort((a, b) => b.total_tagihan - a.total_tagihan)
      .slice(0, 5);

    res.json(sorted);
  } catch (err) {
    console.error("Error getTopTagihan", err);
    res.status(500).json({ message: "Gagal load top tagihan" });
  }
};

/**
 * ============================
 * 4. BOTTOM 5 TAGIHAN TERKECIL
 * ============================
 */
exports.getBottomTagihan = async (req, res) => {
  try {
    const { start, end, type } = req.query;

    const data = await getTagihanGrouped(start, end, "tgl_po");

    const sorted = data
      .sort((a, b) => a.total_tagihan - b.total_tagihan)
      .slice(0, 5);

    res.json(sorted);
  } catch (err) {
    console.error("Error getBottomTagihan", err);
    res.status(500).json({ message: "Gagal load bottom tagihan" });
  }
};

/**
 * ============================
 * 5. SUMMARY UTANG PIUTANG
 * ============================
 */
exports.getUtangPiutangSummary = async (req, res) => {
  try {
    console.log("[getUtangPiutangSummary] Start fetching data...");

    // ==========================
    // 1. AMBIL TAGIHAN DARI AVESINA (LANGSUNG)
    //    Menggunakan koneksi db2 (connection-avesina)
    // ==========================
    const [avesinaTagihan] = await db2.promise().query(`
      SELECT
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
          COALESCE(SUM(
              (
                  ((pad.price * pad.qty) - COALESCE(pad.discount, 0))
                  +
                  (((pad.price * pad.qty) - COALESCE(pad.discount, 0)) * (COALESCE(pad.tax, 0) / 100))
              )
          ), 0) AS total_tagihan
      FROM po
      LEFT JOIN po_acce pa ON pa.po_id = po.po_id
      LEFT JOIN po_acce_dtl pad ON pad.po_acce_id = pa.po_acce_id
      LEFT JOIN drug_equipment de ON de.drug_equi_id = pad.drug_equi_id
      LEFT JOIN drug d ON d.drug_equi_id = de.drug_equi_id AND de.drug_equi_type = 'D'
      LEFT JOIN equipment e ON e.drug_equi_id = de.drug_equi_id AND de.drug_equi_type = 'E'
      LEFT JOIN equi_group eg ON eg.equi_group_id = e.equi_group_id
      LEFT JOIN service_unit su ON su.srvc_unit_id = po.srvc_unit_id
      LEFT JOIN provider p ON p.prvdr_id = po.prvdr_id
      WHERE pa.appr_sts = 'A'
        AND COALESCE(eg.equi_group_id, 0) <> 2  -- exclude Reagen
        AND pa.invoice_no IS NOT NULL
      GROUP BY jenis_item
      ORDER BY jenis_item
    `);

    console.log(
      "[getUtangPiutangSummary] AVESINA tagihan found:",
      avesinaTagihan.length,
    );

    // ==========================
    // 2. AMBIL PEMBAYARAN DARI MOBAY
    //    (total_bayar yang sudah dibayarkan)
    // ==========================
    const [mobayPembayaran] = await db.promise().query(`
      SELECT
          COALESCE(d.jenis_item, 'Lainnya') AS kategori,
          COALESCE(SUM(h.total_bayar), 0) AS total_bayar
      FROM mobay_mirror_po h
      LEFT JOIN mobay_mirror_po_dtl d 
          ON d.mirror_po_id = h.id
      WHERE h.status_pengolahan <> 'Batal'
        AND h.total_bayar > 0
      GROUP BY d.jenis_item
      ORDER BY d.jenis_item
    `);

    console.log(
      "[getUtangPiutangSummary] MOBAY pembayaran found:",
      mobayPembayaran.length,
    );

    // ==========================
    // 3. BUAT MAP UNTUK MUDAH DIGABUNG
    // ==========================
    const tagihanMap = new Map();

    // 3a. Masukkan data tagihan dari AVESINA
    avesinaTagihan.forEach((row) => {
      const kategori = row.jenis_item || "Lainnya";
      tagihanMap.set(kategori, {
        kategori: kategori,
        diajukan: Number(row.total_tagihan) || 0,
        dibayar: 0,
      });
    });

    // 3b. Masukkan data pembayaran dari MOBAY
    mobayPembayaran.forEach((row) => {
      const kategori = row.kategori || "Lainnya";
      if (tagihanMap.has(kategori)) {
        tagihanMap.get(kategori).dibayar = Number(row.total_bayar) || 0;
      } else {
        // Jika ada pembayaran tapi tidak ada tagihan (kemungkinan data tidak sync)
        tagihanMap.set(kategori, {
          kategori: kategori,
          diajukan: 0,
          dibayar: Number(row.total_bayar) || 0,
        });
      }
    });

    // ==========================
    // 4. AMBIL SEMUA KATEGORI BARANG UNTUK PEMBELIAN LANGSUNG
    // ==========================
    const [allCategories] = await db.promise().query(`
      SELECT 
        id,
        kode,
        nama
      FROM mobay_kategori_barang
      WHERE aktif = 'Y'
      ORDER BY nama ASC
    `);

    console.log(
      "[getUtangPiutangSummary] Categories found:",
      allCategories.length,
    );

    // ==========================
    // 5. AMBIL DATA PEMBELIAN LANGSUNG (termasuk DRAFT)
    // ==========================
    const [langsungData] = await db.promise().query(`
      SELECT
          b.kategori_id,
          kb.nama AS kategori_nama,
          COALESCE(SUM(pd.subtotal), 0) AS total_nilai
      FROM mobay_pembelian_detail pd
      INNER JOIN mobay_pembelian p
          ON p.id = pd.pembelian_id
      INNER JOIN mobay_barang b
          ON b.id = pd.barang_id
      INNER JOIN mobay_kategori_barang kb
          ON kb.id = b.kategori_id
      WHERE p.status IN ('DRAFT', 'FINAL')
      GROUP BY b.kategori_id, kb.nama
      ORDER BY kb.nama
    `);

    console.log(
      "[getUtangPiutangSummary] Langsung data found:",
      langsungData.length,
    );

    // ==========================
    // 6. BUAT MAP UNTUK PEMBELIAN LANGSUNG
    // ==========================
    const langsungMap = new Map();
    langsungData.forEach((row) => {
      langsungMap.set(row.kategori_id, {
        kategori: row.kategori_nama,
        total: Number(row.total_nilai) || 0,
      });
    });

    // ==========================
    // 7. GABUNGKAN SEMUA DATA
    // ==========================
    const detail = [];
    let totalDiajukan = 0;
    let totalDibayar = 0;
    let totalSaldo = 0;

    // 7a. Data dari AVESINA + MOBAY
    if (tagihanMap.size > 0) {
      for (const [kategori, data] of tagihanMap) {
        const diajukan = data.diajukan;
        const dibayar = data.dibayar;
        const saldo = diajukan - dibayar;

        detail.push({
          sumber: "AVESINA",
          kategori: kategori,
          diajukan: diajukan,
          dibayar: dibayar,
          saldo: saldo,
        });

        totalDiajukan += diajukan;
        totalDibayar += dibayar;
        totalSaldo += saldo;
      }
    } else {
      // Jika tidak ada data dari AVESINA
      detail.push({
        sumber: "AVESINA",
        kategori: "Belum ada tagihan",
        diajukan: 0,
        dibayar: 0,
        saldo: 0,
      });
    }

    // 7b. Data dari Pembelian Langsung - SEMUA KATEGORI
    if (allCategories.length > 0) {
      // Tambahkan separator jika ada data
      if (detail.length > 0 && detail[0].sumber === "AVESINA") {
        // Tidak perlu separator, langsung tambahkan
      }

      allCategories.forEach((kategori) => {
        const data = langsungMap.get(kategori.id) || { total: 0 };
        const diajukan = data.total || 0;
        const dibayar = 0;
        const saldo = diajukan;

        detail.push({
          sumber: "PEMBELIAN LANGSUNG",
          kategori: kategori.nama,
          diajukan: diajukan,
          dibayar: dibayar,
          saldo: saldo,
        });

        totalDiajukan += diajukan;
        totalSaldo += saldo;
      });
    }

    // ==========================
    // 8. URUTKAN DATA
    // ==========================
    detail.sort((a, b) => {
      // AVESINA di atas, PEMBELIAN LANGSUNG di bawah
      if (a.sumber === "AVESINA" && b.sumber === "PEMBELIAN LANGSUNG")
        return -1;
      if (a.sumber === "PEMBELIAN LANGSUNG" && b.sumber === "AVESINA") return 1;
      // Urutkan berdasarkan kategori
      return a.kategori.localeCompare(b.kategori);
    });

    const response = {
      detail,
      total: {
        diajukan: totalDiajukan,
        dibayar: totalDibayar,
        saldo: totalSaldo,
      },
    };

    console.log("[getUtangPiutangSummary] Response sent successfully");
    res.json(response);
  } catch (err) {
    console.error("[getUtangPiutangSummary] Error:", err);
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      detail: [],
      total: { diajukan: 0, dibayar: 0, saldo: 0 },
    });
  }
};
