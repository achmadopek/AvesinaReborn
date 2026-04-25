// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const monitoringTHPController = require('../../controllers/wj_mibers/monitoringTHPController');

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

// Mendapatkan data antrian by search
router.get('/', monitoringTHPController.getMonitoringTHP);

// Export data ke Excel
router.get("/export", monitoringTHPController.exportMonitoringTHP);

module.exports = router;
