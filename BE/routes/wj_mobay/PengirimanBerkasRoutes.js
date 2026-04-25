const express = require("express");
const router = express.Router();

PengirimanBerkasController = require("../../controllers/wj_mobay/pengirimanBerkasController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", PengirimanBerkasController.getDataPengajuan);             // tampilkan data sumber + status mirror
router.post("/create", PengirimanBerkasController.createPengiriman); // antarkan Pengajuan (update status mirror)
router.post("/hapus-konsolidasi", PengirimanBerkasController.hapusKonsolidasi);

module.exports = router;
