// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const daftarPoliController = require('../../controllers/wj_mibers/daftarPoliController');

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

// Mendapatkan data antrian by search
router.get('/', daftarPoliController.getData);

module.exports = router;
