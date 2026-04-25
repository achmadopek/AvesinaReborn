const express = require("express");
const router = express.Router();

monitoringSatuSehatController = require("../../controllers/wj_mibers/monitoringSatuSehatController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/", monitoringSatuSehatController.getData); // tampilkan data sumber + mirror

module.exports = router;
