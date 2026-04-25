const express = require("express");
const router = express.Router();

const dataINMController = require("../../controllers/wj_inm/dataINMController");

router.get("/hasil_inm", dataINMController.getINMHarianByUnit);
router.get("/rekap_bulanan", dataINMController.getRekapBulanan);

//Rekap role Bidang/Bagian
router.get("/rekap_ringkas", dataINMController.getRekapRingkas);

module.exports = router;
