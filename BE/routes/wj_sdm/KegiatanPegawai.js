const express = require('express');
const router = express.Router();
const kegiatanPegawaiController = require('../../controllers/wj_sdm/kegiatanPegawaiController');

// -- Peserta / Pegawai --
router.get('/search-pegawai', kegiatanPegawaiController.searchPegawaiByName); // Live search peserta
router.post('/add-peserta', kegiatanPegawaiController.addPeserta);            // Tambah peserta ke daftar hadir
router.put('/update-peserta/:id', kegiatanPegawaiController.updatePeserta); // Update peserta
router.delete('/delete-peserta/:id', kegiatanPegawaiController.deletePeserta); // Hapus peserta

// -- Kegiatan --
router.get('/', kegiatanPegawaiController.getData);                   // Get semua kegiatan
router.get('/history', kegiatanPegawaiController.getHistoryKegiatan);
router.post('/', kegiatanPegawaiController.createKegiatan);          // Tambah kegiatan
router.get('/:id', kegiatanPegawaiController.getKegiatanById);       // Detail kegiatan
router.put('/:id', kegiatanPegawaiController.updateKegiatan);        // Update kegiatan
router.delete('/:id', kegiatanPegawaiController.deleteKegiatan);     // Hapus kegiatan
// Verifikasi data kegaitan dan sekaligus daftar hadir berdasarkan ID
router.patch('/verify/:id', kegiatanPegawaiController.verifyKegiatan);
router.patch('/validity/:id', kegiatanPegawaiController.validityKegiatan);

module.exports = router;
