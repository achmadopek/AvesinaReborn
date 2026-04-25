// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const monitoringIcareController = require('../../controllers/wj_mibers/monitoringIcareController');

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

// Mendapatkan data antrian by search
router.get('/', monitoringIcareController.getData);
router.get('/summary', monitoringIcareController.getIcareDailySummary);

// Export data ke Excel
router.get("/export", monitoringIcareController.exportIcare);

module.exports = router;
