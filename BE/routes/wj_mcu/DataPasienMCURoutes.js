const express = require("express");
const router = express.Router();

const dataPasienMCUController = require("../../controllers/wj_mcu/dataPasienMCUController");

router.get("/peserta", dataPasienMCUController.getPasienMCU);

module.exports = router;
