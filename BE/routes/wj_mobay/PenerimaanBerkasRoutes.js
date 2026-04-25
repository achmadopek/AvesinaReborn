const express = require("express");
const router = express.Router();

penerimaanBerkasController = require("../../controllers/wj_mobay/penerimaanBerkasController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/surat-pengantar", penerimaanBerkasController.getSuratPengantarList); // tampilkan data sumber + status mirror
router.get("/surat-pengantar/:id", penerimaanBerkasController.getDetailSuratPengantar);             // tampilkan data sumber + status mirror

router.put("/terima", penerimaanBerkasController.terimaBerkas); // update status pengelolaan (Berkas Diterima)

module.exports = router;
