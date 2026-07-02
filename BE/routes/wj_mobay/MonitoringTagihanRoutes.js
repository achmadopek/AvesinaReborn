const express = require("express");
const router = express.Router();

monitoringTagihanController = require("../../controllers/wj_mobay/monitoringTagihanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", monitoringTagihanController.getData); // tampilkan data sumber + status mirror
router.get("/summary", monitoringTagihanController.getSummary); // ringkasan utang/piutang
router.post("/cetak", monitoringTagihanController.cetakMonitoringPDF);

module.exports = router;
