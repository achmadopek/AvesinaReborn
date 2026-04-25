const dbUtama = require("../../db/connection-avesina");
const dbERM = require("../../db/connection-erm");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const {
  buildServiceRequest,
} = require("../../services/satusehat/builders/serviceRequestBuilder");
const { satusehatClient } = require("../../services/satusehat/satusehatClient");

const { generateUID } = require("../../services/satusehat/builders");
const { sendSatuSehat } = require("../../services/satusehat/sender");

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

  if (role === "dokter_sirad" && expert_id) {
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
    if (role === "dokter_sirad") {
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

      const isFinal = !!u.photo_reading;

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

        status: isFinal ? "done" : l.status || "none",
        is_final: isFinal,

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

    const isFinal = !!utama.photo_reading;

    res.json({
      success: true,
      data: {
        ...utama,

        foto1: lokal?.foto1 ? `/uploads/xray/${lokal.foto1}` : null,
        foto2: lokal?.foto2 ? `/uploads/xray/${lokal.foto2}` : null,
        keluhan: lokal?.keluhan ? lokal.keluhan : "-",
        // fallback
        hasil_bacaan: utama.photo_reading || lokal?.hasil_bacaan || null,

        status: isFinal ? "done" : lokal?.status || "none",

        is_final: isFinal,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
};

// ==============================
// UPLOAD X-RAY (RADIOGRAFER)
// ==============================
exports.uploadXRay = async (req, res) => {
  const conn = await dbLokal.promise().getConnection();

  try {
    const { registry_id, x_ray_id, keluhan, created_by } = req.body;

    // CEK KE DB UTAMA
    const [[cekUtama]] = await dbUtama.promise().query(
      `
      SELECT photo_reading 
      FROM x_ray_dtl 
      WHERE x_ray_id = ?
      LIMIT 1
    `,
      [x_ray_id],
    );

    if (cekUtama?.photo_reading) {
      throw new Error("Data sudah final dari Avesina");
    }

    const foto1 = req.files?.foto1?.[0]?.filename || null;
    const foto2 = req.files?.foto2?.[0]?.filename || null;

    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT * FROM sirad_xray WHERE registry_id = ? AND is_active = 1`,
      [registry_id],
    );

    const uid = generateUID(process.env.ORGANIZATION_ID);

    if (existing.length > 0) {
      const old = existing[0];

      // =========================
      // HAPUS FILE LAMA
      // =========================
      const basePath = path.join(__dirname, "../../uploads/xray");

      if (foto1 && old.foto1) {
        const oldPath = path.join(basePath, old.foto1);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      if (foto2 && old.foto2) {
        const oldPath = path.join(basePath, old.foto2);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // =========================
      // UPDATE DB
      // =========================
      await conn.query(
        `
        UPDATE sirad_xray
        SET 
          foto1 = COALESCE(?, foto1),
          foto2 = COALESCE(?, foto2),
          keluhan = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
        WHERE registry_id = ?
      `,
        [foto1, foto2, keluhan, created_by, registry_id],
      );
    } else {
      throw new Error("Data belum di-request (harus request dulu)");
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Upload X-Ray berhasil",
    });
  } catch (err) {
    await conn.rollback();

    console.error("UPLOAD X-RAY ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Gagal upload X-Ray",
    });
  } finally {
    conn.release();
  }
};

// ==============================
// UPDATE HASIL X-RAY (RADIOLOG)
// ==============================
exports.saveHasil = async (req, res) => {
  const conn = await dbLokal.promise().getConnection();

  try {
    await conn.beginTransaction();

    const { registry_id, hasil_bacaan, read_by } = req.body;

    // VALIDASI INPUT
    if (!registry_id) {
      throw new Error("registry_id wajib diisi");
    }

    if (!hasil_bacaan) {
      throw new Error("hasil_bacaan wajib diisi");
    }

    // ==========================
    // AMBIL x_ray_id DARI LOKAL
    // ==========================
    const [[lokalData]] = await conn.query(
      `
      SELECT x_ray_id
      FROM sirad_xray
      WHERE registry_id = ?
      AND is_active = 1
      LIMIT 1
    `,
      [registry_id],
    );

    if (!lokalData) {
      throw new Error("Data lokal tidak ditemukan");
    }

    // ==========================
    // CEK KE DB UTAMA
    // ==========================
    const [[cekUtama]] = await dbUtama.promise().query(
      `
      SELECT photo_reading 
      FROM x_ray_dtl 
      WHERE x_ray_id = ?
      LIMIT 1
    `,
      [lokalData.x_ray_id],
    );

    if (cekUtama?.photo_reading) {
      throw new Error("Hasil sudah final dari Avesina");
    }

    // CEK DATA LOKAL
    const [existing] = await conn.query(
      `SELECT id, status 
       FROM sirad_xray 
       WHERE registry_id = ? 
       AND is_active = 1
       LIMIT 1`,
      [registry_id],
    );

    if (!existing.length) {
      throw new Error("Data X-Ray belum diupload");
    }

    const data = existing[0];

    if (data.status === "none") {
      throw new Error("Foto belum diupload");
    }

    if (cekUtama?.photo_reading) {
      throw new Error("Hasil sudah diisi");
    }

    // UPDATE
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
      [hasil_bacaan, read_by, registry_id],
    );

    // VALIDASI UPDATE
    if (updateResult.affectedRows === 0) {
      throw new Error("Gagal update data");
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Hasil bacaan tersimpan",
    });
  } catch (err) {
    await conn.rollback();

    console.error("SAVE HASIL ERROR:", err);

    res.status(400).json({
      success: false,
      message: err.message || "Gagal simpan hasil",
    });
  } finally {
    conn.release();
  }
};

exports.requestXRay = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connERM = await dbERM.promise().getConnection();

  try {
    const { registry_id, pengirim_id, pemeriksa_id } = req.body;

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
      SELECT loinc_code, loinc_display
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
      (registry_id, service_request_id, status, ordered_by, ordered_at, created_at)
      VALUES (?, ?, 'ordered', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        service_request_id = VALUES(service_request_id),
        status = 'ordered',
        ordered_by = VALUES(ordered_by),
        ordered_at = NOW()
    `,
      [registry_id, serviceRequestUUID, pengirim_id],
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

exports.sendSatuSehat = async (req, res) => {
  const conn = await dbLokal.promise().getConnection();

  try {
    const { registry_id } = req.body;

    if (!registry_id) throw new Error("registry_id wajib");

    const [[detail]] = await conn.query(
      `SELECT * FROM sirad_xray
       WHERE registry_id = ?
       AND is_active = 1
       LIMIT 1`,
      [registry_id],
    );

    if (!detail) throw new Error("Data tidak ditemukan");
    if (detail.status !== "read") throw new Error("Belum siap kirim");
    if (!detail.read_by) throw new Error("Dokter pemeriksa belum ada");
    if (!detail.read_at) throw new Error("Tanggal baca belum ada");

    if (!detail.uid_study || !detail.uid_series || !detail.uid_instance1) {
      throw new Error("UID DICOM belum lengkap");
    }

    const [[ss]] = await dbERM.promise().query(
      `SELECT patient_ihs_number, encounter_uuid
       FROM satusehat
       WHERE registry_id = ?
       LIMIT 1`,
      [registry_id],
    );

    if (!ss?.patient_ihs_number) throw new Error("Patient belum punya IHS");
    if (!ss?.encounter_uuid) throw new Error("Encounter belum ada");

    const [[dokter]] = await dbUtama.promise().query(
      `SELECT satusehat_ihs_number
       FROM employee
       WHERE employee_id = ?
       LIMIT 1`,
      [detail.read_by],
    );

    if (!dokter?.satusehat_ihs_number) {
      throw new Error("Dokter belum punya IHS");
    }

    const payloadData = {
      ...detail,
      patient_id: ss.patient_ihs_number,
      encounter_id: ss.encounter_uuid,
      doctor_id: dokter.satusehat_ihs_number,
      measured_dt: detail.read_at,
    };

    const result = await sendSatuSehatService(
      payloadData,
      process.env.ORGANIZATION_ID,
    );

    await conn.query(
      `UPDATE sirad_xray
       SET satusehat_status = 'done',
           satusehat_response = ?,
           updated_at = NOW()
       WHERE registry_id = ?`,
      [JSON.stringify(result), registry_id],
    );

    res.json({
      success: true,
      message: "Berhasil kirim SatuSehat",
    });
  } catch (err) {
    console.error("SEND SATUSEHAT ERROR:", err?.response?.data || err.message);

    try {
      await conn.query(
        `UPDATE sirad_xray
         SET satusehat_status = 'failed'
         WHERE registry_id = ?`,
        [req.body.registry_id],
      );
    } catch (err) {
      console.error("UPDATE XRAY DATA ERROR:", err.message);
    }

    res.status(500).json({
      success: false,
      message: err?.response?.data?.issue?.[0]?.diagnostics || err.message,
    });
  } finally {
    conn.release();
  }
};
