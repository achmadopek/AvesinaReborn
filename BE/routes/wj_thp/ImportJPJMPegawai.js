// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const importJPJMPegawaiController = require('../../controllers/wj_thp/importJPJMPegawaiController');

// Mendapatkan seluruh data komponen (dengan pagination di controller)
router.get('/', importJPJMPegawaiController.getData);
router.post('/save-imported-jpjm', importJPJMPegawaiController.saveImportedJPJM);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;