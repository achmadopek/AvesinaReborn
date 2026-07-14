const express = require("express");
const router = express.Router();

const controller = require("../../controllers/wj_mobay/monitoringPembelianController");

router.post("/", controller.getData);
router.get("/:id", controller.getDetail);

module.exports = router;
