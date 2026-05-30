const express = require("express");
const router = express.Router();

const monitoringVisiteController = require("../../controllers/wj_mibers/monitoringVisiteController");

router.get(
  "/summary",
  monitoringVisiteController.getSummary
);

router.get(
  "/activity",
  monitoringVisiteController.getActivity
);

module.exports = router;