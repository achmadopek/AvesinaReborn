const express = require("express");
const router = express.Router();

const dashboardINMController = require("../../controllers/wj_inm/dashboardINMController");

//Rekap indikator
router.get("/rekap_indikator", dashboardINMController.getRekapIndikator);

module.exports = router;
