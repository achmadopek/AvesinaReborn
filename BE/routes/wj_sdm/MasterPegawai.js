// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master Pegawai
const masterPegawaiController = require('../../controllers/wj_sdm/masterPegawaiController');


// ============================
// ROUTE UNTUK DATA PEGAWAI
// ============================

// Mendapatkan seluruh data pegawai (dengan pagination di controller)
router.get('/pegawai-search', masterPegawaiController.getPegawaiSearch);

// Mendapatkan data pegawai by LIKE name
router.get('/', masterPegawaiController.getData);

// Cek apakah NIK sudah ada (validasi unik)
router.get('/check-nik/:nik', masterPegawaiController.checkNikExists);

// Menambahkan data pegawai baru
router.post('/', masterPegawaiController.createPegawai);

// Mendapatkan detail pegawai berdasarkan ID
router.get('/:id', masterPegawaiController.getPegawaiById);

// Mengupdate data pegawai berdasarkan ID
router.put('/:id', masterPegawaiController.updatePegawai);

// Verifikasi data pegawai berdasarkan ID
router.patch('/verify/:id', masterPegawaiController.verifyPegawai);

// Validasi data pegawai berdasarkan ID
router.patch('/validity/:id', masterPegawaiController.validityPegawai);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;
