const express = require("express");
const router = express.Router();

//const verifyToken = require("../../middleware/verifyToken");

const pengadaanJasaController = require("../../controllers/wj_mobay/pengadaanJasaController");

router.post("/unitList", pengadaanJasaController.fetchUnitList);

router.get("/barangList", pengadaanJasaController.fetchBarangList);

router.get("/kategoriList", pengadaanJasaController.fetchKategoriList);

router.get("/detail/:id", pengadaanJasaController.getDetail);

router.post("/saveBarang", pengadaanJasaController.saveBarang);

router.post("/save", pengadaanJasaController.save);

router.post("/finalisasi", pengadaanJasaController.finalisasi);

router.get("/:id", pengadaanJasaController.getById);

module.exports = router;
