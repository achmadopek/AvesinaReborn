const express = require("express");
const router = express.Router();

const dataController = require("../../controllers/wj_bugarr/monitoringBugarrController");
const uploadBugarr = require("../../middleware/uploadBugarrMiddleware");

router.get("/data", dataController.getData);
router.get("/detail/:laporan_id", dataController.getDetail);

// MASTER DATA
router.get("/elemen", dataController.getElemenBugarr);
router.get("/ruangan", dataController.getRuangan);

// SAVE
router.post("/save", uploadBugarr, dataController.saveBugarr);

module.exports = router;