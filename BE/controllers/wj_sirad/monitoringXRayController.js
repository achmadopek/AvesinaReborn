const dbUtama = require("../../db/connection-avesina");
const dbERM = require("../../db/connection-erm");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { buildServiceRequest } = require("../../services/satusehat/builders/serviceRequestBuilder");

const { satusehatClient } = require("../../services/satusehat/satusehatClient");
const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

const satuSehatService = require("../../services/satusehat/satusehatService");

// =============================================================
// BUILD PAYLOAD HELPER (SUDAH DI-IMPROVE)
// =============================================================
const buildPayloadFromDB = async (registry_id, x_ray_dtl_id) => {
  if (!registry_id || !x_ray_dtl_id) {
    throw new Error("registry_id dan x_ray_dtl_id wajib");
  }

  const [[utama]] = await dbUtama.promise().query(
    `
    SELECT 
      r.registry_id,
      p.patient_ihs_number,
      xrd.photo_reading AS hasil_bacaan,
      xrh.measured_dt,
      xrh.expert,
      ms.medical_service_name AS tindakan,
      sm.loinc_code,
      sm.loinc_display,
      sm.modality

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

    LEFT JOIN erm_rswj.satusehat_mapping sm
      ON sm.local_display = ms.medical_service_name

    WHERE r.registry_id = ?
      AND xrd.x_ray_dtl_id = ?
    LIMIT 1
    `,
    [registry_id, x_ray_dtl_id]
  );

if (!utama) throw new Error("Data utama tidak ditemukan");

  const [[enc]] = await dbERM.promise().query(
    `
    SELECT encounter_uuid
    FROM satusehat
    WHERE registry_id = ?
      AND encounter_uuid IS NOT NULL
    LIMIT 1
    `,
    [registry_id]
  );

  const [[sr]] = await dbERM.promise().query(
    `SELECT service_request_uuid FROM satusehat_service_request WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
    [registry_id, x_ray_dtl_id]
  );

  const [[dokter]] = await dbUtama.promise().query(
    `SELECT satusehat_ihs_number FROM employee WHERE employee_id = ? LIMIT 1`, [utama.expert]
  );

  const missing = [];
  if (!utama?.patient_ihs_number) missing.push("Patient IHS");
  if (!enc?.encounter_uuid) missing.push("Encounter");
  if (!sr?.service_request_uuid) missing.push("ServiceRequest");
  if (!dokter?.satusehat_ihs_number) missing.push("Practitioner IHS");

  return {
    registry_id,
    x_ray_dtl_id,
    hasil_bacaan: utama.hasil_bacaan || "",
    measured_dt: utama.measured_dt,
    tindakan: utama.tindakan,
    loinc_code: utama.loinc_code || "30745-4",
    loinc_display: utama.loinc_display || "Radiology study",
    modality: utama.modality || "CR",

    patient_ihs: utama?.patient_ihs_number || null,
    encounter_uuid: enc?.encounter_uuid || null,
    practitioner_ihs: dokter?.satusehat_ihs_number || null,
    service_request_id: sr?.service_request_uuid || null,

    isCompleteForSatuSehat: missing.length === 0,
    missingFields: missing
  };
};


// ==============================
// GET DATA MONITORING (List) — FINAL VERSION
// ==============================
exports.getData = async (req, res) => {
  try {
    const { peg_id, role, tgl } = req.query;

    let expert_id = null;
    if (role === "radiolog" && peg_id) {
      const [[map]] = await dbLokal.promise().query(
        `SELECT employee_id FROM sdm_pegawai WHERE id = ? LIMIT 1`,
        [peg_id]
      );
      expert_id = map?.employee_id;
    }

    const [utama] = await dbUtama.promise().query(
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
        e.employee_nm AS dr_pengirim,
        e.satusehat_ihs_number AS pengirim_ihs,

        xrh.expert AS pemeriksa_id,
        e2.employee_nm AS dr_pemeriksa,
        e2.satusehat_ihs_number AS pemeriksa_ihs,

        ms.medical_service_name AS tindakan,

        p.patient_ihs_number IS NOT NULL AND p.patient_ihs_number <> '' AS has_patient_ihs

      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN x_ray_hdr xrh ON uv.unit_visit_id = xrh.unit_visit_id
      JOIN x_ray_dtl xrd ON xrh.x_ray_id = xrd.x_ray_id
      JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id

      LEFT JOIN employee e ON xrh.physician = e.employee_id
      LEFT JOIN employee e2 ON xrh.expert = e2.employee_id

      WHERE 1=1
        ${tgl ? "AND DATE(xrh.measured_dt) = ?" : ""}
        ${expert_id ? "AND xrh.expert = ?" : ""}
      ORDER BY xrh.measured_dt DESC, xrd.x_ray_dtl_id ASC
      `,
      [...(tgl ? [tgl] : []), ...(expert_id ? [expert_id] : [])]
    );

    if (utama.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const registryDtlIds = utama.map(u => [u.registry_id, u.x_ray_dtl_id]);

    // Data Lokal
    const [lokal] = await dbLokal.promise().query(
      `SELECT * FROM radar_xray 
       WHERE (registry_id, x_ray_dtl_id) IN (?) AND is_active = 1`,
      [registryDtlIds]
    );

    const mapLokal = new Map(lokal.map(l => [`${l.registry_id}-${l.x_ray_dtl_id}`, l]));

    // Data SatuSehat
    const [ss] = await dbERM.promise().query(
      `
      SELECT 
        registry_id, x_ray_dtl_id,
        MAX(CASE WHEN service_request_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_service_request,
        MAX(CASE WHEN imaging_study_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_imaging,
        MAX(CASE WHEN observation_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_observation,
        MAX(CASE WHEN diagnostic_report_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_report
      FROM (
        SELECT registry_id, x_ray_dtl_id, service_request_uuid, NULL as imaging_study_uuid, NULL as observation_uuid, NULL as diagnostic_report_uuid FROM satusehat_service_request
        UNION ALL
        SELECT registry_id, x_ray_dtl_id, NULL, imaging_study_uuid, NULL, NULL FROM satusehat_imaging_study
        UNION ALL
        SELECT registry_id, x_ray_dtl_id, NULL, NULL, observation_uuid, NULL FROM satusehat_observation
        UNION ALL
        SELECT registry_id, x_ray_dtl_id, NULL, NULL, NULL, diagnostic_report_uuid FROM satusehat_diagnostic_report
      ) ss
      WHERE (registry_id, x_ray_dtl_id) IN (?)
      GROUP BY registry_id, x_ray_dtl_id
      `,
      [registryDtlIds]
    );

    const mapSS = new Map(ss.map(s => [`${s.registry_id}-${s.x_ray_dtl_id}`, s]));

    // Mapping Tindakan
    const tindakanList = [...new Set(utama.map(u => u.tindakan).filter(Boolean))];
    let mapTindakan = {};
    if (tindakanList.length > 0) {
      const [mapping] = await dbERM.promise().query(
        `SELECT local_display, snomed_code, snomed_display, loinc_code, loinc_display 
         FROM satusehat_mapping WHERE local_display IN (?)`,
        [tindakanList]
      );
      mapTindakan = Object.fromEntries(mapping.map(m => [m.local_display, m]));
    }

    // Final Result
    const result = utama.map(u => {
      const key = `${u.registry_id}-${u.x_ray_dtl_id}`;
      const l = mapLokal.get(key) || {};
      const s = mapSS.get(key) || {};

      return {
        ...u,
        status: l.status || "none",
        
        is_final: !!u.photo_reading,
        is_lokal: !!l.hasil_bacaan,

        tindakan_mapping: [{
          nama: u.tindakan,
          snomed_code: mapTindakan[u.tindakan]?.snomed_code || null,
          snomed_display: mapTindakan[u.tindakan]?.snomed_display || null,
          loinc_code: mapTindakan[u.tindakan]?.loinc_code || null,
          loinc_display: mapTindakan[u.tindakan]?.loinc_display || null,
        }],

        satu_sehat: {
          patient: !!u.has_patient_ihs,
          service_request: !!s.has_service_request,
          imaging: !!s.has_imaging,
          observation: !!s.has_observation,
          report: !!s.has_report,
        }
      };
    });

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("GET DATA ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET DETAIL X-RAY (RECOMMENDED)
// ==============================
exports.getDetail = async (req, res) => {
  try {
    const { registry_id, x_ray_dtl_id } = req.params;

    if (!registry_id || !x_ray_dtl_id) {
      return res.status(400).json({ 
        success: false, 
        message: "registry_id dan x_ray_dtl_id wajib diisi" 
      });
    }

    const [[utama]] = await dbUtama.promise().query(
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

        -- Keluhan dari Anamnesis
        a.anamnesa AS keluhan_anamnesa

      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN x_ray_hdr xrh ON uv.unit_visit_id = xrh.unit_visit_id
      JOIN x_ray_dtl xrd ON xrh.x_ray_id = xrd.x_ray_id
      JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id

      LEFT JOIN visite v ON v.unit_visit_id = uv.unit_visit_id
      LEFT JOIN anamnesis a ON a.visite_id = v.visite_id

      LEFT JOIN employee e ON xrh.physician = e.employee_id
      LEFT JOIN employee e2 ON xrh.expert = e2.employee_id

      WHERE r.registry_id = ? AND xrd.x_ray_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, x_ray_dtl_id]
    );

    if (!utama) {
      return res.status(404).json({ 
        success: false, 
        message: "Data X-Ray tidak ditemukan" 
      });
    }

    const [[lokal]] = await dbLokal.promise().query(
      `SELECT * FROM radar_xray 
       WHERE registry_id = ? 
         AND x_ray_dtl_id = ? 
         AND is_active = 1 
       LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    res.json({
      success: true,
      data: {
        ...utama,
        dicom_path: lokal?.dicom_path ? `/uploads/xray/${lokal.dicom_path}` : null,
        foto1: lokal?.foto1 ? `/uploads/xray/${lokal.foto1}` : null,
        foto2: lokal?.foto2 ? `/uploads/xray/${lokal.foto2}` : null,
        
        keluhan_anamnesa: utama.keluhan_anamnesa || "-",
        catatan_radiografer: lokal?.notes ?? null,

        hasil_bacaan: utama.photo_reading || lokal?.hasil_bacaan || null,
        status: !!utama.photo_reading ? "done" : (lokal?.status || "none"),

        is_final: !!utama.photo_reading,
        is_lokal: !!lokal?.hasil_bacaan,

        // Tambahan informasi yang berguna
        pengirim_ihs: utama.pengirim_ihs,
        pemeriksa_ihs: utama.pemeriksa_ihs,
      }
    });
  } catch (err) {
    console.error("GET DETAIL ERROR:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil detail" });
  }
};

exports.requestXRay = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  try {
    const { registry_id, x_ray_id, x_ray_dtl_id, pengirim_id, pemeriksa_id, notes } = req.body;

    if (!registry_id || !x_ray_dtl_id) throw new Error("registry_id dan x_ray_dtl_id wajib");

    await connLokal.beginTransaction();
    await connERM.beginTransaction();

    // Ambil data lengkap
    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        xrh.x_ray_id,
        xrd.x_ray_dtl_id,
        r.registry_dt,
        uv.unit_visit_dt,
        p.mr_code,
        p.patient_nm,
        p.patient_ihs_number,
        e.employee_id AS pengirim_id,
        e.employee_nm AS pengirim_nm,
        e.satusehat_ihs_number AS pengirim_ihs,
        e2.employee_id AS pemeriksa_id,
        e2.employee_nm AS pemeriksa_nm,
        e2.satusehat_ihs_number AS pemeriksa_ihs,
        ms.medical_service_name AS tindakan
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN x_ray_hdr xrh ON xrh.unit_visit_id = uv.unit_visit_id
      JOIN x_ray_dtl xrd ON xrh.x_ray_id = xrd.x_ray_id
      JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id
      LEFT JOIN employee e ON e.employee_id = xrh.physician
      LEFT JOIN employee e2 ON e2.employee_id = xrh.expert
      WHERE r.registry_id = ? AND xrd.x_ray_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, x_ray_dtl_id]
    );

    if (!utama) throw new Error("Data X-Ray tidak ditemukan");

    const [[encounter]] = await dbERM.promise().query(
      `
      SELECT encounter_uuid
      FROM satusehat
      WHERE registry_id = ?
        AND encounter_uuid IS NOT NULL
      LIMIT 1
      `,
      [registry_id]
    );

    // Mapping LOINC
    const [[mapping]] = await dbERM.promise().query(`
      SELECT loinc_code, loinc_display 
      FROM satusehat_mapping 
      WHERE local_display = ? 
      LIMIT 1
    `, [utama.tindakan]);

    const loinc_code = mapping?.loinc_code || "30745-4";
    const loinc_display = mapping?.loinc_display || "Radiology study";

    // === 1. SIMPAN LOKAL DULU (WAJIB) ===
    await connLokal.query(`
      INSERT INTO radar_xray 
      (registry_id, x_ray_id, x_ray_dtl_id, notes, status, ordered_by, created_at)
      VALUES (?, ?, ?, ?, 'ordered', ?, NOW())
      ON DUPLICATE KEY UPDATE 
        notes = VALUES(notes),
        status = 'ordered',
        updated_at = NOW()
    `, [registry_id, x_ray_id, x_ray_dtl_id, notes || "", pengirim_id]);

    // === 2. SatuSehat (Optional & Cerdas) ===
    let ssResult = { success: false, service_request_id: `LOCAL-${Date.now()}` };

    if (process.env.DEBUG_SATUSEHAT !== "true") {
      const check = await buildPayloadFromDB(registry_id, x_ray_dtl_id);

      if (check.isCompleteForSatuSehat) {
        const payload = buildServiceRequest({
          patient_ihs: utama.patient_ihs_number,
          encounter_uuid: encounter?.encounter_uuid,
          pengirim_ihs: utama.pengirim_ihs,
          pemeriksa_ihs: utama.pemeriksa_ihs,
          tanggal: utama.unit_visit_dt,
          loinc_code,
          loinc_display,
        });

        ssResult = await satuSehatService.sendServiceRequest(payload);
      } else {
        console.warn("Skip SatuSehat ServiceRequest - missing:", check.missingFields);
      }
    }

    const serviceRequestUUID = ssResult.data?.id || ssResult.service_request_id;

    // Simpan ke tabel SatuSehat
    await connERM.query(
      `
      INSERT INTO satusehat_service_request
      (registry_id, x_ray_id, x_ray_dtl_id, service_request_uuid, code, display, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        service_request_uuid = VALUES(service_request_uuid),
        code = VALUES(code),
        display = VALUES(display),
        status = VALUES(status),
        updated_at = NOW()
      `,
      [registry_id, utama.x_ray_id, utama.x_ray_dtl_id, serviceRequestUUID, loinc_code, loinc_display, "active"]
    );

    await connLokal.commit();
    await connERM.commit();

    res.json({
      success: true,
      message: "Request X-Ray berhasil",
      satusehat: ssResult.success ? "success" : "failed/pending",
      service_request_id: serviceRequestUUID
    });

  } catch (err) {
    await connLokal.rollback().catch(() => {});
    await connERM.rollback().catch(() => {});

    console.error("PROSES XRAY ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    connLokal?.release();
    connERM?.release();
  }
};

// ==================================
// UPLOAD X-RAY + SEND IMAGING STUDY
// ==================================
exports.uploadXRay = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  let inTransaction = false;

  try {
    const { registry_id, x_ray_id, x_ray_dtl_id, created_by } = req.body;
    const dicom = req.files?.dicom?.[0];

    if (!registry_id || !x_ray_dtl_id) throw new Error("registry_id dan x_ray_dtl_id wajib");
    if (!dicom) throw new Error("File DICOM wajib");

    // Cek ServiceRequest
    const [[sr]] = await connERM.query(
      `SELECT service_request_uuid FROM satusehat_service_request 
       WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    if (!sr?.service_request_uuid) {
      return res.status(400).json({ success: false, message: "ServiceRequest belum dibuat" });
    }

    await connLokal.beginTransaction();
    inTransaction = true;

    const dicomMeta = parseDicomUID(dicom.path);
    if (!dicomMeta?.studyUID) throw new Error("File bukan DICOM valid");

    // Generate Thumbnail
    const thumbName = `thumb_${Date.now()}.jpg`;
    const thumbPath = path.join(__dirname, "../../uploads/xray", thumbName);
    const thumb = dicomToJpg(dicom.path, thumbPath);

    // Update Database Lokal
    await connLokal.query(
      `
      UPDATE radar_xray
      SET dicom_path = ?, 
          foto1 = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
      WHERE registry_id = ? AND x_ray_dtl_id = ?
      `,
      [dicom.filename, thumb.success ? thumbName : null, created_by, registry_id, x_ray_dtl_id]
    );

    await connLokal.commit();
    inTransaction = false;

    // Simpan UID
    const uid = {
      study: dicomMeta.studyUID,
      series: dicomMeta.seriesUID,
      instance: dicomMeta.sopUID,
    };

    await connLokal.query(
      `UPDATE radar_xray SET uid_study = ?, uid_series = ?, uid_instance1 = ? 
       WHERE registry_id = ? AND x_ray_dtl_id = ?`,
      [uid.study, uid.series, uid.instance, registry_id, x_ray_dtl_id]
    );

    // === Kirim ImagingStudy (Hanya jika memenuhi syarat) ===
    let imagingResult = { success: false, imaging_id: `LOCAL-IMG-${Date.now()}` };

    if (process.env.DEBUG_SATUSEHAT !== "true" && sr?.service_request_uuid) {
      const check = await buildPayloadFromDB(registry_id, x_ray_dtl_id);
      const modality = check.modality || "CR";

      if (check.isCompleteForSatuSehat) {
        const normalized = {
          patient_id: check.patient_ihs,
          encounter_id: check.encounter_uuid,
          doctor_id: check.practitioner_ihs,
          service_request_id: sr.service_request_uuid,
          measured_dt: check.measured_dt,
          no_reg: registry_id,
          modality: modality,
        };

        imagingResult = await satuSehatService.sendImagingStudy(normalized, process.env.ORGANIZATION_ID);
      } else {
        console.warn("⏭️ Skip ImagingStudy - missing:", check.missingFields);
      }
    }

    // Simpan ke tabel SatuSehat
    await connERM.query(
      `
      INSERT INTO satusehat_imaging_study 
      (registry_id, x_ray_id, x_ray_dtl_id, service_request_uuid, imaging_study_uuid, modality, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        imaging_study_uuid = VALUES(imaging_study_uuid),
        modality = VALUES(modality),
        status = VALUES(status),
        updated_at = NOW()
      `,
      [registry_id, x_ray_id, x_ray_dtl_id, sr.service_request_uuid, imagingResult.imaging_id || imagingResult.data?.id, modality, "available"]
    );

    res.json({
      success: true,
      message: "Upload DICOM berhasil",
      satusehat_imaging: imagingResult.success ? "success" : "pending"
    });

  } catch (err) {
    if (inTransaction) await connLokal.rollback().catch(() => {});
    console.error("UPLOAD X-RAY ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Gagal upload"
    });
  } finally {
    connLokal.release();
    connERM.release();
  }
};

// =========================================================
// SAVE HASIL BACAN (RADIOLOG) + SEND OBSERVATION SATUSEHAT
// =========================================================
exports.saveHasil = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connUtama = await dbUtama.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

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

    // Cek apakah sudah pernah kirim Observation
    const [[existingObs]] = await connERM.query(
      `SELECT observation_uuid 
       FROM satusehat_observation 
       WHERE registry_id = ? AND x_ray_dtl_id = ? 
       LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

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

    // === KIRIM OBSERVATION KE SATUSEHAT (OPTIONAL) ===
    let obsResult = { success: false };

    if (process.env.DEBUG_SATUSEHAT !== "true" && !existingObs?.observation_uuid) {
      try {
        const payload = await buildPayloadFromDB(registry_id, x_ray_dtl_id);

        if (payload.isCompleteForSatuSehat) {
          const cleanText = payload.hasil_bacaan
            ?.replace(/\r\n/g, "\n")
            ?.replace(/\n{3,}/g, "\n\n")
            ?.trim();

          obsResult = await satuSehatService.sendObservation({
            ...payload,
            hasil_bacaan: cleanText,
          });

          // Simpan ke tabel jika berhasil
          if (obsResult.success && obsResult.data?.id) {
            await connERM.query(
              `
              INSERT INTO satusehat_observation
              (registry_id, x_ray_id, x_ray_dtl_id, service_request_uuid, 
               observation_uuid, code, display, value_text, issued_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE
                observation_uuid = VALUES(observation_uuid),
                value_text = VALUES(value_text),
                issued_at = VALUES(issued_at),
                updated_at = NOW()
              `,
              [
                registry_id, x_ray_id, x_ray_dtl_id, payload.service_request_id,
                obsResult.data.id, payload.loinc_code, payload.loinc_display,
                cleanText, obsResult.data?.issued || new Date()
              ]
            );
          }
        } else {
          console.warn("⏭️ Skip Observation - data SatuSehat belum lengkap:", payload.missingFields);
        }
      } catch (obsErr) {
        console.warn("⚠️ Observation gagal dikirim:", obsErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Hasil bacaan berhasil disimpan",
      observation_sent: obsResult.success,
      note: obsResult.success ? "" : "SatuSehat observation pending"
    });

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
    connERM.release();
  }
};

// ==============================
// SEND DIAGNOSTIC REPORT
// ==============================
exports.sendDiagnostic = async (req, res) => {
  const connERM = await dbERM.promise().getConnection();
  const connLokal = await dbLokal.promise().getConnection();

  try {
    const { registry_id, x_ray_id, x_ray_dtl_id } = req.body;

    if (!registry_id || !x_ray_dtl_id) {
      throw new Error("registry_id dan x_ray_dtl_id wajib");
    }

    // Cek duplikasi
    const [[existing]] = await connERM.query(
      `SELECT diagnostic_report_uuid 
       FROM satusehat_diagnostic_report 
       WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    if (existing?.diagnostic_report_uuid) {
      return res.status(400).json({
        success: false,
        message: "DiagnosticReport sudah pernah dikirim"
      });
    }

    // Ambil payload
    const payload = await buildPayloadFromDB(registry_id, x_ray_dtl_id);

    // Ambil Observation & ImagingStudy
    const [[obs]] = await connERM.query(
      `SELECT observation_uuid FROM satusehat_observation 
       WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    const [[img]] = await connERM.query(
      `SELECT imaging_study_uuid FROM satusehat_imaging_study 
       WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
      [registry_id, x_ray_dtl_id]
    );

    if (!obs?.observation_uuid) throw new Error("Observation belum tersedia");
    if (!img?.imaging_study_uuid) throw new Error("ImagingStudy belum tersedia");

    // === KIRIM KE SATUSEHAT (Hanya jika lengkap) ===
    let diagResult = { success: false, id: `LOCAL-DIAG-${Date.now()}` };

    if (process.env.DEBUG_SATUSEHAT !== "true" && payload.isCompleteForSatuSehat) {
      diagResult = await satuSehatService.sendDiagnosticReport(
        payload,
        obs.observation_uuid,
        img.imaging_study_uuid,
        process.env.ORGANIZATION_ID
      );
    } else {
      console.warn("⏭️ Skip DiagnosticReport - data belum lengkap:", payload.missingFields);
    }

    // Simpan ke tabel SatuSehat
    await connERM.query(
      `
      INSERT INTO satusehat_diagnostic_report
      (registry_id, x_ray_id, x_ray_dtl_id, service_request_uuid, 
       diagnostic_report_uuid, status, conclusion, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        diagnostic_report_uuid = VALUES(diagnostic_report_uuid),
        status = VALUES(status),
        conclusion = VALUES(conclusion),
        updated_at = NOW()
      `,
      [
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
        payload.service_request_id,
        diagResult.data?.id || diagResult.id,
        diagResult.data?.status || "final",
        payload.hasil_bacaan
      ]
    );

    // Update status lokal menjadi DONE
    await connLokal.query(
      `UPDATE radar_xray 
       SET status = 'done', updated_at = NOW() 
       WHERE registry_id = ? AND x_ray_dtl_id = ?`,
      [registry_id, x_ray_dtl_id]
    );

    res.json({
      success: true,
      message: "DiagnosticReport berhasil diproses",
      diagnostic_report_id: diagResult.data?.id || diagResult.id,
      satusehat: diagResult.success ? "success" : "pending"
    });

  } catch (err) {
    console.error("SEND DIAGNOSTIC ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    connERM.release();
    connLokal.release();
  }
};