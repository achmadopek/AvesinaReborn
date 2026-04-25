const express = require("express");
const router = express.Router();

const MCUMirrorController = require("../../controllers/wj_mcu/MCUMirrorController");

router.post("/mirror", MCUMirrorController.saveMCUMirror);
router.get("/cetak/:mcu_id", MCUMirrorController.getMirrorMCUById);
router.post("/mark/:mcu_id", MCUMirrorController.markPrintedMCU);

module.exports = router;
