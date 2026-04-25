const express = require("express");
const router = express.Router();

verifikasiPengajuanController = require("../../controllers/wj_mobay/verifikasiPengajuanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", verifikasiPengajuanController.getData);             // tampilkan data sumber + status mirror
router.get("/get-no-verifikasi", verifikasiPengajuanController.getNoVerifikasi);             // tampilkan data sumber + status mirror

router.put("/mulai-verifikasi", verifikasiPengajuanController.mulaiVerifikasi);
router.put("/validasi", verifikasiPengajuanController.validasiPembayaran); // validasi pembayaran (update status di mirror)
router.post("/cetak-verifikasi", verifikasiPengajuanController.cetakVerifikasi);

module.exports = router;
