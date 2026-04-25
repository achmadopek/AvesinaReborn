const express = require('express');
const router = express.Router();
const mutasiPegawaiController = require('../../controllers/wj_sdm/mutasiPegawaiController');

// -- Kegiatan --
router.get('/', mutasiPegawaiController.getMutasi);
router.get('/history', mutasiPegawaiController.getHistoryMutasi);
router.get('/:id', mutasiPegawaiController.getMutasiById);
router.post('/', mutasiPegawaiController.createMutasi);
router.put('/:id', mutasiPegawaiController.updateMutasi);
router.patch('/verify/:id', mutasiPegawaiController.verifyMutasi);
router.patch('/validity/:id', mutasiPegawaiController.validateMutasi);

module.exports = router;
