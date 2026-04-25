// dashboardMobayController.js
const db = require("../../db/connection-lokal");

const {
  getDashboardSummary,
  getTagihanGrouped } = require("./mirrorPoService");

const cleanNumber = (val) => {
  if (!val) return 0;

  // Buang semua karakter kecuali digit dan titik
  const cleaned = String(val).replace(/[^\d.]/g, "");

  // Jika lebih dari satu titik → ambil titik terakhir
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    const last = parts.pop();     // ambil bagian setelah titik terakhir
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

    const result = await getDashboardSummary(start, end, typeTglFilter || "tgl_po");

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
    const belumLunas = data.filter(r => r.total_tagihan - r.total_bayar > 0);

    const jatuhTempoTerdekat = belumLunas
      .filter(r => r.invoice_due_dt && new Date(r.invoice_due_dt) >= now)
      .sort((a, b) => new Date(a.invoice_due_dt) - new Date(b.invoice_due_dt))
      .slice(0, 10);

    const jatuhTempoTerlewat = belumLunas
      .filter(r => r.invoice_due_dt && new Date(r.invoice_due_dt) < now)
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


