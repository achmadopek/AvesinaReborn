const express = require("express");
const router = express.Router();

const entriSPMHarianController = require("../../controllers/wj_spm/entriSPMHarianController");

router.get("/ruangan", entriSPMHarianController.getAllRuangan);

router.get("/instalasi", entriSPMHarianController.getAllInstalasi);
router.get("/bidang", entriSPMHarianController.getAllBidang);

router.get("/download/:id", entriSPMHarianController.downloadSPM);

router.get("/:unit_id", entriSPMHarianController.getIndikatorByUnit);

router.post("/entri", entriSPMHarianController.simpanHarianBulk);

module.exports = router;
