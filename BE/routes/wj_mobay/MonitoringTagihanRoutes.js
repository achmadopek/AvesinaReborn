const express = require("express");
const router = express.Router();

monitoringTagihanController = require("../../controllers/wj_mobay/monitoringTagihanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", monitoringTagihanController.getData);             // tampilkan data sumber + status mirror

module.exports = router;
