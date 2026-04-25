// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Monitoring
const antrianpasienController = require('../../controllers/wj_antrian/antrianPasienController');

// ============================
// ROUTE UNTUK DATA ANTRIAN
// ============================

// Mendapatkan data antrian by search
router.get('/', antrianpasienController.getData);

module.exports = router;
