const express = require("express");
const router = express.Router();

const rekapPembayaranBahanMedisController = require("../../controllers/wj_mobay/rekapPembayaranBahanMedisController");

// ============================
// ROUTE UNTUK REKAP PEMBAYARAN
// ============================

router.get("/data", rekapPembayaranBahanMedisController.getRekapData);
router.get("/excel", rekapPembayaranBahanMedisController.exportRekapPembayaranBahanMedis);

module.exports = router;
