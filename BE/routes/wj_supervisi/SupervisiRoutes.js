const express = require("express");
const router = express.Router();

const supervisiController = require("../../controllers/wj_supervisi/SupervisiController");

router.get("/data", supervisiController.getData);
router.get("/detail/:supervisi_id", supervisiController.getDetail);
router.get("/igd/:supervisi_id", supervisiController.getIgdDetail);

router.post("/save", supervisiController.save);
router.post("/igd/save", supervisiController.saveIgd);
router.post("/hd/save", supervisiController.saveHd);
router.post("/ibs/save", supervisiController.saveIbs);
router.post("/mutu/save", supervisiController.saveMutu);
router.post("/kendala/save", supervisiController.saveKendala);
router.post("/eksekutif/save", supervisiController.saveEksekutif);

router.put("/status/:supervisi_id", supervisiController.changeStatus);

module.exports = router;
