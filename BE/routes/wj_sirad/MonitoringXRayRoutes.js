const express = require("express");
const router = express.Router();

const dataController = require("../../controllers/wj_sirad/monitoringXRayController");
const uploadXRay = require("../../middleware/uploadXRayMiddleware");
const verifyToken = require("../../middleware/verifyToken");

//router.get("/data", verifyToken, dataController.getData);
router.get("/data", dataController.getData);
// Detail dengan 2 parameter
router.get("/detail/:registry_id/:x_ray_dtl_id", dataController.getDetail);

// SAVE
router.post("/upload", (req, res, next) => {
    uploadXRay(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, dataController.uploadXRay);

router.post("/save-hasil", dataController.saveHasil);

router.post("/proses-xray", dataController.requestXRay);

router.post("/send-imaging", dataController.sendImagingStudy);
router.post("/send-observation", dataController.sendObservation);
router.post("/send-diagnostic", dataController.sendDiagnostic);

module.exports = router;