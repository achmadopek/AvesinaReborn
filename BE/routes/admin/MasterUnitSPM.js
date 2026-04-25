const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/masterUnitSPMController');

router.get('/', controller.getData);

router.get('/unit-search', controller.getUnitSearch);
router.get('/bidang-search', controller.searchBidang);
router.get('/instalasi-search', controller.searchInstalasi);
router.get('/group-pelayanan-search', controller.searchGroupPelayanan);

router.post('/', controller.createUnit);

router.put('/:id', controller.updateUnit);

router.delete('/:id', controller.deleteUnit);

module.exports = router;