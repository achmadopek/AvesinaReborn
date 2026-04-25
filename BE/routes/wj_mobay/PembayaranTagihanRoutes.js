const express = require("express");
const router = express.Router();

pembayaranTagihanController = require("../../controllers/wj_mobay/pembayaranTagihanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", pembayaranTagihanController.getData);             // tampilkan data sumber + status mirror
router.put("/bayarBendel", pembayaranTagihanController.bayarBendel); // pembayaran per item (update status di mirror)

module.exports = router;
