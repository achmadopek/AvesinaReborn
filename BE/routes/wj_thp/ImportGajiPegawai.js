// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const importGajiPegawaiController = require('../../controllers/wj_thp/importGajiPegawaiController');

// Mendapatkan seluruh data komponen (dengan pagination di controller)
router.get('/', importGajiPegawaiController.getData);
router.post('/save-imported', importGajiPegawaiController.saveImported);
router.post('/save-imported-non-asn', importGajiPegawaiController.saveImportedNonASN);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;