// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const penghasilanPegawaiController = require('../../controllers/wj_thp/penghasilanPegawaiController');

router.get('/generate', penghasilanPegawaiController.generatePenghasilanPegawai);
router.post('/save-generated', penghasilanPegawaiController.saveGenerated);
router.post('/endroll', penghasilanPegawaiController.endrollPenghasilan);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;