const express = require("express");
const router = express.Router();

const prologWavaController = require("../../controllers/wava/prologWavaController");

router.get("/perkenalan-diri", prologWavaController.getPerkenalanDiri);

module.exports = router;
