const express = require("express");
const router = express.Router();

const dashboardSPMController = require("../../controllers/wj_spm/dashboardSPMController");

//Rekap indikator
router.get("/rekap_indikator", dashboardSPMController.getRekapIndikator);

module.exports = router;
