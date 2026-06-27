const express = require("express");
const router = express.Router();

const controller = require("../../controllers/wj_supervisi/DireksiPlanController");

router.get("/data/:direksi_issue_id", controller.getData);

router.get("/detail/:direksi_plan_id", controller.getDetail);

router.post("/save", controller.save);

router.delete("/delete/:direksi_plan_id", controller.deleteData);

module.exports = router;
