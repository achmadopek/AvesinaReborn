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
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
        cb(null, true);
    } else {
        cb(new Error("File harus berupa gambar (jpg/png/webp)"));
    }
};

// ==========================
// MULTER INIT
// ==========================
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter
});

// ==========================
// EXPORT (PENTING)
// ==========================
module.exports = upload.fields([
    { name: "foto1", maxCount: 1 },
    { name: "foto2", maxCount: 1 }
]);