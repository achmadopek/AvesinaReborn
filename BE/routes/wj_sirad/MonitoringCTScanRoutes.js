const express = require("express");
const router = express.Router();

const dataController = require("../../controllers/wj_sirad/monitoringCTScanController");

const uploadCTScan = require("../../middleware/uploadCTScanMiddleware");

// DATA
router.get("/data", dataController.getData);

// DETAIL
router.get(
  "/detail/:registry_id/:ct_scan_dtl_id",
  dataController.getDetail
);

// UPLOAD
router.post(
  "/upload",
  (req, res, next) => {

    uploadCTScan(req, res, function (err) {

      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      next();
    });

  },
  dataController.uploadCTScan
);

// SAVE HASIL
router.post(
  "/save-hasil",
  dataController.saveHasil
);

module.exports = router;