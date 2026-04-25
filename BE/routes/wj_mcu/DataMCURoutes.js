const express = require("express");
const router = express.Router();

const dataMCUController = require("../../controllers/wj_mcu/dataMCUController");

router.get("/hasil", dataMCUController.getHasilPemeriksaan);

module.exports = router;
