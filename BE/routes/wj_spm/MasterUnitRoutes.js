// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master Pegawai
const spmMasterUnitController = require('../../controllers/wj_spm/masterUnitController');

// ============================
// ROUTE UNTUK DATA UNIT
// ============================

// Mendapatkan data pegawai by LIKE name
router.get('/', spmMasterUnitController.getData);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;
