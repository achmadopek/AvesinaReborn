const express = require("express");
const router = express.Router();

const dataController = require("../../controllers/wj_sirad/monitoringXRayController");

const uploadXRay = require("../../middleware/uploadXRayMiddleware");

// DATA
router.get("/data", dataController.getData);

// DETAIL
router.get("/detail/:registry_id/:x_ray_dtl_id", dataController.getDetail);

// REQUEST
router.post("/request", dataController.requestXRay);

// UPLOAD
router.post(
  "/upload",
  (req, res, next) => {
    uploadXRay(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      next();
    });
  },
  dataController.uploadXRay,
);

// SAVE HASIL
router.post("/save-hasil", dataController.saveHasil);

module.exports = router;
