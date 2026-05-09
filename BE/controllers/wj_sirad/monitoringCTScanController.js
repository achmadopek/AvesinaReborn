const dbUtama = require("../../db/connection-avesina");
const dbERM = require("../../db/connection-erm");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { buildServiceRequest } = require("../../services/satusehat/builders/serviceRequestBuilder");
const { buildImagingStudy } = require("../../services/satusehat/builders/imagingStudyBuilder");

const { satusehatClient } = require("../../services/satusehat/satusehatClient");
const { generateUID } = require("../../services/satusehat/builders");
const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

const {
  sendImagingStudyToSatuSehat,
  sendObservationToSatuSehat,
  sendDiagnosticToSatuSehat,
} = require("../../services/satusehat/sender");

// =============================================================
// BUILD PAYLOAD HELPER (DIGUNAKAN OLEH BANYAK FUNCTION)
// =============================================================
const buildPayloadFromDB = async (registry_id, ct_scan_dtl_id) => {
  if (!registry_id || !ct_scan_dtl_id) {
    throw new Error("registry_id dan ct_scan_dtl_id wajib");
  }

  const [[utama]] = await dbUtama.promise().query(
    `
    SELECT 
      r.registry_id,
      ctd.ct_scan_reading AS hasil_bacaan,
      cth.measured_dt,
      cth.expert,
      ms.medical_service_name AS tindakan,
      sm.loinc_code,
      sm.loinc_display,
      sm.modality
    FROM registry r
    JOIN unit_visit uv ON uv.registry_id = r.registry_id
    JOIN ct_scan_hdr cth ON cth.unit_visit_id = uv.unit_visit_id
    JOIN ct_scan_dtl ctd ON ctd.ct_scan_id = cth.ct_scan_id
    JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id
    LEFT JOIN erm_rswj.satusehat_mapping sm ON sm.local_display = ms.medical_service_name
    WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
    LIMIT 1
    `,
    [registry_id, ct_scan_dtl_id]
  );

  if (!utama) throw new Error("Data utama tidak ditemukan");

  const [[ss]] = await dbERM.promise().query(
    `SELECT patient_ihs_number, encounter_uuid FROM satusehat WHERE registry_id = ? LIMIT 1`,
    [registry_id]
  );

  const [[sr]] = await dbERM.promise().query(
    `SELECT service_request_uuid FROM satusehat_service_request 
     WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
    [registry_id, ct_scan_dtl_id]
  );

  const [[dokter]] = await dbUtama.promise().query(
    `SELECT satusehat_ihs_number FROM employee WHERE employee_id = ? LIMIT 1`,
    [utama.expert]
  );

  if (!ss?.patient_ihs_number) throw new Error("Patient IHS tidak ditemukan");
  if (!ss?.encounter_uuid) throw new Error("Encounter belum tersedia");
  if (!sr?.service_request_uuid) throw new Error("ServiceRequest tidak ditemukan");
  if (!dokter?.satusehat_ihs_number) throw new Error("Practitioner IHS tidak ditemukan");

  return {
    registry_id,
    ct_scan_dtl_id,
    hasil_bacaan: utama.hasil_bacaan,
    measured_dt: utama.measured_dt,
    tindakan: utama.tindakan,
    loinc_code: utama.loinc_code,
    loinc_display: utama.loinc_display,
    modality: utama.modality || "CR",

    patient_ihs: ss.patient_ihs_number,
    encounter_uuid: ss.encounter_uuid,
    practitioner_ihs: dokter.satusehat_ihs_number,
    service_request_id: sr.service_request_uuid,
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
        cth.ct_scan_id,
        ctd.ct_scan_dtl_id,
        r.registry_dt,
        cth.measured_dt,

        p.mr_code,
        p.patient_nm,

        cth.physician AS pengirim_id,
        e.employee_nm AS dr_pengirim,
        e.satusehat_ihs_number AS pengirim_ihs,

        cth.expert AS pemeriksa_id,
        e2.employee_nm AS dr_pemeriksa,
        e2.satusehat_ihs_number AS pemeriksa_ihs,

        ms.medical_service_name AS tindakan,
        ctd.ct_scan_reading,

        ss.patient_ihs_number IS NOT NULL AS has_patient_ihs,
        ss.encounter_uuid IS NOT NULL AS has_encounter

      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON uv.unit_visit_id = cth.unit_visit_id
      JOIN ct_scan_dtl ctd ON cth.ct_scan_id = ctd.ct_scan_id
      JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id

      LEFT JOIN employee e ON cth.physician = e.employee_id
      LEFT JOIN employee e2 ON cth.expert = e2.employee_id
      LEFT JOIN erm_rswj.satusehat ss ON ss.registry_id = r.registry_id

      WHERE 1=1
        ${tgl ? "AND DATE(cth.measured_dt) = ?" : ""}
        ${expert_id ? "AND cth.expert = ?" : ""}
      ORDER BY cth.measured_dt DESC, ctd.ct_scan_dtl_id ASC
      `,
      [...(tgl ? [tgl] : []), ...(expert_id ? [expert_id] : [])]
    );

    if (utama.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const registryDtlIds = utama.map(u => [u.registry_id, u.ct_scan_dtl_id]);

    // Data Lokal
    const [lokal] = await dbLokal.promise().query(
      `SELECT * FROM radar_ctscan 
       WHERE (registry_id, ct_scan_dtl_id) IN (?) AND is_active = 1`,
      [registryDtlIds]
    );

    const mapLokal = new Map(lokal.map(l => [`${l.registry_id}-${l.ct_scan_dtl_id}`, l]));

    // Data SatuSehat
    const [ss] = await dbERM.promise().query(
      `
      SELECT 
        registry_id, ct_scan_dtl_id,
        MAX(CASE WHEN service_request_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_service_request,
        MAX(CASE WHEN imaging_study_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_imaging,
        MAX(CASE WHEN observation_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_observation,
        MAX(CASE WHEN diagnostic_report_uuid IS NOT NULL THEN 1 ELSE 0 END) AS has_report
      FROM (
        SELECT registry_id, ct_scan_dtl_id, service_request_uuid, NULL as imaging_study_uuid, NULL as observation_uuid, NULL as diagnostic_report_uuid FROM satusehat_service_request
        UNION ALL
        SELECT registry_id, ct_scan_dtl_id, NULL, imaging_study_uuid, NULL, NULL FROM satusehat_imaging_study
        UNION ALL
        SELECT registry_id, ct_scan_dtl_id, NULL, NULL, observation_uuid, NULL FROM satusehat_observation
        UNION ALL
        SELECT registry_id, ct_scan_dtl_id, NULL, NULL, NULL, diagnostic_report_uuid FROM satusehat_diagnostic_report
      ) ss
      WHERE (registry_id, ct_scan_dtl_id) IN (?)
      GROUP BY registry_id, ct_scan_dtl_id
      `,
      [registryDtlIds]
    );

    const mapSS = new Map(ss.map(s => [`${s.registry_id}-${s.ct_scan_dtl_id}`, s]));

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
      const key = `${u.registry_id}-${u.ct_scan_dtl_id}`;
      const l = mapLokal.get(key) || {};
      const s = mapSS.get(key) || {};

      return {
        ...u,
        foto1: l.foto1 ? `/uploads/ctscan/${l.foto1}` : null,
        foto2: l.foto2 ? `/uploads/ctscan/${l.foto2}` : null,
        dicom_path: l.dicom_path ? `/uploads/ctscan/${l.dicom_path}` : null,
        keluhan: l.keluhan || "-",
        hasil_bacaan: u.ct_scan_reading || l.hasil_bacaan || null,
        status: l.status || "none",
        is_final: !!u.ct_scan_reading,
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
          encounter: !!u.has_encounter,
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
// GET DETAIL CT-SCAN (RECOMMENDED)
// ==============================
exports.getDetail = async (req, res) => {
  try {
    const { registry_id, ct_scan_dtl_id } = req.params;

    if (!registry_id || !ct_scan_dtl_id) {
      return res.status(400).json({ 
        success: false, 
        message: "registry_id dan ct_scan_dtl_id wajib diisi" 
      });
    }

    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        cth.ct_scan_id,
        ctd.ct_scan_dtl_id,
        p.patient_nm,
        p.mr_code,
        cth.measured_dt,
        ms.medical_service_name AS tindakan,
        ctd.ct_scan_reading,
        cth.physician AS pengirim_id,
        cth.expert AS pemeriksa_id,
        e.employee_nm AS pengirim,
        e2.employee_nm AS radiolog,
        e.satusehat_ihs_number AS pengirim_ihs,           -- tambahan
        e2.satusehat_ihs_number AS pemeriksa_ihs          -- tambahan
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON uv.unit_visit_id = cth.unit_visit_id
      JOIN ct_scan_dtl ctd ON cth.ct_scan_id = ctd.ct_scan_id
      JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id
      LEFT JOIN employee e ON cth.physician = e.employee_id
      LEFT JOIN employee e2 ON cth.expert = e2.employee_id
      WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, ct_scan_dtl_id]
    );

    if (!utama) {
      return res.status(404).json({ 
        success: false, 
        message: "Data CT-Scan tidak ditemukan" 
      });
    }

    const [[lokal]] = await dbLokal.promise().query(
      `SELECT * FROM radar_ctscan 
       WHERE registry_id = ? 
         AND ct_scan_dtl_id = ? 
         AND is_active = 1 
       LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    res.json({
      success: true,
      data: {
        ...utama,
        dicom_path: lokal?.dicom_path ? `/uploads/ctscan/${lokal.dicom_path}` : null,
        foto1: lokal?.foto1 ? `/uploads/ctscan/${lokal.foto1}` : null,
        foto2: lokal?.foto2 ? `/uploads/ctscan/${lokal.foto2}` : null,
        keluhan: lokal?.keluhan || "-",
        hasil_bacaan: utama.ct_scan_reading || lokal?.hasil_bacaan || null,
        status: !!utama.ct_scan_reading ? "done" : (lokal?.status || "none"),
        is_final: !!utama.ct_scan_reading,
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

exports.requestCTScan = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  try {
    const { registry_id, ct_scan_id, ct_scan_dtl_id, pengirim_id, pemeriksa_id, keluhan } = req.body;

    if (!registry_id || !ct_scan_dtl_id) {
      throw new Error("registry_id dan ct_scan_dtl_id wajib");
    }

    await connLokal.beginTransaction();
    await connERM.beginTransaction();

    // Ambil data lengkap
    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        cth.ct_scan_id,
        ctd.ct_scan_dtl_id,
        r.registry_dt,
        uv.unit_visit_dt,
        p.mr_code,
        p.patient_nm,
        ss.patient_ihs_number AS patient_ihs,
        e.employee_id AS pengirim_id,
        e.employee_nm AS pengirim_nm,
        e.satusehat_ihs_number AS pengirim_ihs,
        e2.employee_id AS pemeriksa_id,
        e2.employee_nm AS pemeriksa_nm,
        e2.satusehat_ihs_number AS pemeriksa_ihs,
        ss.encounter_uuid
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON cth.unit_visit_id = uv.unit_visit_id
      JOIN ct_scan_dtl ctd ON cth.ct_scan_id = ctd.ct_scan_id
      LEFT JOIN employee e ON e.employee_id = cth.physician
      LEFT JOIN employee e2 ON e2.employee_id = cth.expert
      LEFT JOIN erm_rswj.satusehat ss ON ss.registry_id = r.registry_id
      WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, ct_scan_dtl_id]
    );

    if (!utama) throw new Error("Data CT-Scan tidak ditemukan");

    // Validasi IHS
    if (!utama.patient_ihs) throw new Error("Patient belum punya IHS Number");
    if (!utama.pengirim_ihs) throw new Error("Pengirim belum punya IHS");
    if (!utama.pemeriksa_ihs) throw new Error("Pemeriksa belum punya IHS");

    // Mapping LOINC
    const [[mapping]] = await dbERM.promise().query(`
      SELECT loinc_code, loinc_display 
      FROM satusehat_mapping 
      WHERE local_display = ? 
      LIMIT 1
    `, [utama.tindakan]);

    const payload = buildServiceRequest({
      patient_ihs: utama.patient_ihs,
      encounter_uuid: utama.encounter_uuid,
      pengirim_ihs: utama.pengirim_ihs,
      pemeriksa_ihs: utama.pemeriksa_ihs,
      tanggal: utama.unit_visit_dt,
      loinc_code: mapping?.loinc_code || "30745-4",
      loinc_display: mapping?.loinc_display || "Radiology study",
    });

    console.log("===== DEBUG SERVICE REQUEST =====");
    console.dir(payload, { depth: null });
    console.log("=================================");

    let serviceRequestUUID = "DEBUG-" + Date.now();

    if (process.env.DEBUG_SATUSEHAT !== "true") {
      const response = await satusehatClient.post("/ServiceRequest", payload);
      serviceRequestUUID = response.data.id;
    }

    // ====================== SIMPAN KE ERM ======================
    await connERM.query(
      `
      INSERT INTO satusehat_service_request
      (registry_id, ct_scan_id, ct_scan_dtl_id, service_request_uuid, code, display, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        service_request_uuid = VALUES(service_request_uuid),
        code = VALUES(code),
        display = VALUES(display),
        status = VALUES(status),
        updated_at = NOW()
      `,
      [registry_id, utama.ct_scan_id, utama.ct_scan_dtl_id, serviceRequestUUID, loinc_code, loinc_display, "active"]
    );

    // ====================== SIMPAN KE radar_ctscan ======================
    await connLokal.query(
      `
      INSERT INTO radar_ctscan
      (registry_id, ct_scan_id, ct_scan_dtl_id, service_request_id, status, ordered_by, keluhan, created_at)
      VALUES (?, ?, ?, ?, 'ordered', ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        service_request_id = VALUES(service_request_id),
        status = 'ordered',
        ordered_by = VALUES(ordered_by),
        keluhan = VALUES(keluhan),
        updated_at = NOW()
      `,
      [registry_id, utama.ct_scan_id, utama.ct_scan_dtl_id, serviceRequestUUID, pengirim_id, keluhan]
    );

    await connLokal.commit();
    await connERM.commit();

    res.json({
      success: true,
      message: "ServiceRequest berhasil dibuat",
      service_request_id: serviceRequestUUID,
    });

  } catch (err) {
    await connLokal.rollback().catch(() => {});
    await connERM.rollback().catch(() => {});

    console.error("PROSES CTSCAN ERROR:", err.message);
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
// UPLOAD CT-SCAN + SEND IMAGING STUDY
// ==================================
exports.uploadCTScan = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  let inTransaction = false;

  try {
    const { registry_id, ct_scan_id, ct_scan_dtl_id, created_by } = req.body;

    if (!registry_id || !ct_scan_dtl_id) {
      throw new Error("registry_id dan ct_scan_dtl_id wajib");
    }

    console.log("UPLOAD CT-SCAN BODY:", req.body);
    console.log("FILES:", req.files);

    // Cek apakah sudah final di Avesina
    const [[cekFinal]] = await dbUtama.promise().query(
      `SELECT ct_scan_reading FROM ct_scan_dtl WHERE ct_scan_id = ? LIMIT 1`,
      [ct_scan_id]
    );

    const isFinal = !!cekFinal?.ct_scan_reading;

    // Ambil data lokal
    const [[existing]] = await connLokal.query(
      `SELECT * FROM radar_ctscan 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? AND is_active = 1 LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!existing) throw new Error("Data belum di-request");

    // Cek ServiceRequest
    const [[sr]] = await connERM.query(
      `SELECT service_request_uuid FROM satusehat_service_request 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!sr?.service_request_uuid) {
      return res.status(400).json({ success: false, message: "ServiceRequest belum dibuat" });
    }

    // Ambil data lengkap untuk ImagingStudy
    const [[detail]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id, cth.ct_scan_id, ctd.ct_scan_dtl_id, cth.measured_dt,
        ss.patient_ihs_number AS patient_ihs,
        ss.encounter_uuid,
        e.satusehat_ihs_number AS practitioner_ihs
      FROM registry r
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON cth.unit_visit_id = uv.unit_visit_id
      JOIN ct_scan_dtl ctd ON ctd.ct_scan_id = cth.ct_scan_id
      LEFT JOIN employee e ON e.employee_id = cth.expert
      LEFT JOIN erm_rswj.satusehat ss ON ss.registry_id = r.registry_id
      WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, ct_scan_dtl_id]
    );

    if (!detail?.patient_ihs || !detail?.encounter_uuid || !detail?.practitioner_ihs) {
      throw new Error("Data SatuSehat belum lengkap");
    }

    // ==================== UPLOAD FILE ====================
    await connLokal.beginTransaction();
    inTransaction = true;

    const dicom = req.files?.dicom?.[0];
    if (!dicom) throw new Error("File DICOM tidak diterima");

    const dicomMeta = parseDicomUID(dicom.path);
    if (!dicomMeta?.studyUID) throw new Error("File bukan DICOM valid");

    // Generate Thumbnail
    const thumbName = `thumb_${Date.now()}.jpg`;
    const thumbPath = path.join(__dirname, "../../uploads/ctscan", thumbName);
    const thumb = dicomToJpg(dicom.path, thumbPath);

    // Update Database
    await connLokal.query(
      `
      UPDATE radar_ctscan
      SET dicom_path = ?, 
          foto1 = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
      WHERE registry_id = ? AND ct_scan_dtl_id = ?
      `,
      [dicom.filename, thumb.success ? thumbName : null, created_by, registry_id, ct_scan_dtl_id]
    );

    await connLokal.commit();
    inTransaction = false;

    // ==================== SIMPAN UID & KIRIM IMAGING STUDY ====================
    const uid = {
      study: dicomMeta.studyUID,
      series: dicomMeta.seriesUID,
      instance: dicomMeta.sopUID,
    };

    await connLokal.query(
      `UPDATE radar_ctscan SET uid_study = ?, uid_series = ?, uid_instance1 = ? 
       WHERE registry_id = ? AND ct_scan_dtl_id = ?`,
      [uid.study, uid.series, uid.instance, registry_id, ct_scan_dtl_id]
    );

    // Ambil modality dari mapping
    let modality = "CR";
    const [[tindakan]] = await dbUtama.promise().query(
      `SELECT medical_service_name FROM ct_scan_dtl ctd 
       JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id 
       WHERE ctd.ct_scan_id = ? LIMIT 1`,
      [ct_scan_id]
    );

    if (tindakan?.medical_service_name) {
      const [[map]] = await dbERM.promise().query(
        `SELECT modality FROM satusehat_mapping WHERE local_display = ? LIMIT 1`,
        [tindakan.medical_service_name]
      );
      if (map?.modality) modality = map.modality;
    }

    const normalized = {
      patient_id: detail.patient_ihs,
      encounter_id: detail.encounter_uuid,
      doctor_id: detail.practitioner_ihs,
      service_request_id: sr.service_request_uuid,
      measured_dt: detail.measured_dt,
      no_reg: registry_id,
      modality: modality,
    };

    const imagingPayload = buildImagingStudy(normalized, uid, process.env.ORGANIZATION_ID);

    let imagingId = `DEBUG-${Date.now()}`;
    let imagingStatus = "available";

    if (process.env.DEBUG_SATUSEHAT !== "true") {
      const resImg = await satusehatClient.post("/ImagingStudy", imagingPayload);
      imagingId = resImg.data.id;
      imagingStatus = resImg.data.status || "available";
    }

    // Simpan ke SatuSehat
    await connERM.query(
      `
      INSERT INTO satusehat_imaging_study 
      (registry_id, ct_scan_id, ct_scan_dtl_id, service_request_uuid, imaging_study_uuid, modality, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        imaging_study_uuid = VALUES(imaging_study_uuid),
        modality = VALUES(modality),
        status = VALUES(status),
        updated_at = NOW()
      `,
      [registry_id, ct_scan_id, ct_scan_dtl_id, sr.service_request_uuid, imagingId, modality, imagingStatus]
    );

    res.json({
      success: true,
      is_final: isFinal,
      message: isFinal 
        ? "Data sudah final. ImagingStudy tetap dikirim." 
        : "Upload DICOM & ImagingStudy berhasil",
    });

  } catch (err) {
    if (inTransaction) await connLokal.rollback().catch(() => {});
    console.error("UPLOAD CT-SCAN ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.response?.data?.issue?.[0]?.diagnostics || err.message,
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
    const { registry_id, ct_scan_id, ct_scan_dtl_id, hasil_bacaan, read_by } = req.body;

    if (!registry_id || !ct_scan_dtl_id) throw new Error("registry_id dan ct_scan_dtl_id wajib");
    if (!hasil_bacaan?.trim()) throw new Error("Hasil bacaan wajib diisi");

    await connLokal.beginTransaction();
    await connUtama.beginTransaction();

    // Ambil data lokal
    const [[lokalData]] = await connLokal.query(
      `SELECT ct_scan_id, ct_scan_dtl_id, status 
       FROM radar_ctscan 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? AND is_active = 1 
       LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!lokalData) throw new Error("Data lokal tidak ditemukan");
    if (lokalData.status === "none") throw new Error("Foto belum diupload");

    // Cek apakah sudah pernah kirim Observation
    const [[existingObs]] = await connERM.query(
      `SELECT observation_uuid 
       FROM satusehat_observation 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? 
       LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    // Update ke tabel utama Avesina (jika belum ada hasil)
    await connUtama.query(
      `UPDATE ct_scan_dtl 
       SET ct_scan_reading = ? 
       WHERE ct_scan_id = ? AND ct_scan_dtl_id = ?`,
      [hasil_bacaan, lokalData.ct_scan_id, ct_scan_dtl_id]
    );

    // Update tabel lokal
    await connLokal.query(
      `
      UPDATE radar_ctscan
      SET 
        hasil_bacaan = ?,
        status = 'read',
        read_by = ?,
        read_at = NOW(),
        updated_at = NOW()
      WHERE registry_id = ? AND ct_scan_dtl_id = ?
      `,
      [hasil_bacaan, read_by, registry_id, ct_scan_dtl_id]
    );

    await connLokal.commit();
    await connUtama.commit();

    // ==================== KIRIM OBSERVATION (jika belum pernah) ====================
    if (!existingObs?.observation_uuid) {
      try {
        const payload = await buildPayloadFromDB(registry_id, ct_scan_dtl_id);

        const cleanText = payload.hasil_bacaan
          ?.replace(/\r\n/g, "\n")
          ?.replace(/\n{3,}/g, "\n\n")
          ?.trim();

        let result;

        if (process.env.DEBUG_SATUSEHAT === "true") {
          console.log("DEBUG MODE: Skip Observation API");
          result = { id: `DEBUG-OBS-${Date.now()}`, status: "final" };
        } else {
          result = await sendObservationToSatuSehat({
            ...payload,
            hasil_bacaan: cleanText,
          });
        }

        // Simpan ke tabel SatuSehat
        await connERM.query(
          `
          INSERT INTO satusehat_observation
          (registry_id, ct_scan_id, ct_scan_dtl_id, service_request_uuid, 
           observation_uuid, code, display, value_text, issued_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            observation_uuid = VALUES(observation_uuid),
            code = VALUES(code),
            display = VALUES(display),
            value_text = VALUES(value_text),
            issued_at = VALUES(issued_at),
            updated_at = NOW()
          `,
          [
            registry_id,
            ct_scan_id,
            ct_scan_dtl_id,
            payload.service_request_id,
            result.id,
            payload.loinc_code || "30745-4",
            payload.loinc_display || "Radiology study",
            cleanText,
            result?.issued || new Date(),
          ]
        );

        console.log(`✅ Observation berhasil dikirim: ${result.id}`);

      } catch (obsErr) {
        console.error("❌ Observation gagal dikirim:", obsErr.message);
        // Tidak throw agar save hasil tetap berhasil
      }
    } else {
      console.log("ℹ️ Observation sudah pernah dikirim, skip.");
    }

    return res.json({
      success: true,
      message: "Hasil bacaan berhasil disimpan",
      observation_sent: !existingObs?.observation_uuid,
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
    const { registry_id, ct_scan_id, ct_scan_dtl_id } = req.body;

    if (!registry_id || !ct_scan_dtl_id) {
      throw new Error("registry_id dan ct_scan_dtl_id wajib");
    }

    // Guard duplikasi
    const [[existing]] = await connERM.query(
      `SELECT diagnostic_report_uuid 
       FROM satusehat_diagnostic_report 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (existing?.diagnostic_report_uuid) {
      return res.status(400).json({
        success: false,
        message: "DiagnosticReport sudah pernah dikirim"
      });
    }

    const payload = await buildPayloadFromDB(registry_id, ct_scan_dtl_id);

    // Ambil Observation & ImagingStudy
    const [[obs]] = await connERM.query(
      `SELECT observation_uuid FROM satusehat_observation 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    const [[img]] = await connERM.query(
      `SELECT imaging_study_uuid FROM satusehat_imaging_study 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!obs?.observation_uuid) throw new Error("Observation belum tersedia");
    if (!img?.imaging_study_uuid) throw new Error("ImagingStudy belum tersedia");

    let result;
    if (process.env.DEBUG_SATUSEHAT === "true") {
      console.log("DEBUG MODE: Skip DiagnosticReport API");
      result = { id: `DEBUG-DIAG-${Date.now()}`, status: "final" };
    } else {
      result = await sendDiagnosticToSatuSehat(
        payload,
        obs.observation_uuid,
        img.imaging_study_uuid,
        process.env.ORGANIZATION_ID
      );
    }

    // Simpan ke ERM
    await connERM.query(
      `
      INSERT INTO satusehat_diagnostic_report
      (registry_id, ct_scan_id, ct_scan_dtl_id, service_request_uuid, 
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
        ct_scan_id,
        ct_scan_dtl_id,
        payload.service_request_id,
        result.id,
        result.status || "final",
        payload.hasil_bacaan
      ]
    );

    // Update status lokal menjadi DONE
    await connLokal.query(
      `UPDATE radar_ctscan 
       SET status = 'done', updated_at = NOW() 
       WHERE registry_id = ? AND ct_scan_dtl_id = ?`,
      [registry_id, ct_scan_dtl_id]
    );

    res.json({
      success: true,
      message: "DiagnosticReport berhasil dikirim dan status DONE",
      diagnostic_report_id: result.id
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