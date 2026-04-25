// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const monitoringDisplayController = require('../../controllers/wj_mibers/monitoringDisplayController');

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

// Mendapatkan data antrian by search
router.get('/summary', monitoringDisplayController.getDisplaySummary);
router.get('/monthly', monitoringDisplayController.getDisplayMonthlyRecap);

module.exports = router;
