const dbL = require("../../db/connection-lokal");
const crypto = require("crypto");

const SECRET_KEY = process.env.FP_SECRET || "super_secret_fp_key";
const IV_LENGTH = 16; // 16 byte untuk AES block

// Generate 32-byte key dari secret apapun
function getKey() {
  return crypto
    .createHash("sha256")
    .update(SECRET_KEY)
    .digest(); // <-- selalu 32 byte
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    getKey(),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return iv.toString("base64") + ":" + encrypted;
}

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "base64");
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    getKey(),
    iv
  );

  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// GET data pasien MCU per tanggal
exports.getPasienBiometrik = async (req, res) => {
  const { tgl } = req.query;

  if (!tgl) {
    return res.status(400).json({
      success: false,
      message: "Tanggal Periksa wajib diisi",
    });
  }

  try {
    const [rows] = await dbL.promise().query(
      `
      SELECT
        p.nrm,
        p.nik,
        p.tgl_lahir,
        p.nama,
        p.umur,
        p.alamat,
        mm.mcu_id,
        mm.registry_id AS no_daftar,
        DATE_FORMAT(mm.tgl_periksa, '%Y-%m-%d %H:%i:%s') AS tgl_periksa,
        mm.status_mcu AS status_mcu,
        mm.status_mcu AS status_label,
        mm.finalized_at,
        mm.printed_at,
        fp.id AS fingerprint_id,
        fp.created_at AS fingerprint_created
      FROM mcu_mirror mm
      JOIN mcu_patients p ON p.id = mm.patient_id
      LEFT JOIN mcu_finger_biometrik fp ON fp.patient_id = p.id
      WHERE mm.tgl_periksa >= ?
        AND mm.tgl_periksa < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY mm.tgl_periksa ASC
      `,
      [tgl, tgl]
    );

    // bisa tambahkan field apakah pasien sudah ada fingerprint
    const data = rows.map(r => ({
      ...r,
      has_fingerprint: r.fingerprint_id ? true : false
    }));

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    console.error("getPasienBiometrik error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.saveBiometrik = async (req, res) => {
  const { no_daftar, fingerprint_image } = req.body;

  if (!no_daftar || !fingerprint_image) {
    return res.status(400).json({
      success: false,
      message: "Data biometrik tidak lengkap",
    });
  }

  const conn = await dbL.promise().getConnection();

  try {
    await conn.beginTransaction();

    // ==============================
    // 1️⃣ GET PATIENT
    // ==============================
    const [patient] = await conn.query(
      `SELECT patient_id, registry_id 
       FROM mcu_mirror 
       WHERE registry_id = ? 
       LIMIT 1`,
      [no_daftar]
    );

    if (!patient.length) {
      throw new Error("Pasien tidak ditemukan");
    }

    const patient_id = patient[0].patient_id;
    const registry_id = patient[0].registry_id;

    // ==============================
    // 2️⃣ SAVE FINGERPRINT
    // ==============================
    const encryptedTemplate = encrypt(fingerprint_image);

    const [existing] = await conn.query(
      `SELECT id FROM mcu_finger_biometrik WHERE patient_id = ?`,
      [patient_id]
    );

    if (existing.length) {
      await conn.query(
        `UPDATE mcu_finger_biometrik
         SET template = ?, taken_at = NOW(), updated_at = NOW()
         WHERE patient_id = ?`,
        [encryptedTemplate, patient_id]
      );
    } else {
      await conn.query(
        `INSERT INTO mcu_finger_biometrik
         (patient_id, registry_id, template, taken_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
        [patient_id, registry_id, encryptedTemplate]
      );
    }

    // ==============================
    // 3️⃣ SAVE FACE (FILE)
    // ==============================
    let facePath = null;

    if (req.file) {
      facePath = `/uploads/face/${req.file.filename}`;

      await conn.query(
        `INSERT INTO mcu_face_biometrik
         (patient_id, registry_id, face_image,
          device_name, taken_by,
          taken_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          patient_id,
          registry_id,
          facePath,
          req.body.device_name || "webcam_service",
          req.body.taken_by || "operator"
        ]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Fingerprint & Face berhasil disimpan"
    });

  } catch (err) {
    await conn.rollback();

    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    conn.release();
  }
};