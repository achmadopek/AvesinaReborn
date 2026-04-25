const express = require("express");
const router = express.Router();

const verifikasiINMHarianController = require("../../controllers/wj_inm/verifikasiINMHarianController");

router.put("/verifikasi", verifikasiINMHarianController.verifikasiHarian);

module.exports = router;
