const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================
// PATH UPLOAD
// ==========================
const uploadPath = path.join(__dirname, "../uploads/xray");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// ==========================
// STORAGE CONFIG
// ==========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            "xray_" +
            Date.now() +
            "_" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

// ==========================
// FILE FILTER (WAJIB BIAR AMAN)
// ==========================
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const isImage = /\.(jpg|jpeg|png|webp)$/.test(ext);
    const isDicom = ext === ".dcm";

    if (isImage || isDicom) {
        cb(null, true);
    } else {
        cb(new Error("File harus JPG/PNG atau DICOM (.dcm)"));
    }
};

// ==========================
// MULTER INIT
// ==========================
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB minimal
    },
    fileFilter
});

// ==========================
// EXPORT (PENTING)
// ==========================
module.exports = upload.fields([
    { name: "dicom", maxCount: 1 }, // DCM
    { name: "foto1", maxCount: 1 }, // optional legacy
    { name: "foto2", maxCount: 1 }
]);