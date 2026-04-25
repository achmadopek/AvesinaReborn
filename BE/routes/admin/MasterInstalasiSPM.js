const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/masterInstalasiSPMController');

router.get('/', controller.getData);

router.get('/bidang-search', controller.searchBidang);
router.get('/pegawai-search', controller.searchPegawai);

router.post('/', controller.createInstalasi);

router.put('/:id', controller.updateInstalasi);

router.delete('/:id', controller.deleteInstalasi);

module.exports = router;