// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const monitoringAplicaresController = require('../../controllers/wj_mibers/monitoringAplicaresController');

// ============================
// ROUTE UNTUK DATA MONITORINg
// ============================

// Mendapatkan data antrian by seacrh
router.get('/', monitoringAplicaresController.getDataBPJS);

module.exports = router;
