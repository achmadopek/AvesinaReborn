const express = require('express');
const router = express.Router();
const presensiPegawaiController = require('../../controllers/wj_sdm/presensiPegawaiController');

// -- Kegiatan --
router.get('/', presensiPegawaiController.getPresensi);
router.get('/history', presensiPegawaiController.getHistoryPresensi);
router.get('/:id', presensiPegawaiController.getPresensiById);
router.post('/', presensiPegawaiController.createPresensi);
router.put('/:id', presensiPegawaiController.updatePresensi);
router.patch('/verify/:id', presensiPegawaiController.verifyPresensi);
router.patch('/validity/:id', presensiPegawaiController.validatePresensi);

module.exports = router;
