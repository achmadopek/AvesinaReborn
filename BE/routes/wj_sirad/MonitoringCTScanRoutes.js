const express = require("express");
const router = express.Router();

const dataController = require("../../controllers/wj_sirad/monitoringCTScanController");
const uploadCTScan = require("../../middleware/uploadCTScanMiddleware");
const verifyToken = require("../../middleware/verifyToken");

//router.get("/data", verifyToken, dataController.getData);
router.get("/data", dataController.getData);
// Detail dengan 2 parameter
router.get("/detail/:registry_id/:ct_scan_dtl_id", dataController.getDetail);

// SAVE
router.post("/upload", (req, res, next) => {
    uploadCTScan(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, dataController.uploadCTScan);

router.post("/save-hasil", dataController.saveHasil); //disini sekaligus sendObservation

module.exports = router;