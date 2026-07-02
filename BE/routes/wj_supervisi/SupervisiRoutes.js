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

// KEBUTUHAN DETAIL
router.post(
  "/kendala/kebutuhan-detail/save",
  supervisiController.saveKebutuhanDetail,
);
router.delete(
  "/kendala/kebutuhan-detail/:detail_id",
  supervisiController.deleteKebutuhanDetail,
);

// Di routes
// KENDALA DETAIL (save satu item)
router.post(
  "/kendala/kendala-detail/save",
  supervisiController.saveKendalaDetail,
);
router.delete(
  "/kendala/kendala-detail/:detail_id",
  supervisiController.deleteKendalaDetail,
);

// EKSEKUTIF DETAIL (save satu item)
router.post("/eksekutif/detail/save", supervisiController.saveEksekutifDetail);
router.delete(
  "/eksekutif/detail/:detail_id",
  supervisiController.deleteEksekutifDetail,
);

router.put("/status/:supervisi_id", supervisiController.changeStatus);

module.exports = router;
