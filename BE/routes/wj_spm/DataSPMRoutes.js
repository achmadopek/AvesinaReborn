const express = require("express");
const router = express.Router();

const dataSPMController = require("../../controllers/wj_spm/dataSPMController");

router.get("/hasil_spm", dataSPMController.getSPMHarianByUnit);
router.get("/rekap_bulanan", dataSPMController.getRekapBulanan);

//Rekap role Bidang/Bagian
router.get("/rekap_ringkas", dataSPMController.getRekapRingkas);

module.exports = router;
