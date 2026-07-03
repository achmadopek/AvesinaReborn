// Import Express dan inisialisasi Router
const express = require("express");
const router = express.Router();

// Import controller untuk Monitoring
const monitoringAplicaresController = require("../../controllers/wj_mibers/monitoringAplicaresController");

// ============================
// ROUTE UNTUK DATA MONITORINg
// ============================

router.get("/", monitoringAplicaresController.getData);
router.get("/summary", monitoringAplicaresController.getSummary);

module.exports = router;
