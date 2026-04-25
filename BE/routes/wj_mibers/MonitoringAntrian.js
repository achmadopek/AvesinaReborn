// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const monitoringAntrianController = require('../../controllers/wj_mibers/monitoringAntrianController');

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

// Mendapatkan data antrian by search
router.get('/', monitoringAntrianController.getData);
router.get('/summary', monitoringAntrianController.getAntrianSummary);

// Export data ke Excel
//router.get("/export", monitoringAntrianController.exportAntrian);

module.exports = router;
