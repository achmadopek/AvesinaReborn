const express = require("express");
const router = express.Router();

const authMTHController = require("../controllers/authMTHController");

console.log("AuthRoutesMTH loaded");
console.log(authMTHController);

router.post("/menus-role", authMTHController.getMenusRole);

module.exports = router;