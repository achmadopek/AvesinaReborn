const dbUtama = require("../../db/connection-avesina");
const dbERM = require("../../db/connection-erm");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { buildServiceRequest } = require("../../services/satusehat/builders/serviceRequestBuilder");

const outboxService = require("../../services/satusehat/outboxService");

const { satusehatClient } = require("../../services/satusehat/satusehatClient");
const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

const satuSehatService = require("../../services/satusehat/satusehatService");

const {
  determineSyncAction,
} = require("../../helpers/satusehatSyncHelper");

const {
  updateResourceStatus,
} = require("../../services/satusehat/resourceStatusService");

// =============================================================
// BUILD PAYLOAD HELPER (SUDAH DI-IMPROVE)
// =============================================================
const buildPayloadFromDB = async (
  registry_id,
  x_ray_dtl_id,
  resourceType = null
) => {
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

  let encounter_uuid = null;

  const [[enc]] = await dbERM.promise().query(
    `SELECT encounter_uuid FROM satusehat WHERE registry_id = ? LIMIT 1`,
    [registry_id]
  );

  encounter_uuid = enc?.encounter_uuid || null;

  const [[sr]] = await dbERM.promise().query(
    `SELECT service_request_uuid FROM satusehat_service_request WHERE registry_id = ? AND x_ray_dtl_id = ? LIMIT 1`,
    [registry_id, x_ray_dtl_id]
  );

  const [[dokter]] = await dbUtama.promise().query(
    `SELECT satusehat_ihs_number FROM employee WHERE employee_id = ? LIMIT 1`, [utama.expert]
  );

  const missing = [];
  if (!utama?.patient_ihs_number) missing.push("Patient IHS");
  if (!dokter?.satusehat_ihs_number) missing.push("Practitioner IHS");

  // ===================================
  // COMMON
  // ===================================

  if (!utama?.patient_ihs_number) {
    missing.push("Patient IHS");
  }

  if (!dokter?.satusehat_ihs_number) {
    missing.push("Practitioner IHS");
  }

  // ===================================
  // RESOURCE DEPENDENCY
  // ===================================

  switch (resourceType) {

    case "ServiceRequest":

      if (!encounter_uuid) {
        missing.push("Encounter");
      }

      break;

    case "ImagingStudy":

      if (!encounter_uuid) {
        missing.push("Encounter");
      }

      if (!sr?.service_request_uuid) {
        missing.push("ServiceRequest");
      }

      break;

    case "Observation":

      if (!encounter_uuid) {
        missing.push("Encounter");
      }

      if (!sr?.service_request_uuid) {
        missing.push("ServiceRequest");
      }

      break;

    case "DiagnosticReport":

      if (!encounter_uuid) {
        missing.push("Encounter");
      }

      if (!sr?.service_request_uuid) {
        missing.push("ServiceRequest");
      }

      break;

  }

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

const buildSSResource = (
  row,
  uuidField
) => {
  if (!row) {
    return {
      status: "none",
      uuid: null,
      message: null,
      created_at: null,
    };
  }

  return {
    status: row.status || (
      row[uuidField]
        ? "success"
        : "unknown"
    ),

    uuid:
      row[uuidField] || null,

    message:
      row.last_error ||
      row.notes ||
      null,

    created_at:
      row.created_at || null,
  };
};

// ======================================================
// GET DATA MONITORING
// ======================================================
exports.getData = async (req, res) => {

  try {

    const {
      peg_id,
      role,
      tgl,
    } = req.query;

    let expert_id = null;

    // ==================================================
    // FILTER RADIOLOG
    // ==================================================
    if (
      role === "radiolog" &&
      peg_id
    ) {

      const [[mapPeg]] =
        await dbLokal.promise().query(
          `
          SELECT employee_id
          FROM sdm_pegawai
          WHERE id = ?
          LIMIT 1
          `,
          [peg_id]
        );

      expert_id =
        mapPeg?.employee_id || null;
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

    if (tindakanList.length > 0) {

      const [mappingRows] =
        await dbERM.promise().query(
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
          [tindakanList]
        );

      mapTindakan =
        Object.fromEntries(
          mappingRows.map((m) => [
            m.local_display,
            m,
          ])
        );
    }

    // ==================================================
    // SATUSEHAT MASTER
    // ==================================================
    const [ssRows] =
      await dbERM.promise().query(
        `
        SELECT
          registry_id,
          patient_ihs_number,
          encounter_uuid,
          patient_validation,
          last_update
        FROM satusehat
        WHERE registry_id IN (?)
        `,
        [registryIds]
      );

    const mapSS = buildMap(
      ssRows,
      (r) => r.registry_id
    );

    // ==================================================
    // SERVICE REQUEST
    // ==================================================
    const [reqRows] =
      await dbERM.promise().query(
        `
        SELECT
          registry_id,
          x_ray_dtl_id,
          service_request_uuid,
          status,
          notes,
          last_error,
          created_at
        FROM satusehat_service_request
        WHERE (registry_id, x_ray_dtl_id) IN (?)
        ORDER BY id DESC
        `,
        [registryDtlIds]
      );

    const mapReq = buildMap(
      reqRows,
      (r) =>
        `${r.registry_id}-${r.x_ray_dtl_id}`
    );

    // ==================================================
    // IMAGING
    // ==================================================
    const [imgRows] =
      await dbERM.promise().query(
        `
        SELECT
          registry_id,
          x_ray_dtl_id,
          imaging_study_uuid,
          status,
          notes,
          last_error,
          created_at
        FROM satusehat_imaging_study
        WHERE (registry_id, x_ray_dtl_id) IN (?)
        ORDER BY id DESC
        `,
        [registryDtlIds]
      );

    const mapImg = buildMap(
      imgRows,
      (r) =>
        `${r.registry_id}-${r.x_ray_dtl_id}`
    );

    // ==================================================
    // OBSERVATION
    // ==================================================
    const [obsRows] =
      await dbERM.promise().query(
        `
        SELECT
          registry_id,
          x_ray_dtl_id,
          observation_uuid,
          status,
          notes,
          last_error,
          created_at
        FROM satusehat_observation
        WHERE (registry_id, x_ray_dtl_id) IN (?)
        ORDER BY id DESC
        `,
        [registryDtlIds]
      );

    const mapObs = buildMap(
      obsRows,
      (r) =>
        `${r.registry_id}-${r.x_ray_dtl_id}`
    );

    // ==================================================
    // REPORT
    // ==================================================
    const [repRows] =
      await dbERM.promise().query(
        `
        SELECT
          registry_id,
          x_ray_dtl_id,
          diagnostic_report_uuid,
          status,
          notes,
          last_error,
          created_at
        FROM satusehat_diagnostic_report
        WHERE (registry_id, x_ray_dtl_id) IN (?)
        ORDER BY id DESC
        `,
        [registryDtlIds]
      );

    const mapRep = buildMap(
      repRows,
      (r) =>
        `${r.registry_id}-${r.x_ray_dtl_id}`
    );

    // ==================================================
    // FINAL RESULT
    // ==================================================
    const result = utama.map((u) => {

      const key =
        `${u.registry_id}-${u.x_ray_dtl_id}`;

      const lokal =
        mapLokal.get(key);

      const ss =
        mapSS.get(u.registry_id);

      return {

        ...u,

        status:
          lokal?.status || "none",

        is_final:
          !!u.photo_reading,

        is_lokal:
          !!lokal?.hasil_bacaan,

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

        satu_sehat: {

          // ====================================
          // PATIENT
          // ====================================
          patient:
            ss?.patient_ihs_number
              ? {
                  status: "success",
                  ihs_number:
                    ss.patient_ihs_number,
                }
              : {
                  status: "failed",
                  message:
                    "Patient IHS belum tersedia",
                },

          // ====================================
          // ENCOUNTER
          // ====================================
          encounter:
            ss?.encounter_uuid
              ? {
                  status: "success",
                  uuid:
                    ss.encounter_uuid,
                  created_at:
                    ss.last_update,
                }
              : {
                  status: "failed",
                  message:
                    "Encounter belum tersedia",
                },

          // ====================================
          // RESOURCE
          // ====================================
          service_request:
            buildSSResource(
              mapReq.get(key),
              "service_request_uuid"
            ),

          imaging:
            buildSSResource(
              mapImg.get(key),
              "imaging_study_uuid"
            ),

          observation:
            buildSSResource(
              mapObs.get(key),
              "observation_uuid"
            ),

          report:
            buildSSResource(
              mapRep.get(key),
              "diagnostic_report_uuid"
            ),
        },
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
    // SATUSEHAT
    // ==================================================
    const [[ss]] =
      await dbERM.promise().query(
        `
        SELECT
          patient_ihs_number,
          encounter_uuid,
          last_update
        FROM satusehat
        WHERE registry_id = ?
        LIMIT 1
        `,
        [registry_id]
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

        hasil_bacaan:
          utama.photo_reading ||
          lokal?.hasil_bacaan ||
          null,

        status:
          !!utama.photo_reading
            ? "done"
            : (
                lokal?.status ||
                "none"
              ),

        is_final:
          !!utama.photo_reading,

        is_lokal:
          !!lokal?.hasil_bacaan,

        pengirim_ihs:
          utama.pengirim_ihs,

        pemeriksa_ihs:
          utama.pemeriksa_ihs,

        patient_ihs_number:
          ss?.patient_ihs_number || null,

        encounter_uuid:
          ss?.encounter_uuid || null,

        encounter_date:
          ss?.last_update || null,
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

    
    // ======================================
    // SATUSEHAT FLOW
    // ======================================
    const check = await buildPayloadFromDB(
      registry_id,
      x_ray_dtl_id,
      "ServiceRequest"
    );

    const syncAction = determineSyncAction({
      debugMode:
        process.env.DEBUG_SATUSEHAT === "true",

      isComplete:
        check.isCompleteForSatuSehat,
    });

    // ======================================
    // INSERT RESOURCE TABLE
    // ======================================

    await connERM.query(
      `
      INSERT INTO satusehat_service_request
      (
        registry_id,
        x_ray_id,
        x_ray_dtl_id,

        service_request_uuid,

        code,
        display,

        status,

        sync_status,
        sync_message,

        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())

      ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        display = VALUES(display),
        sync_status = VALUES(sync_status),
        sync_message = VALUES(sync_message),
        updated_at = NOW()
      `,
      [
        registry_id,
        utama.x_ray_id,
        utama.x_ray_dtl_id,

        null,

        loinc_code,
        loinc_display,

        "active",

        syncAction.mode === "debug"
          ? "debug"
          : syncAction.mode === "queue"
          ? "queued"
          : "pending",

        syncAction.message,
      ]
    );

    // ======================================
    // OUTBOX
    // ======================================

    if (["send", "queue"].includes(syncAction.mode)) {

      await outboxService.enqueue({
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
        resource_type: "ServiceRequest",
      });

    }

    await connLokal.commit();
    await connERM.commit();

    res.json({
      success: true,
      message: "Request X-Ray berhasil",
    
      satusehat: syncAction.mode,
    
      sync_message: syncAction.message,
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
     * CEK SERVICE REQUEST
     * ====================================================== */
    const [[sr]] = await connERM.query(
      `
      SELECT
        id,
        service_request_uuid,
        sync_status
      FROM satusehat_service_request
      WHERE registry_id = ?
        AND x_ray_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, x_ray_dtl_id]
    );

    if (!sr) {
      return res.status(400).json({
        success: false,
        message: "Request radiologi belum dibuat",
      });
    }
    
    if (sr.sync_status === "failed") {
      return res.status(400).json({
        success: false,
        message: "ServiceRequest SATUSEHAT gagal",
      });
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

    // ======================================
    // SATUSEHAT IMAGING STUDY
    // HANYA DICOM
    // ======================================

    if (upload_mode === "dicom") {

      const check = await buildPayloadFromDB(
        registry_id,
        x_ray_dtl_id,
        "ImagingStudy"
      );

      const syncAction = determineSyncAction({
        debugMode:
          process.env.DEBUG_SATUSEHAT === "true",

        isComplete:
          check.isCompleteForSatuSehat,
      });

      await connERM.query(
        `
        INSERT INTO satusehat_imaging_study
        (
          registry_id,
          x_ray_id,
          x_ray_dtl_id,

          service_request_uuid,

          imaging_study_uuid,

          modality,

          status,

          sync_status,
          sync_message,

          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())

        ON DUPLICATE KEY UPDATE
          modality = VALUES(modality),
          sync_status = VALUES(sync_status),
          sync_message = VALUES(sync_message),
          updated_at = NOW()
        `,
        [
          registry_id,
          x_ray_id,
          x_ray_dtl_id,

          check.service_request_id,

          null,

          check.modality || "CR",

          "available",

          syncAction.mode === "debug"
            ? "debug"
            : syncAction.mode === "queue"
            ? "queued"
            : "pending",

          syncAction.message,
        ]
      );

      if (["send", "queue"].includes(syncAction.mode)) {

        await outboxService.enqueue({
          registry_id,
          x_ray_id,
          x_ray_dtl_id,
          resource_type: "ImagingStudy",
        });

      }

    }

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

    // ======================================
    // SATUSEHAT OBSERVATION
    // ======================================
    console.log("STEP 1");
    const payloadCheck = await buildPayloadFromDB(
      registry_id,
      x_ray_dtl_id,
      "Observation"
    );
    console.log("STEP 2");
    const syncAction = determineSyncAction({
      debugMode:
        process.env.DEBUG_SATUSEHAT === "true",

      isComplete:
        payloadCheck.isCompleteForSatuSehat,
    });
    console.log("STEP 3");
    await connERM.query(
      `
      INSERT INTO satusehat_observation
      (
        registry_id,
        x_ray_id,
        x_ray_dtl_id,

        service_request_uuid,

        observation_uuid,

        code,
        display,

        value_text,

        sync_status,
        sync_message,

        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())

      ON DUPLICATE KEY UPDATE
        value_text = VALUES(value_text),
        sync_status = VALUES(sync_status),
        sync_message = VALUES(sync_message),
        updated_at = NOW()
      `,
      [
        registry_id,
        x_ray_id,
        x_ray_dtl_id,

        payloadCheck.service_request_id,

        null,

        payloadCheck.loinc_code,
        payloadCheck.loinc_display,

        hasil_bacaan,

        syncAction.mode === "debug"
          ? "debug"
          : syncAction.mode === "queue"
          ? "queued"
          : "pending",

        syncAction.message,
      ]
    );
    console.log("STEP 4");
    if (["send", "queue"].includes(syncAction.mode)) {
      console.log("STEP 5 BEFORE ENQUEUE");
      await outboxService.enqueue({
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
        resource_type: "Observation",
      });
      console.log("STEP 6 AFTER ENQUEUE");
    }
    console.log("STEP 7 RESPONSE");
    return res.json({
      success: true,
      message: "Hasil bacaan berhasil disimpan",
    
      satusehat: syncAction.mode,
      sync_message: syncAction.message,
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
    const syncAction = determineSyncAction({
      debugMode:
        process.env.DEBUG_SATUSEHAT === "true",
    
      isComplete:
        payload.isCompleteForSatuSehat,
    });
    
    await connERM.query(
      `
      INSERT INTO satusehat_diagnostic_report
      (
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
    
        service_request_uuid,
    
        diagnostic_report_uuid,
    
        status,
    
        conclusion,
    
        sync_status,
        sync_message,
    
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    
      ON DUPLICATE KEY UPDATE
        conclusion = VALUES(conclusion),
        sync_status = VALUES(sync_status),
        sync_message = VALUES(sync_message),
        updated_at = NOW()
      `,
      [
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
    
        payload.service_request_id,
    
        null,
    
        "final",
    
        payload.hasil_bacaan,
    
        syncAction.mode === "debug"
          ? "debug"
          : syncAction.mode === "queue"
          ? "queued"
          : "pending",
    
        syncAction.message,
      ]
    );
    
    if (["send", "queue"].includes(syncAction.mode)) {
    
      await outboxService.enqueue({
        registry_id,
        x_ray_id,
        x_ray_dtl_id,
        resource_type: "DiagnosticReport",
      });
    
    }

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
    
      satusehat: syncAction.mode,
      sync_message: syncAction.message,
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

module.exports.buildPayloadFromDB = buildPayloadFromDB;