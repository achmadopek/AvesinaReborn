// Inisialisasi Express Router
const express = require('express');
const router = express.Router();

// Import controller Master Keuangan
const masterKeuanganController = require('../../controllers/wj_thp/masterKeuanganController');

// ============================
// ROUTES UNTUK DATA REKENING PEGAWAI
// ============================

// Ambil detail pegawai + rekening berdasarkan ID pegawai
router.get('/:id', masterKeuanganController.getPegawaiById);

// Tambah rekening baru untuk pegawai
router.post('/create-rekening', masterKeuanganController.createRekening);

// Update data rekening berdasarkan ID rekening
router.put('/update-rekening/:id', masterKeuanganController.updateRekening);

// Validasi data rekening berdasarkan ID
router.patch('/validity/:id', masterKeuanganController.validityRekening);

// Ekspor router agar digunakan di file utama (e.g. index.js atau app.js)
module.exports = router;
