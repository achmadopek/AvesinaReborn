const dbUtama = require("../../db/connection-avesina");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

// ======================================================
// HELPER
// ======================================================
const buildMap = (rows, keyFn) => {
  const map = new Map();

  for (const row of rows) {
    const key = keyFn(row);

    if (!map.has(key)) {
      map.set(key, row);
    }
  }

  return map;
};

// ======================================================
// GET DATA MONITORING
// ======================================================
exports.getData = async (req, res) => {

  try {

    const { employee_id, role, tgl } = req.query;

    let expert_id = null;
    if (role === "radiolog" && employee_id) {
      expert_id = employee_id; // langsung pake, nggak usah query lagi
    }

    // ==================================================
    // DATA UTAMA
    // ==================================================
    const [utama] =
      await dbUtama.promise().query(
        `
        SELECT
          r.registry_id,

          xrh.x_ray_id,
          xrd.x_ray_dtl_id,

          r.registry_dt,
          xrh.measured_dt,

          p.mr_code,
          p.patient_nm,

          xrh.physician AS pengirim_id,
          xrh.expert AS pemeriksa_id,

          e.employee_nm AS dr_pengirim,
          e2.employee_nm AS dr_pemeriksa,

          e.satusehat_ihs_number AS pengirim_ihs,
          e2.satusehat_ihs_number AS pemeriksa_ihs,

          ms.medical_service_name AS tindakan,

          xrd.photo_reading

        FROM registry r

        JOIN patient p
          ON p.mr_id = r.mr_id

        JOIN unit_visit uv
          ON uv.registry_id = r.registry_id

        JOIN x_ray_hdr xrh
          ON xrh.unit_visit_id = uv.unit_visit_id

        JOIN x_ray_dtl xrd
          ON xrd.x_ray_id = xrh.x_ray_id

        JOIN medical_service ms
          ON ms.medical_service_id = xrd.medical_service_id

        LEFT JOIN employee e
          ON e.employee_id = xrh.physician

        LEFT JOIN employee e2
          ON e2.employee_id = xrh.expert

        WHERE 1=1
          ${tgl ? "AND DATE(xrh.measured_dt) = ?" : ""}
          ${expert_id ? "AND xrh.expert = ?" : ""}

        ORDER BY
          xrh.measured_dt DESC,
          xrd.x_ray_dtl_id ASC
        `,
        [
          ...(tgl ? [tgl] : []),
          ...(expert_id ? [expert_id] : []),
        ]
      );

    if (utama.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // ==================================================
    // IDS
    // ==================================================
    const registryIds = [
      ...new Set(
        utama.map(
          (u) => u.registry_id
        )
      ),
    ];

    const registryDtlIds =
      utama.map((u) => [
        u.registry_id,
        u.x_ray_dtl_id,
      ]);

    // ==================================================
    // DATA LOKAL
    // ==================================================
    const [lokalRows] =
      await dbLokal.promise().query(
        `
        SELECT *
        FROM radar_xray
        WHERE (registry_id, x_ray_dtl_id) IN (?)
          AND is_active = 1
        `,
        [registryDtlIds]
      );

    const mapLokal = buildMap(
      lokalRows,
      (r) =>
        `${r.registry_id}-${r.x_ray_dtl_id}`
    );

    // ==================================================
    // MAPPING TINDAKAN
    // ==================================================
    const tindakanList = [
      ...new Set(
        utama
          .map((u) => u.tindakan)
          .filter(Boolean)
      ),
    ];

    let mapTindakan = {};

    // ==================================================
    // FINAL RESULT
    // ==================================================
    const result = utama.map((u) => {

      const key =
        `${u.registry_id}-${u.x_ray_dtl_id}`;

      const lokal =
        mapLokal.get(key);

      return {

        ...u,

        status:
          lokal?.status || "none",

        is_final: !!String(u.photo_reading || "").trim(),
        is_lokal: !!String(lokal?.hasil_bacaan || "").trim(),

        tindakan_mapping: [
          {
            nama: u.tindakan,

            snomed_code:
              mapTindakan[u.tindakan]
                ?.snomed_code || null,

            snomed_display:
              mapTindakan[u.tindakan]
                ?.snomed_display || null,

            loinc_code:
              mapTindakan[u.tindakan]
                ?.loinc_code || null,

            loinc_display:
              mapTindakan[u.tindakan]
                ?.loinc_display || null,
          },
        ],
      };

    });

    return res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    console.error(
      "GET DATA ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET DETAIL
// ======================================================
exports.getDetail = async (
  req,
  res
) => {

  try {

    const {
      registry_id,
      x_ray_dtl_id,
    } = req.params;

    if (
      !registry_id ||
      !x_ray_dtl_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "registry_id dan x_ray_dtl_id wajib diisi",
      });
    }

    // ==================================================
    // DATA UTAMA
    // ==================================================
    const [[utama]] =
      await dbUtama.promise().query(
        `
        SELECT
          r.registry_id,

          xrh.x_ray_id,
          xrd.x_ray_dtl_id,

          p.patient_nm,
          p.mr_code,

          xrh.measured_dt,

          ms.medical_service_name AS tindakan,

          xrd.photo_reading,

          xrh.physician AS pengirim_id,
          xrh.expert AS pemeriksa_id,

          e.employee_nm AS pengirim,
          e2.employee_nm AS radiolog,

          e.satusehat_ihs_number AS pengirim_ihs,
          e2.satusehat_ihs_number AS pemeriksa_ihs,

          a.anamnesa AS keluhan_anamnesa

        FROM registry r

        JOIN patient p
          ON p.mr_id = r.mr_id

        JOIN unit_visit uv
          ON uv.registry_id = r.registry_id

        JOIN x_ray_hdr xrh
          ON xrh.unit_visit_id = uv.unit_visit_id

        JOIN x_ray_dtl xrd
          ON xrd.x_ray_id = xrh.x_ray_id

        JOIN medical_service ms
          ON ms.medical_service_id = xrd.medical_service_id

        LEFT JOIN visite v
          ON v.unit_visit_id = uv.unit_visit_id

        LEFT JOIN anamnesis a
          ON a.visite_id = v.visite_id

        LEFT JOIN employee e
          ON e.employee_id = xrh.physician

        LEFT JOIN employee e2
          ON e2.employee_id = xrh.expert

        WHERE r.registry_id = ?
          AND xrd.x_ray_dtl_id = ?

        LIMIT 1
        `,
        [
          registry_id,
          x_ray_dtl_id,
        ]
      );

    if (!utama) {
      return res.status(404).json({
        success: false,
        message:
          "Data X-Ray tidak ditemukan",
      });
    }

    // ==================================================
    // DATA LOKAL
    // ==================================================
    const [[lokal]] =
      await dbLokal.promise().query(
        `
        SELECT *
        FROM radar_xray
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [
          registry_id,
          x_ray_dtl_id,
        ]
      );

    // ==================================================
    // RESPONSE
    // ==================================================
    return res.json({

      success: true,

      data: {

        ...utama,

        dicom_path:
          lokal?.dicom_path
            ? `/uploads/xray/${lokal.dicom_path}`
            : null,

        foto1:
          lokal?.foto1
            ? `/uploads/xray/${lokal.foto1}`
            : null,

        foto2:
          lokal?.foto2
            ? `/uploads/xray/${lokal.foto2}`
            : null,

        keluhan_anamnesa:
          utama.keluhan_anamnesa || "-",

        catatan_radiografer:
          lokal?.notes || null,

        // SALAH - syntax error, jadi ke-evaluate jadi true
        hasil_bacaan: utama.photo_reading ? utama.photo_reading : (lokal?.hasil_bacaan || null),

        status:
          !!String(utama.photo_reading || "").trim()
            ? "done"
            : (
                lokal?.status ||
                "none"
              ),

        is_final:
          !!String(utama.photo_reading || "").trim(),

        is_lokal:
          !!String(lokal?.hasil_bacaan || "").trim(),

        pengirim_ihs:
          utama.pengirim_ihs,

        pemeriksa_ihs:
          utama.pemeriksa_ihs,
      },
    });

  } catch (err) {

    console.error(
      "GET DETAIL ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Terjadi kesalahan saat mengambil detail",
    });
  }
};

// ==================================
// UPLOAD X-RAY + SEND IMAGING STUDY
// ==================================
exports.uploadXRay = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();

  let inTransaction = false;

  try {
    const {
      registry_id,
      x_ray_id,
      x_ray_dtl_id,
      created_by,
      upload_mode,
    } = req.body;

    // FILES
    const dicom = req.files?.dicom?.[0];

    const foto1 = req.files?.foto1?.[0];
    const foto2 = req.files?.foto2?.[0];

    /* ======================================================
     * VALIDASI
     * ====================================================== */
    if (!registry_id || !x_ray_dtl_id) {
      throw new Error("registry_id dan x_ray_dtl_id wajib");
    }

    if (!upload_mode) {
      throw new Error("upload_mode wajib");
    }

    // VALIDASI MODE DICOM
    if (upload_mode === "dicom" && !dicom) {
      throw new Error("File DICOM wajib");
    }

    // VALIDASI MODE IMAGE
    if (upload_mode === "image" && !foto1 && !foto2) {
      throw new Error("Minimal upload 1 gambar");
    }
  
    /* ======================================================
     * BEGIN TRANSACTION
     * ====================================================== */
    await connLokal.beginTransaction();
    inTransaction = true;

    let modality = "CR";

    /* ======================================================
     * MODE DICOM
     * ====================================================== */
    if (upload_mode === "dicom") {
      // PARSE UID
      const dicomMeta = parseDicomUID(dicom.path);

      if (!dicomMeta?.studyUID) {
        throw new Error("File bukan DICOM valid");
      }

      // GENERATE THUMBNAIL
      const thumbName = `thumb_${Date.now()}.jpg`;

      const thumbPath = path.join(
        __dirname,
        "../../uploads/xray",
        thumbName
      );

      const thumb = dicomToJpg(dicom.path, thumbPath);

      // UPDATE DATA
      await connLokal.query(
        `
        UPDATE radar_xray
        SET
          dicom_path = ?,
          foto1 = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
        `,
        [
          dicom.filename,
          thumb.success ? thumbName : null,
          created_by,
          registry_id,
          x_ray_dtl_id,
        ]
      );

      // SIMPAN UID
      await connLokal.query(
        `
        UPDATE radar_xray
        SET
          uid_study = ?,
          uid_series = ?,
          uid_instance1 = ?
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
        `,
        [
          dicomMeta.studyUID,
          dicomMeta.seriesUID,
          dicomMeta.sopUID,
          registry_id,
          x_ray_dtl_id,
        ]
      );
    }

    /* ======================================================
     * MODE IMAGE
     * ====================================================== */
    if (upload_mode === "image") {
      await connLokal.query(
        `
        UPDATE radar_xray
        SET
          foto1 = ?,
          foto2 = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
        `,
        [
          foto1?.filename || null,
          foto2?.filename || null,
          created_by,
          registry_id,
          x_ray_dtl_id,
        ]
      );
    }

    /* ======================================================
     * COMMIT
     * ====================================================== */
    await connLokal.commit();
    inTransaction = false;

    /* ======================================================
     * RESPONSE
     * ====================================================== */
    res.json({
      success: true,
    
      message:
        upload_mode === "dicom"
          ? "Upload DICOM berhasil"
          : "Upload gambar berhasil",
    
      upload_mode,
    });

  } catch (err) {
    if (inTransaction) {
      await connLokal.rollback().catch(() => {});
    }

    console.error("UPLOAD X-RAY ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Gagal upload",
    });
  } finally {
    connLokal.release();
  }
};


// =========================================================
// SAVE HASIL BACAN (RADIOLOG)
// =========================================================
exports.saveHasil = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connUtama = await dbUtama.promise().getConnection();

  try {
    const { registry_id, x_ray_id, x_ray_dtl_id, hasil_bacaan, read_by } = req.body;

    if (!registry_id || !x_ray_dtl_id) throw new Error("registry_id dan x_ray_dtl_id wajib");
    if (!hasil_bacaan?.trim()) throw new Error("Hasil bacaan wajib diisi");

    await connLokal.beginTransaction();
    await connUtama.beginTransaction();

    // Ambil data lokal
    const [[lokalData]] = await connLokal.query(
      `SELECT x_ray_id, x_ray_dtl_id, status 
       FROM radar_xray 
       WHERE registry_id = ? AND x_ray_dtl_id = ? AND is_active = 1 
       LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    if (!lokalData) throw new Error("Data lokal tidak ditemukan");
    if (lokalData.status === "none") throw new Error("Foto belum diupload");

    // === UPDATE DATABASE UTAMA & LOKAL (WAJIB) ===
    await connUtama.query(
      `UPDATE x_ray_dtl 
       SET photo_reading = ? 
       WHERE x_ray_id = ? AND x_ray_dtl_id = ?`,
      [hasil_bacaan, lokalData.x_ray_id, x_ray_dtl_id]
    );

    await connLokal.query(
      `
      UPDATE radar_xray
      SET 
        hasil_bacaan = ?,
        status = 'read',
        read_by = ?,
        read_at = NOW(),
        updated_at = NOW()
      WHERE registry_id = ? AND x_ray_dtl_id = ?
      `,
      [hasil_bacaan, read_by, registry_id, x_ray_dtl_id]
    );

    await connLokal.commit();
    await connUtama.commit();

  } catch (err) {
    await connLokal.rollback().catch(() => {});
    await connUtama.rollback().catch(() => {});

    console.error("SAVE HASIL ERROR:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });

  } finally {
    connLokal.release();
    connUtama.release();
  }
};