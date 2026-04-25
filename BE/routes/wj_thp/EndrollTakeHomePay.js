// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const endrollTHPController = require('../../controllers/wj_thp/endrollTHPController');

router.get('/history', endrollTHPController.getHistoryTHP);
router.get('/detail', endrollTHPController.getDetailTHP);

router.get('/generate', endrollTHPController.generateTHP);
router.post('/save-generated', endrollTHPController.saveGenerated);
router.post('/endroll', endrollTHPController.endrollTHP);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;