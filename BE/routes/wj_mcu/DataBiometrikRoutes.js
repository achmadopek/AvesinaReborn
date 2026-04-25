const express = require("express");
const router = express.Router();

const dataBiometrikController = require("../../controllers/wj_mcu/dataBiometrikController");

const uploadMiddleware = require("../../middleware/uploadMiddleware");

router.get("/peserta", dataBiometrikController.getPasienBiometrik);
router.post("/save", uploadMiddleware, dataBiometrikController.saveBiometrik);

module.exports = router;
