const express = require("express");
const router = express.Router();

const controller = require("../../controllers/wj_terjang/TrackingPenunjangController");

router.get("/data", controller.getData);
router.post("/request", controller.requestPenunjang);
router.get("/summary", controller.getSummary);

module.exports = router;
