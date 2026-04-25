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

