const express = require("express");
const router = express.Router();

//const verifyToken = require("../../middleware/verifyToken");

const pembelianBarangController = require("../../controllers/wj_mobay/pembelianBarangController");

router.post("/unitList", pembelianBarangController.fetchUnitList);

router.get("/barangList", pembelianBarangController.fetchBarangList);

router.get("/kategoriList", pembelianBarangController.fetchKategoriList);

router.get("/data", pembelianBarangController.getData);

router.get("/detail/:id", pembelianBarangController.getDetail);

router.post("/saveBarang", pembelianBarangController.saveBarang);

router.post("/save", pembelianBarangController.save);

router.post("/finalisasi", pembelianBarangController.finalisasi);

router.get("/:id", pembelianBarangController.getById);

module.exports = router;
