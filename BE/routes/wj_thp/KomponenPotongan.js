// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const komponenPotonganController = require('../../controllers/wj_thp/komponenPotonganController');


// ============================
// ROUTE UNTUK DATA komponen
// ============================

// Mendapatkan seluruh data komponen (dengan pagination di controller)
router.get('/', komponenPotonganController.getData);

// Mendapatkan seluruh data komponen (tanpa pagination di controller)
router.get("/all", komponenPotonganController.getAllKomponenPotongan);

// Menambahkan data komponen baru
router.post('/', komponenPotonganController.createKomponen);

// Mendapatkan detail komponen berdasarkan ID
router.get('/:id', komponenPotonganController.getKomponenById);

// Mengupdate data komponen berdasarkan ID
router.put('/:id', komponenPotonganController.updateKomponen);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;
