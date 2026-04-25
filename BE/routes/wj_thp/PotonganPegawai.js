// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const potonganPegawaiController = require('../../controllers/wj_thp/potonganPegawaiController');
router.get('/generate', potonganPegawaiController.generatePotonganPegawai);
router.post('/save-generated', potonganPegawaiController.saveGenerated);
router.post('/endroll', potonganPegawaiController.endrollPotongan);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;