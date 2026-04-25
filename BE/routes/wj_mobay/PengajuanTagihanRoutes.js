const express = require("express");
const router = express.Router();

PengajuanTagihanController = require("../../controllers/wj_mobay/pengajuanTagihanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", PengajuanTagihanController.getData);             // tampilkan data sumber + status mirror
router.post("/create", PengajuanTagihanController.createSuratPengantar); // antarkan Pengajuan (update status mirror)
router.post("/hapus-konsolidasi", PengajuanTagihanController.hapusKonsolidasi);

module.exports = router;
