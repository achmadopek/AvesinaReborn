// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const laporanTHPController = require('../../controllers/wj_thp/laporanTHPController');

router.get('/rekap', laporanTHPController.generateRekapTHP);
router.get('/rinci', laporanTHPController.generateRinciTHP);
router.get('/group', laporanTHPController.getGroup);
router.get('/unit', laporanTHPController.getUnitByGroup);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;