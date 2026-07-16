const express = require("express");
const router = express.Router();

const entriINMHarianController = require("../../controllers/wj_inm/entriINMHarianController");

router.get("/ruangan", entriINMHarianController.getAllRuangan);

router.get("/instalasi", entriINMHarianController.getAllInstalasi);
router.get("/bidang", entriINMHarianController.getAllBidang);

router.get("/download/:id", entriINMHarianController.downloadINM);

router.get("/:unit_id", entriINMHarianController.getIndikatorByUnit);

router.post("/entri", entriINMHarianController.simpanHarianBulk);

module.exports = router;
