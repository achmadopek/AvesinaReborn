// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master Pegawai
const masterAnjunganController = require('../../controllers/wj_mibers/masterAnjunganController');

// ============================
// ROUTE UNTUK DATA PEGAWAI
// ============================

// Mendapatkan data antrian by seacrh
router.get('/', masterAnjunganController.getData);

// Mendapatkan data poli dari service_unit
router.get('/poli', masterAnjunganController.getDataPoli);





// Menambahkan data pegawai baru
router.post('/', masterAnjunganController.createPegawai);

// Mendapatkan detail pegawai berdasarkan ID
router.get('/:id', masterAnjunganController.getPegawaiById);

// Mengupdate data pegawai berdasarkan ID
router.put('/:id', masterAnjunganController.updatePegawai);



// Ekspor router agar bisa digunakan di file utama (biasanya `app.js`)
module.exports = router;
