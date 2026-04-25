const express = require("express");
const router = express.Router();

const dashboardSDMController = require("../../controllers/wj_sdm/dashboardSDMController");

router.get("/grafik", dashboardSDMController.getGrafikDashboard);
router.get("/alert", dashboardSDMController.getAlertAdministratif);
router.get("/top", dashboardSDMController.getTopRanking);
router.get("/bottom", dashboardSDMController.getBottomRanking);

module.exports = router;
