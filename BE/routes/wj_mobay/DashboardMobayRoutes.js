const express = require("express");
const router = express.Router();

const dashboardMobayController = require("../../controllers/wj_mobay/dashboardMobayController");

router.get("/grafik", dashboardMobayController.getGrafikDashboard);
router.get("/jatuh-tempo", dashboardMobayController.getTagihanJatuhTempo);
router.get("/top", dashboardMobayController.getTopTagihan);
router.get("/bottom", dashboardMobayController.getBottomTagihan);

router.get(
  "/summary-utang-piutang",
  dashboardMobayController.getUtangPiutangSummary,
);

module.exports = router;
