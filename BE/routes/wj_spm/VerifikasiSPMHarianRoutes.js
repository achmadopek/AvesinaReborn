const express = require("express");
const router = express.Router();

const verifikasiSPMHarianController = require("../../controllers/wj_spm/verifikasiSPMHarianController");

router.put("/verifikasi", verifikasiSPMHarianController.verifikasiHarian);
router.get("/ruangan", verifikasiSPMHarianController.getRuanganByInstalasi);

module.exports = router;
