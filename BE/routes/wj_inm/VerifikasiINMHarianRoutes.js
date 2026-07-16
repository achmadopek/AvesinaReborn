const express = require("express");
const router = express.Router();

const verifikasiINMHarianController = require("../../controllers/wj_inm/verifikasiINMHarianController");

router.put("/verifikasi", verifikasiINMHarianController.verifikasiHarian);
router.get("/ruangan", verifikasiINMHarianController.getRuanganByInstalasi);

module.exports = router;
