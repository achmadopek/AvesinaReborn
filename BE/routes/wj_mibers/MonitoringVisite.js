const express = require("express");
const router = express.Router();

const monitoringVisiteController = require("../../controllers/wj_mibers/monitoringVisiteController");

router.get("/", monitoringVisiteController.getData);

module.exports = router;