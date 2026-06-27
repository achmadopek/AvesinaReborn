const express = require("express");
const router = express.Router();

const controller = require("../../controllers/wj_supervisi/DireksiIssueController");

router.get("/data", controller.getData);

router.get("/detail/:direksi_issue_id", controller.getDetail);

router.post("/save", controller.save);

router.delete("/delete/:direksi_issue_id", controller.deleteData);

module.exports = router;
