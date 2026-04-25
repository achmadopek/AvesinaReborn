const express = require("express");
const router = express.Router();

konsolidasiTagihanController = require("../../controllers/wj_mobay/konsolidasiTagihanController");

// ============================
// ROUTE UNTUK DATA MONITORING
// ============================

router.get("/data", konsolidasiTagihanController.getData);             // tampilkan data sumber + status mirror
router.get("/providerList", konsolidasiTagihanController.fetchProviderList);
router.get("/drugList", konsolidasiTagihanController.fetchDrugList);

router.post("/konsolidasi", konsolidasiTagihanController.konsolidasiInvoice); // ajukan pembayaran (insert ke mirror)

module.exports = router;
