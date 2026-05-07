const dbUtama = require("../../db/connection-avesina");
const dbERM = require("../../db/connection-erm");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { buildServiceRequest } = require("../../services/satusehat/builders/serviceRequestBuilder");
const { buildImagingStudy } = require("../../services/satusehat/builders/imagingStudyBuilder");

const { satusehatClient } = require("../../services/satusehat/satusehatClient");

const { generateUID } = require("../../services/satusehat/builders");
const {
  sendImagingStudyToSatuSehat,
  sendObservationToSatuSehat,
  sendDiagnosticToSatuSehat,
} = require("../../services/satusehat/sender");

const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

// ==============================
// HELPER: BUILD WHERE
// ==============================
const buildWhere = ({ tgl, role, expert_id }) => {
  let conditions = [];
  let params = [];

  if (tgl) {
    conditions.push("DATE(uv.unit_visit_dt) = ?");
    params.push(tgl);
  }

  if (role === "radiolog" && expert_id) {
    conditions.push("xrh.expert = ?");
    params.push(expert_id);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { where, params };
};

// ==============================
// GET DATA MONITORING + SIRAD
// ==============================
exports.getData = async (req, res) => {
  try {
    const { peg_id, role, tgl } = req.query;

    let expert_id = null;

    // ======================
    // MAP DOKTER LOGIN
    // ======================
    if (role === "radiolog") {
      const [[map]] = await dbLokal.promise().query(
        `SELECT employee_id 
         FROM sdm_pegawai 
         WHERE id = ? LIMIT 1`,
        [peg_id],
      );

      if (!map) {
        throw new Error("Mapping radiolog belum diset");
      }

      expert_id = map.employee_id;
    }

    const { where, params } = buildWhere({ tgl, role, expert_id });

    // ======================
    // DATA UTAMA
    // ======================
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

        GROUP_CONCAT(DISTINCT ms.medical_service_name 
          ORDER BY ms.medical_service_name SEPARATOR ', ') AS tindakan,

        MAX(xrd.photo_reading) AS photo_reading

      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN x_ray_hdr xrh ON uv.unit_visit_id = xrh.unit_visit_id

      LEFT JOIN x_ray_dtl xrd ON xrh.x_ray_id = xrd.x_ray_id
      LEFT JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id

      LEFT JOIN employee e ON xrh.physician = e.employee_id
      LEFT JOIN employee e2 ON xrh.expert = e2.employee_id

      ${where}

      GROUP BY xrh.x_ray_id
      ORDER BY xrh.measured_dt ASC
    `,
      params,
    );

    if (utama.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // ======================
    // COLLECT IDS
    // ======================
    const registryIds = utama.map((u) => u.registry_id);

    // ======================
    // DATA LOKAL
    // ======================
    const [lokal] = await dbLokal.promise().query(
      `
      SELECT * FROM sirad_xray
      WHERE is_active = 1
      AND registry_id IN (?)
    `,
      [registryIds],
    );

    const mapLokal = Object.fromEntries(lokal.map((l) => [l.registry_id, l]));

    // ======================
    // DATA SATUSEHAT
    // ======================
    const [ss] = await dbERM.promise().query(
      `
      SELECT 
        s.registry_id,

        s.patient_ihs_number IS NOT NULL AS has_ihs_number,
        s.encounter_uuid IS NOT NULL AS has_encounter,
        sr.service_request_uuid IS NOT NULL AS has_service_request,
        isy.registry_id IS NOT NULL AS has_imaging,
        dr.registry_id IS NOT NULL AS has_report,
        obs.registry_id IS NOT NULL AS has_observation

      FROM satusehat s
      LEFT JOIN satusehat_service_request sr ON sr.registry_id = s.registry_id
      LEFT JOIN satusehat_imaging_study isy ON isy.registry_id = s.registry_id
      LEFT JOIN satusehat_diagnostic_report dr ON dr.registry_id = s.registry_id
      LEFT JOIN satusehat_observation obs ON obs.registry_id = s.registry_id

      WHERE s.registry_id IN (?)
      GROUP BY s.registry_id
    `,
      [registryIds],
    );

    const mapSS = Object.fromEntries(
      ss.map((s) => [
        s.registry_id,
        {
          ihs_number: !!s.has_ihs_number,
          encounter: !!s.has_encounter,
          service_request: !!s.has_service_request,
          imaging: !!s.has_imaging,
          report: !!s.has_report,
          observation: !!s.has_observation,
        },
      ]),
    );

    // ======================
    // MAPPING SNOMED & LOINC
    // ======================
    const tindakanSet = new Set();

    utama.forEach((u) => {
      u.tindakan?.split(",").forEach((t) => {
        tindakanSet.add(t.trim());
      });
    });

    const tindakanList = [...tindakanSet];

    let mapTindakan = {};

    if (tindakanList.length > 0) {
      const [mapping] = await dbERM.promise().query(
        `
        SELECT 
          local_display,
          snomed_code,
          snomed_display,
          loinc_code,
          loinc_display
        FROM satusehat_mapping
        WHERE local_display IN (?)
      `,
        [tindakanList],
      );

      mapTindakan = Object.fromEntries(
        mapping.map((m) => [m.local_display, m]),
      );
    }

    // ======================
    // FINAL RESULT
    // ======================
    const result = utama.map((u) => {
      const l = mapLokal[u.registry_id] || {};
      const s = mapSS[u.registry_id] || {};

      const isRead = !!u.photo_reading;

      const tindakanArr = u.tindakan?.split(",") || [];

      const tindakan_mapping = tindakanArr.map((t) => {
        const key = t.trim();
        const map = mapTindakan[key] || {};

        return {
          nama: key,
          snomed_code: map.snomed_code || null,
          snomed_display: map.snomed_display || null,
          loinc_code: map.loinc_code || null,
          loinc_display: map.loinc_display || null,
        };
      });

      return {
        ...u,

        foto1: l.foto1 ? `/uploads/xray/${l.foto1}` : null,
        foto2: l.foto2 ? `/uploads/xray/${l.foto2}` : null,
        keluhan: l.keluhan || "-",

        dr_pemeriksa: u.dr_pemeriksa || "- Belum diset Radiografer -",

        hasil_bacaan: u.photo_reading || l.hasil_bacaan || null,

        status: l.status || "none",
        is_final: isRead,

        tindakan_mapping,

        satu_sehat: {
          patient: !!s.ihs_number,
          encounter: !!s.encounter,
          service_request: !!s.service_request,
          imaging: !!s.imaging,
          report: !!s.report,
          observation: !!s.observation,
        },
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("GET DATA SIRAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Gagal ambil data",
    });
  }
};

// ==============================
// GET DETAIL X-RAY
// ==============================
exports.getDetail = async (req, res) => {
  try {
    const { registry_id } = req.params;

    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        xrh.x_ray_id,
        xrd.x_ray_dtl_id,
        p.patient_nm,
        p.mr_code,
        xrh.measured_dt,
        GROUP_CONCAT(ms.medical_service_name SEPARATOR ', ') AS tindakan,
        xrd.photo_reading,
        xrh.physician AS pengirim_id,
        xrh.expert AS pemeriksa_id,
        e.employee_nm AS pengirim,
        e2.employee_nm AS radiolog
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN x_ray_hdr xrh ON uv.unit_visit_id = xrh.unit_visit_id
      JOIN x_ray_dtl xrd ON xrh.x_ray_id = xrd.x_ray_id
      LEFT JOIN employee e ON xrh.physician = e.employee_id
      LEFT JOIN employee e2 ON xrh.expert = e2.employee_id
      JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id
      WHERE r.registry_id = ?
      LIMIT 1
    `,
      [registry_id],
    );

    const [[lokal]] = await dbLokal.promise().query(
      `
      SELECT * FROM sirad_xray 
      WHERE registry_id = ? AND is_active = 1
      LIMIT 1
    `,
      [registry_id],
    );

    const isRead = !!utama.photo_reading;
    const isDicom = lokal?.foto1?.toLowerCase().endsWith(".dcm");

    res.json({
      success: true,
      data: {
        ...utama,

        dicom_path: lokal?.dicom_path
        ? `/uploads/xray/${lokal.dicom_path}`
        : null,
      
        foto1: lokal?.foto1 ? `/uploads/xray/${lokal.foto1}` : null,
        foto2: lokal?.foto2 ? `/uploads/xray/${lokal.foto2}` : null,

        keluhan: lokal?.keluhan ? lokal.keluhan : "-",
        // fallback
        hasil_bacaan: utama.photo_reading || lokal?.hasil_bacaan || null,

        //status: isRead ? "done" : lokal?.status || "none",
        status: isRead ? "done" : lokal?.status || "none",

        is_final: isRead,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
};

exports.requestXRay = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  try {
    const { registry_id, pengirim_id, pemeriksa_id, keluhan } = req.body;

    if (!registry_id) throw new Error("registry_id wajib");

    await connLokal.beginTransaction();
    await connERM.beginTransaction();

    // =========================
    // AMBIL DATA UTAMA + IHS
    // =========================
    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        xrh.x_ray_id,
        r.registry_dt,
        uv.unit_visit_dt,

        -- PASIEN
        p.mr_code,
        p.patient_nm,
        ss.patient_ihs_number AS patient_ihs,

        -- PENGIRIM
        e.employee_id AS pengirim_id,
        e.employee_nm AS pengirim_nm,
        e.satusehat_ihs_number AS pengirim_ihs,

        -- PEMERIKSA
        e2.employee_id AS pemeriksa_id,
        e2.employee_nm AS pemeriksa_nm,
        e2.satusehat_ihs_number AS pemeriksa_ihs,

        -- ENCOUNTER
        ss.encounter_uuid

      FROM avesina_wj.registry r
      JOIN avesina_wj.patient p 
        ON r.mr_id = p.mr_id

      JOIN avesina_wj.unit_visit uv 
        ON uv.registry_id = r.registry_id

      JOIN avesina_wj.x_ray_hdr xrh 
        ON xrh.unit_visit_id = uv.unit_visit_id

      LEFT JOIN avesina_wj.employee e 
        ON e.employee_id = xrh.physician

      LEFT JOIN avesina_wj.employee e2 
        ON e2.employee_id = xrh.expert

      JOIN erm_rswj.satusehat ss 
        ON ss.registry_id = r.registry_id

      WHERE r.registry_id = ?
      LIMIT 1
    `,
      [registry_id],
    );

    if (!utama) throw new Error("Data tidak ditemukan");

    if (!utama.patient_ihs) {
      throw new Error("Patient belum punya IHS Number");
    }

    if (!utama.pengirim_ihs) {
      throw new Error("Pengirim belum punya IHS");
    }

    if (!utama.pemeriksa_ihs) {
      throw new Error("Pemeriksa belum punya IHS");
    }

    // =========================
    // AMBIL MAPPING TINDAKAN
    // =========================
    const [[mapping]] = await dbERM.promise().query(`
      SELECT loinc_code, loinc_display, modality
      FROM satusehat_mapping
      WHERE local_display = 'Thorax'
      LIMIT 1
    `);

    // fallback kalau belum ada mapping
    const loinc_code = mapping?.loinc_code || "30745-4";
    const loinc_display = mapping?.loinc_display || "Chest X-ray study";

    // =========================
    // BUILD PAYLOAD
    // =========================
    const payload = buildServiceRequest({
      patient_ihs: utama.patient_ihs,
      encounter_uuid: utama.encounter_uuid,
      pengirim_ihs: utama.pengirim_ihs,
      pemeriksa_ihs: utama.pemeriksa_ihs,
      tanggal: utama.unit_visit_dt,
      loinc_code,
      loinc_display,
    });

    // =========================
    // DEBUG: CEK DATA
    // =========================
    console.log("===== DEBUG SERVICE REQUEST =====");
    console.log("Registry ID:", registry_id);

    console.log("Patient IHS:", utama.patient_ihs);
    console.log("Pengirim IHS:", utama.pengirim_ihs);
    console.log("Pemeriksa IHS:", utama.pemeriksa_ihs);
    console.log("Encounter:", utama.encounter_uuid);

    console.log("LOINC:", loinc_code, "-", loinc_display);

    console.log("Payload:");
    console.dir(payload, { depth: null });

    console.log("================================");

    // =========================
    // HIT SATUSEHAT
    // =========================
    let serviceRequestUUID = null;

    if (process.env.DEBUG_SATUSEHAT === "true") {
      console.log("DEBUG MODE: Skip hit SATUSEHAT");

      serviceRequestUUID = "DEBUG-" + Date.now(); // dummy biar flow tetap jalan
    } else {
      const response = await satusehatClient.post("/ServiceRequest", payload);
      serviceRequestUUID = response.data.id;
    }

    // =========================
    // SIMPAN KE ERM
    // =========================
    await connERM.query(
      `
      INSERT INTO satusehat_service_request
      (registry_id, service_request_uuid, code, display, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        service_request_uuid = VALUES(service_request_uuid),
        code = VALUES(code),
        display = VALUES(display),
        status = VALUES(status),
        updated_at = NOW()
    `,
      [registry_id, serviceRequestUUID, loinc_code, loinc_display, "active"],
    );

    // =========================
    // SIMPAN KE LOKAL (SIRAD)
    // =========================
    await connLokal.query(
      `
      INSERT INTO sirad_xray
      (registry_id, x_ray_id, x_ray_dtl_id, service_request_id, status, ordered_by, ordered_at, created_at, keluhan)
      VALUES (?, ?, ?, ?, 'ordered', ?, NOW(), NOW(), ?)
      ON DUPLICATE KEY UPDATE
        service_request_id = VALUES(service_request_id),
        status = 'ordered',
        ordered_by = VALUES(ordered_by),
        ordered_at = NOW()
    `,
      [registry_id, utama.x_ray_id, utama.x_ray_dtl_id, serviceRequestUUID, pengirim_id, keluhan],
    );

    await connLokal.commit();
    await connERM.commit();

    res.json({
      success: true,
      message: "ServiceRequest berhasil dibuat",
      service_request_id: serviceRequestUUID,
    });
    
  } catch (err) {
    console.error("PROSES XRAY ERROR:", err.response?.data || err.message);

    try {
      if (
        connLokal &&
        connLokal.connection &&
        connLokal.connection._closing !== true
      ) {
        await connLokal.rollback();
      }
    } catch (e) {
      console.error("Rollback Lokal gagal:", e.message);
    }

    try {
      if (
        connERM &&
        connERM.connection &&
        connERM.connection._closing !== true
      ) {
        await connERM.rollback();
      }
    } catch (e) {
      console.error("Rollback ERM gagal:", e.message);
    }

    res.status(500).json({
      success: false,
      message: err.response?.data?.issue?.[0]?.diagnostics || err.message,
    });
  } finally {
    try {
      connLokal?.release();
    } catch (_) {}

    try {
      connERM?.release();
    } catch (_) {}
  }
};

// ==============================
// UPLOAD X-RAY
// ==============================
exports.uploadXRay = async (req, res) => {
  const conn = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  let inTransaction = false;

  try {
    const { registry_id, x_ray_id, created_by } = req.body;
    
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // =========================
    // 1. CEK FINAL AVESINA
    // =========================
    const [[cekUtama]] = await dbUtama.promise().query(
      `
      SELECT photo_reading 
      FROM x_ray_dtl 
      WHERE x_ray_id = ?
      LIMIT 1
    `,
      [x_ray_id],
    );

    const isFinal = !!cekUtama?.photo_reading;

    // =========================
    // 2. AMBIL DATA LOKAL
    // =========================
    const [existing] = await conn.query(
      `SELECT * FROM sirad_xray WHERE registry_id = ? AND is_active = 1`,
      [registry_id],
    );

    if (existing.length === 0) {
      throw new Error("Data belum di-request");
    }

    const data = existing[0];

    // =========================
    // 4a. CEK SERVICE REQUEST
    // =========================
    const [[sr]] = await connERM.query(
      `
      SELECT service_request_uuid 
      FROM satusehat_service_request
      WHERE registry_id = ?
      LIMIT 1
    `,
      [registry_id],
    );

    if (!sr) {
      return res.status(400).json({
        success: false,
        message: "ServiceRequest belum dibuat",
      });
    }

    // =========================
    // 4b. CEK DETAIL XRAY
    // =========================
    const [[detail]] = await connERM.query(
      `
      SELECT 
        r.registry_id,
        xrh.measured_dt,
        ss.patient_ihs_number AS patient_ihs,
        ss.encounter_uuid,
        e.satusehat_ihs_number AS practitioner_ihs
      FROM avesina_wj.registry r
      JOIN avesina_wj.unit_visit uv ON uv.registry_id = r.registry_id
      JOIN avesina_wj.x_ray_hdr xrh ON xrh.unit_visit_id = uv.unit_visit_id
      LEFT JOIN avesina_wj.employee e ON e.employee_id = xrh.expert
      LEFT JOIN erm_rswj.satusehat ss ON ss.registry_id = r.registry_id
      WHERE r.registry_id = ?
      LIMIT 1
      `,
      [registry_id]
    );

    if (!detail) {
      throw new Error("Detail X-Ray tidak ditemukan");
    }

    if (
      !detail.patient_ihs ||
      !detail.encounter_uuid ||
      !detail.practitioner_ihs ||
      !detail.measured_dt
    ) {
      throw new Error("Data SatuSehat belum lengkap");
    }

    // =========================
    // 3. UPDATE FILE (JIKA BELUM FINAL)
    // =========================
    //if (!isFinal) {
      await conn.beginTransaction();
      inTransaction = true;

      //const foto1 = req.files?.foto1?.[0]?.filename || null;
      //const foto2 = req.files?.foto2?.[0]?.filename || null;

      const dicom = req.files?.dicom?.[0];

      if (!dicom) {
        throw new Error("File DICOM tidak diterima");
      }

      const dicomPath = dicom.path;

      // ==========================
      // GENERATE THUMBNAIL
      // ==========================
      const thumbName = `thumb_${Date.now()}.jpg`;
      const thumbFullPath = path.join(__dirname, "../../uploads/xray", thumbName);

      const thumb = dicomToJpg(dicomPath, thumbFullPath);

      if (!thumb.success) {
        console.warn("Thumbnail gagal:", thumb.message);
      }

      const basePath = path.join(__dirname, "../../uploads/xray");

      // DICOM PARSER
      /*let dicomMeta = null;
      if (foto1) {
        const filePath = path.join(basePath, foto1);
        dicomMeta = parseDicomUID(filePath);
        console.log("DICOM META:", dicomMeta);
      }*/
      const dicomMeta = parseDicomUID(dicomPath);

      console.log("DICOM META:", dicomMeta);

      if (!dicomMeta?.studyUID) {
        throw new Error("File bukan DICOM valid / UID tidak ditemukan");
      }

      // hapus lama jika diganti
      /*if (foto1 && data.foto1) {
        const oldPath = path.join(basePath, data.foto1);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Gagal hapus file:", err);
          });
        }
      }

      if (foto2 && data.foto2) {
        const oldPath = path.join(basePath, data.foto2);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Gagal hapus file:", err);
          });
        }
      }*/

      await conn.query(
        `
        UPDATE sirad_xray
        SET 
          dicom_path = ?, 
          foto1 = ?, 
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
        WHERE registry_id = ?
      `,
        [
          dicom.filename,
          thumb.success ? thumbName : null,
          created_by,
          registry_id,
        ]
      );

      await conn.commit();
      inTransaction = false;
    //}

    // =========================
    // AMBIL TINDAKAN + MODALITY
    // =========================
    const [[tindakanData]] = await dbUtama.promise().query(
      `
      SELECT ms.medical_service_name
      FROM x_ray_hdr xrh
      JOIN x_ray_dtl xrd ON xrd.x_ray_id = xrh.x_ray_id
      JOIN medical_service ms ON ms.medical_service_id = xrd.medical_service_id
      WHERE xrh.x_ray_id = ?
      LIMIT 1
    `,
      [x_ray_id]
    );

    let modality = "CR"; // default fallback

    if (tindakanData?.medical_service_name) {
      const [[mapping]] = await connERM.query(
        `
        SELECT modality
        FROM satusehat_mapping
        WHERE local_display = ?
        LIMIT 1
      `,
        [tindakanData.medical_service_name]
      );

      if (mapping?.modality) {
        modality = mapping.modality;
      }
    }

    // =========================
    // 5. BUILD IMAGING STUDY
    // =========================

    // SEMENTARA DIMATIKAN GENERATE UID
    //const uid = generateUID(process.env.ORGANIZATION_ID);

    if (!dicomMeta?.studyUID) {
      throw new Error("DICOM UID tidak ditemukan");
    }
    
    const uid = {
      study: dicomMeta.studyUID,
      series: dicomMeta.seriesUID,
      instance: dicomMeta.sopUID,
    };

    // ==========================
    // SIMPAN UID KE DB
    // ==========================
    await conn.query(
      `
      UPDATE sirad_xray
      SET 
        uid_study = ?,
        uid_series = ?,
        uid_instance1 = ?
      WHERE registry_id = ?
    `,
      [
        uid.study,
        uid.series,
        uid.instance1,
        registry_id,
      ]
    );

    const normalized = {
      ...detail,
      patient_id: detail.patient_ihs,
      encounter_id: detail.encounter_uuid,
      doctor_id: detail.practitioner_ihs,
      service_request_id: sr.service_request_uuid,
      no_reg: detail.registry_id,
    };

    const imagingPayload = buildImagingStudy(
      normalized,
      uid,
      process.env.ORGANIZATION_ID,
      sr.service_request_uuid
    );

    // =========================
    // 6. HIT SATUSEHAT (DEBUG MODE SUPPORT)
    // =========================
    console.log("===== IMAGING STUDY (PROD) =====");
    console.log("Registry ID:", registry_id);
    console.log("Patient:", normalized.patient_id);
    console.log("Encounter:", normalized.encounter_id);
    console.log("ServiceRequest:", sr.service_request_uuid);
    console.log("Measured Date:", normalized.measured_dt);

    console.log("Payload:");
    console.dir(imagingPayload, { depth: null });
    console.log("================================");

    let imagingId = null;
    let imagingStatus = "available";

    console.log("Payload:");
    console.dir(imagingPayload, { depth: null });
    console.log("================================");
    console.log("DEBUG_SATUSEHAT ENV:", process.env.DEBUG_SATUSEHAT);

    if (process.env.DEBUG_SATUSEHAT === "true") {
      console.log("DEBUG MODE: Skip hit SATUSEHAT (ImagingStudy)");
      imagingId = "DEBUG-" + Date.now();
    } else {
      const imagingRes = await satusehatClient.post("/ImagingStudy", imagingPayload);

      imagingId = imagingRes.data.id;
      imagingStatus = imagingRes.data.status || "available";
    }

    // =========================
    // 7. SIMPAN KE ERM
    // =========================
    await connERM.query(
      `
      INSERT INTO satusehat_imaging_study
      (registry_id, service_request_uuid, imaging_study_uuid, modality, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        imaging_study_uuid = VALUES(imaging_study_uuid),
        modality = VALUES(modality),
        status = VALUES(status),
        updated_at = NOW()
    `,
      [
        registry_id,
        sr.service_request_uuid,
        imagingId,
        modality,
        imagingStatus,
      ]
    );

    // =========================
    // 8. RESPONSE
    // =========================
    return res.json({
      success: true,
      is_final: isFinal,
      message: isFinal
        ? "Data sudah final, upload dilewati, ImagingStudy tetap dikirim"
        : "Upload & kirim ImagingStudy berhasil",
    });

  } catch (err) {
    if (inTransaction) await conn.rollback();

    console.error("UPLOAD X-RAY ERROR:");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DETAIL:");
      console.dir(err.response.data, { depth: null });
    } else {
      console.error("ERROR:", err.message);
    }

    return res.status(500).json({
      success: false,
      message:
        err.response?.data?.issue?.[0]?.diagnostics ||
        err.message ||
        "Gagal upload X-Ray",
    });
  } finally {
    conn.release();
    connERM.release();
  }
};

exports.sendImagingStudy = async (req, res) => {
  try {
    const { registry_id } = req.body;

    const payload = await buildPayloadFromDB(registry_id);

    const result = await sendImagingStudyToSatuSehat(
      payload,
      process.env.ORGANIZATION_ID
    );

    res.json({
      success: true,
      message: "ImagingStudy terkirim",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// UPDATE HASIL X-RAY (RADIOLOG)
// ==============================
exports.saveHasil = async (req, res) => {
  const conn = await dbLokal.promise().getConnection();
  const connUtama = await dbUtama.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  try {
    await conn.beginTransaction();
    await connUtama.beginTransaction();

    const { registry_id, hasil_bacaan, read_by } = req.body;

    if (!registry_id) throw new Error("registry_id wajib diisi");
    if (!hasil_bacaan) throw new Error("hasil_bacaan wajib diisi");

    // ==========================
    // AMBIL DATA LOKAL
    // ==========================
    const [[lokalData]] = await conn.query(
      `
      SELECT x_ray_id
      FROM sirad_xray
      WHERE registry_id = ?
      AND is_active = 1
      LIMIT 1
      `,
      [registry_id]
    );

    if (!lokalData) throw new Error("Data lokal tidak ditemukan");

    // ==========================
    // CEK STATUS FOTO
    // ==========================
    const [[existing]] = await conn.query(
      `
      SELECT id, status 
      FROM sirad_xray 
      WHERE registry_id = ? 
      AND is_active = 1
      LIMIT 1
      `,
      [registry_id]
    );

    if (!existing) throw new Error("Data X-Ray belum diupload");
    if (existing.status === "none") throw new Error("Foto belum diupload");

    // ==========================
    // CEK AVESINA
    // ==========================
    const [[cekUtama]] = await dbUtama.promise().query(
      `
      SELECT photo_reading 
      FROM x_ray_dtl 
      WHERE x_ray_id = ?
      LIMIT 1
      `,
      [lokalData.x_ray_id]
    );

    // ==========================
    // UPDATE AVESINA (JIKA BELUM ADA)
    // ==========================
    if (!cekUtama?.photo_reading) {
      await connUtama.query(
        `
        UPDATE x_ray_dtl
        SET photo_reading = ?
        WHERE x_ray_id = ?
        `,
        [hasil_bacaan, lokalData.x_ray_id]
      );
    }

    // ==========================
    // UPDATE LOKAL
    // ==========================
    const [updateResult] = await conn.query(
      `
      UPDATE sirad_xray
      SET 
        hasil_bacaan = ?,
        status = 'read',
        updated_at = NOW(),
        read_by = ?,
        read_at = NOW()
      WHERE registry_id = ?
      `,
      [hasil_bacaan, read_by, registry_id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Gagal update data");
    }

    // ==========================
    // COMMIT DULU (PENTING)
    // ==========================
    await conn.commit();
    await connUtama.commit();

    // ==========================
    // OBSERVATION (POST-COMMIT)
    // ==========================
    try {
      const payload = await buildPayloadFromDB(registry_id);

      const cleanText = payload.hasil_bacaan
        ?.replace(/\r\n/g, "\n")
        ?.replace(/\n{3,}/g, "\n\n")
        ?.trim();

      let result;

      if (process.env.DEBUG_SATUSEHAT === "true") {
        console.log("DEBUG MODE: Skip Observation API");
        result = { id: "DEBUG-" + Date.now(), status: "final" };
      } else {
        result = await sendObservationToSatuSehat({
          ...payload,
          hasil_bacaan: cleanText,
        });
      }

      // ambil mapping loinc
      const [[map]] = await connERM.query(`
        SELECT loinc_code, loinc_display
        FROM satusehat_mapping
        WHERE local_display = 'Thorax'
        LIMIT 1
      `);

      await connERM.query(
        `
        INSERT INTO satusehat_observation
        (registry_id, service_request_uuid, observation_uuid, code, display, value_text, issued_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
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
          payload.service_request_id,
          result.id,
          map?.loinc_code || "30745-4",
          map?.loinc_display || "Chest X-ray study",
          cleanText,
          result?.issued || new Date(),
        ]
      );

      console.log("Observation tersimpan:", result.id);

    } catch (obsErr) {
      console.error("Observation gagal:", obsErr.message);
    }

    return res.json({
      success: true,
      message: "Hasil bacaan tersimpan & Observation diproses",
    });

  } catch (err) {
    await conn.rollback();
    await connUtama.rollback();

    console.error("SAVE HASIL ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });

  } finally {
    conn.release();
    connUtama.release();
    connERM.release();
  }
};

exports.sendObservation = async (req, res) => {
  try {
    const { registry_id } = req.body;

    // =========================
    // 0. GUARD AGAR TIDAK KIRIM LAGI
    // =========================
    const [[cek]] = await dbERM.promise().query(
      `SELECT observation_uuid 
       FROM satusehat_observation 
       WHERE registry_id = ? LIMIT 1`,
      [registry_id]
    );
    
    if (cek?.observation_uuid) {
      throw new Error("Observation sudah pernah dikirim");
    }

    const payload = await buildPayloadFromDB(registry_id);

    const cleanText = payload.hasil_bacaan
      ?.replace(/\r\n/g, "\n")
      ?.replace(/\n{3,}/g, "\n\n")
      ?.trim();

    console.log("===== OBSERVATION DEBUG =====");
    console.log("Registry:", registry_id);
    console.log("Patient:", payload.patient_ihs);
    console.log("Encounter:", payload.encounter_uuid);
    console.log("Practitioner:", payload.practitioner_ihs);
    console.log("Payload:");
    console.dir(payload, { depth: null });
    console.log("================================");

    let result;

    if (process.env.DEBUG_SATUSEHAT === "true") {
      console.log("DEBUG MODE: Skip hit SATUSEHAT (Observation)");

      result = {
        id: "DEBUG-" + Date.now(),
        status: "final",
      };
    } else {
      result = await sendObservationToSatuSehat({
        ...payload,
        hasil_bacaan: cleanText,
      });
    }

    res.json({
      success: true,
      message: "Observation processed (debug aware)",
      data: result,
    });
  } catch (err) {
    console.error("OBS ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message:
        err.response?.data?.issue?.[0]?.diagnostics ||
        err.message,
    });
  }
};

exports.sendDiagnostic = async (req, res) => {
  const connERM = await dbERM.promise().getConnection();
  const connLokal = await dbLokal.promise().getConnection();
  
  try {
    const { registry_id } = req.body;

    if (!registry_id) {
      throw new Error("registry_id wajib");
    }

    // =========================
    // 0. GUARD AGAR TIDAK KIRIM LAGI
    // =========================
    const [[cek]] = await dbERM.promise().query(
      `SELECT diagnostic_report_uuid 
       FROM satusehat_diagnostic_report 
       WHERE registry_id = ? LIMIT 1`,
      [registry_id]
    );
    
    if (cek?.diagnostic_report_uuid) {
      return res.status(400).json({
        success: false,
        message: "DiagnosticReport sudah pernah dikirim",
      });
    }

    // =========================
    // 1. AMBIL PAYLOAD UTAMA
    // =========================
    const payload = await buildPayloadFromDB(registry_id);

    // =========================
    // 2. AMBIL UUID RELASI
    // =========================
    const [[obs]] = await dbERM.promise().query(
      `
      SELECT observation_uuid 
      FROM satusehat_observation
      WHERE registry_id = ?
      LIMIT 1
      `,
      [registry_id]
    );

    const [[img]] = await dbERM.promise().query(
      `
      SELECT imaging_study_uuid 
      FROM satusehat_imaging_study
      WHERE registry_id = ?
      LIMIT 1
      `,
      [registry_id]
    );

    // =========================
    // 3. VALIDASI
    // =========================
    if (!obs?.observation_uuid) {
      throw new Error("Observation belum tersedia");
    }

    if (!img?.imaging_study_uuid) {
      throw new Error("ImagingStudy belum tersedia");
    }

    if (!payload.service_request_id) {
      throw new Error("ServiceRequest belum tersedia");
    }

    console.log("===== DIAGNOSTIC DEBUG =====");
    console.log("Registry:", registry_id);
    console.log("Observation:", obs.observation_uuid);
    console.log("Imaging:", img.imaging_study_uuid);
    console.log("ServiceRequest:", payload.service_request_id);
    console.log("================================");

    let result;

    if (process.env.DEBUG_SATUSEHAT === "true") {
      console.log("DEBUG MODE: Skip DiagnosticReport API");

      result = {
        id: "DEBUG-" + Date.now(),
        status: "final",
      };
    } else {
      result = await sendDiagnosticToSatuSehat(
        payload,
        obs.observation_uuid,
        img.imaging_study_uuid,
        process.env.ORGANIZATION_ID
      );
    }

    // ==========================
    // SIMPAN KE ERM
    // ==========================
    await connERM.query(
      `
      INSERT INTO satusehat_diagnostic_report
      (registry_id, service_request_uuid, diagnostic_report_uuid, status, conclusion, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        diagnostic_report_uuid = VALUES(diagnostic_report_uuid),
        status = VALUES(status),
        conclusion = VALUES(conclusion),
        updated_at = NOW()
      `,
      [
        registry_id,
        payload.service_request_id,
        result.id,
        result.status || "final",
        payload.hasil_bacaan,
      ]
    );

    console.log("DiagnosticReport tersimpan:", result.id);

    // ==========================
    // UPDATE STATUS LOKAL → DONE
    // ==========================
    await connLokal.query(
      `
      UPDATE sirad_xray
      SET status = 'done',
          updated_at = NOW()
      WHERE registry_id = ?
      `,
      [registry_id]
    );

    console.log("Status sirad_xray → DONE");

    // ==========================
    // RESPONSE
    // ==========================
    res.json({
      success: true,
      message: "DiagnosticReport berhasil & status DONE",
      data: result,
    });

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message:
        err.response?.data?.issue?.[0]?.diagnostics ||
        err.message,
    });
  } finally {
    connERM.release();
    connLokal.release();
  }
};

const buildPayloadFromDB = async (registry_id) => {
  if (!registry_id) {
    throw new Error("registry_id wajib");
  }

  // =========================
  // 1. DATA UTAMA
  // =========================
  const [[utama]] = await dbUtama.promise().query(
    `
    SELECT 
      r.registry_id,
      xrd.photo_reading,
      xrh.measured_dt,
      xrh.expert
    FROM registry r
    JOIN unit_visit uv ON uv.registry_id = r.registry_id
    JOIN x_ray_hdr xrh ON xrh.unit_visit_id = uv.unit_visit_id
    JOIN x_ray_dtl xrd ON xrd.x_ray_id = xrh.x_ray_id
    WHERE r.registry_id = ?
    LIMIT 1
    `,
    [registry_id]
  );

  if (!utama) throw new Error("Data utama tidak ditemukan");

  // =========================
  // 2. SATUSEHAT (PATIENT + ENCOUNTER)
  // =========================
  const [[ss]] = await dbERM.promise().query(
    `
    SELECT patient_ihs_number, encounter_uuid 
    FROM satusehat 
    WHERE registry_id = ?
    LIMIT 1
    `,
    [registry_id]
  );

  if (!ss) throw new Error("Data SatuSehat tidak ditemukan");

  // =========================
  // 3. SERVICE REQUEST
  // =========================
  const [[sr]] = await dbERM.promise().query(
    `
    SELECT service_request_uuid
    FROM satusehat_service_request
    WHERE registry_id = ?
    LIMIT 1
    `,
    [registry_id]
  );

  if (!sr?.service_request_uuid) {
    throw new Error("ServiceRequest tidak ditemukan");
  }

  // =========================
  // 4. PRACTITIONER
  // =========================
  const [[dokter]] = await dbUtama.promise().query(
    `
    SELECT satusehat_ihs_number 
    FROM employee 
    WHERE employee_id = ?
    LIMIT 1
    `,
    [utama.expert]
  );

  if (!dokter?.satusehat_ihs_number) {
    throw new Error("Practitioner IHS tidak ditemukan");
  }

  // =========================
  // 5. VALIDASI
  // =========================
  if (!ss.patient_ihs_number) {
    throw new Error("Patient IHS tidak ditemukan");
  }

  if (!ss.encounter_uuid) {
    throw new Error("Encounter belum tersedia");
  }

  if (!utama.measured_dt) {
    throw new Error("Tanggal pemeriksaan tidak ada");
  }

  // =========================
  // 6. RETURN
  // =========================
  return {
    registry_id,
    hasil_bacaan: utama.photo_reading || null,
    measured_dt: utama.measured_dt,

    patient_ihs: ss.patient_ihs_number,
    encounter_uuid: ss.encounter_uuid,
    practitioner_ihs: dokter.satusehat_ihs_number,

    service_request_id: sr.service_request_uuid,
  };
};
