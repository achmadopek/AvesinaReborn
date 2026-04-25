// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const dashboardTHPController = require('../../controllers/wj_thp/dashboardTHPController');
router.get('/', dashboardTHPController.getTHPUtama);
router.get('/all', dashboardTHPController.getAllTHP);
router.get('/cart', dashboardTHPController.getDataCart);
router.get('/top', dashboardTHPController.getTopTHP);
router.get('/bottom', dashboardTHPController.getBottomTHP);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;