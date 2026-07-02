const express = require("express");
const router = express.Router();

const dashboardSupervisiController = require("../../controllers/wj_supervisi/DashboardSupervisiController");

router.get("/grafik", dashboardSupervisiController.getHomeDashboard);

module.exports = router;
