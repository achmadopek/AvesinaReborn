// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master komponen
const komponenPenghasilanController = require('../../controllers/wj_thp/komponenPenghasilanController');


// ============================
// ROUTE UNTUK DATA komponen
// ============================

// Mendapatkan seluruh data komponen (dengan pagination di controller)
router.get('/', komponenPenghasilanController.getData);

// Mendapatkan seluruh data komponen (tanpa pagination di controller)
router.get("/all", komponenPenghasilanController.getAllKomponenPenghasilan);

// Mendapatkan seluruh data komponen yg jenis - kegiatan
router.get('/jenis', komponenPenghasilanController.getDataByJenis);

// Menambahkan data komponen baru
router.post('/', komponenPenghasilanController.createKomponen);

// Mendapatkan detail komponen berdasarkan ID
router.get('/:id', komponenPenghasilanController.getKomponenById);

// Mengupdate data komponen berdasarkan ID
router.put('/:id', komponenPenghasilanController.updateKomponen);

// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;
