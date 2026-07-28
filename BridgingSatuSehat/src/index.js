// src/index.js - MAIN FILE
require("dotenv").config();
const mysql = require("mysql2/promise");
const { Pool } = require("pg");
const config = require("./config/database");
const { createPatient, getPatientByNIK } = require("./services/patientService");
const { createEncounter } = require("./services/encounterService");
const {
  updateEncounterToInProgress,
  updateEncounterToFinished,
} = require("./services/encounterStatusService");
const { createCondition } = require("./services/conditionService");
const { createObservation } = require("./services/observationService");
const { createProcedure } = require("./services/procedureService");
const { createComposition } = require("./services/compositionService");
const logger = require("./helpers/logger");
const { getToken } = require("./services/authService");

// ============================================
// KONEKSI DATABASE
// ============================================
let simrs, erm, satusehat;

async function connectDB() {
  try {
    logger.info("🔄 Connecting to MySQL (SIMRS)...");
    // ✅ PAKAI POOL BUKAN CREATE CONNECTION
    simrs = require("./db/simrs"); // ← PAKAI MODULE POOL
    logger.info("✅ MySQL (SIMRS) connected");

    logger.info("🔄 Connecting to MySQL (ERM)...");
    erm = mysql.createPool(config.erm); // ← PAKAI POOL
    logger.info("✅ MySQL (ERM) connected");

    logger.info("🔄 Connecting to PostgreSQL...");
    satusehat = new Pool(config.satusehat);
    await satusehat.query("SELECT NOW()");
    logger.info("✅ PostgreSQL connected");
  } catch (error) {
    logger.error("❌ Connection error:", error.message);
    process.exit(1);
  }
}

// ============================================
// GET LOCATION UUID DARI ERM
// ============================================
async function getLocationUUID(srvcUnitId) {
  try {
    const [rows] = await erm.query(
      `
      SELECT location_uuid 
      FROM satusehat 
      WHERE location_srvc_unit_id = ? 
        AND location_uuid IS NOT NULL 
        AND location_uuid != ''
      ORDER BY last_update DESC 
      LIMIT 1
    `,
      [srvcUnitId],
    );
    return rows[0]?.location_uuid || null;
  } catch (error) {
    logger.warn(`⚠️ Could not get location UUID: ${error.message}`);
    return null;
  }
}

// ============================================
// VALIDASI DATA LENGKAP
// ============================================
function isDataComplete(reg) {
  const errors = [];
  const now = new Date();

  if (!reg.no_ktp || reg.no_ktp.length !== 16) {
    errors.push(`NIK tidak valid (${reg.no_ktp})`);
  }

  if (reg.tgl_lahir) {
    const birthDate = new Date(reg.tgl_lahir);
    if (birthDate > now) {
      errors.push(`Tanggal lahir future (${reg.tgl_lahir})`);
    }
    if (birthDate < new Date("1900-01-01")) {
      errors.push(`Tanggal lahir terlalu tua (${reg.tgl_lahir})`);
    }
  }

  const regDate = new Date(reg.registry_dt);
  if (regDate > now) {
    errors.push(`Tanggal registrasi future (${reg.registry_dt})`);
  }

  const minDate = new Date("2014-06-03");
  if (regDate < minDate) {
    errors.push(`Tanggal registrasi terlalu tua (${reg.registry_dt})`);
  }

  if (!reg.unit_id_to) {
    errors.push("Unit tujuan tidak ditemukan");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

// ============================================
// GET DATA DARI SIMRS
// ============================================
async function getRegistrations(limit = 100) {
  const [rows] = await simrs.query(
    `
    SELECT 
      r.registry_id,
      r.mr_id,
      r.registry_dt,
      r.in_out_sts,
      r.srvc_unit_id,
      uv.unit_id_to,
      p.id_number AS no_ktp,
      p.patient_nm AS nm_pasien,
      p.gender AS jk,
      p.birth_dt AS tgl_lahir,
      p.address AS alamat,
      p.patient_ihs_number,
      s_to.srvc_unit_nm,
      s_to.satusehat_uuid,
      p.province_id,
      p.district_id,
      p.subdistrict_id,
      p.village_id,
      pr.province_nm AS province_name,
      d.district_nm AS district_name,
      sub.subdistrict_nm AS subdistrict_name,
      v.village_nm AS village_name
    FROM registry r
    JOIN patient p ON r.mr_id = p.mr_id
    LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
    LEFT JOIN service_unit s_to ON uv.unit_id_to = s_to.srvc_unit_id
    LEFT JOIN province pr ON p.province_id = pr.province_id
    LEFT JOIN district d ON p.district_id = d.district_id
    LEFT JOIN subdistrict sub ON p.subdistrict_id = sub.subdistrict_id
    LEFT JOIN village v ON p.village_id = v.village_id
    WHERE 
      r.registry_dt >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND r.registry_dt < CURDATE()
      AND p.id_number IS NOT NULL
      AND p.id_number != ''
      AND LENGTH(p.id_number) = 16
      AND uv.unit_id_from = 'T0001'
    ORDER BY r.registry_dt DESC
    LIMIT ?
  `,
    [limit],
  );

  for (const row of rows) {
    if (!row.satusehat_uuid && row.unit_id_to) {
      const locationUuid = await getLocationUUID(row.unit_id_to);
      if (locationUuid) {
        row.satusehat_uuid = locationUuid;
        if (!row.srvc_unit_nm) {
          const [unit] = await simrs.query(
            `SELECT srvc_unit_nm FROM service_unit WHERE srvc_unit_id = ?`,
            [row.unit_id_to],
          );
          if (unit.length > 0) {
            row.srvc_unit_nm = unit[0].srvc_unit_nm;
          }
        }
      }
    }
  }

  return rows;
}

// ============================================
// CEK DATA YANG SUDAH DIPROSES
// ============================================
async function getProcessedRegistries() {
  const result = await satusehat.query(`
    SELECT local_resource_id 
    FROM satusehat_resource_status 
    WHERE resource_type = 'Encounter' 
      AND status = 'success'
      AND DATE(created_at) = CURRENT_DATE
  `);

  const processed = new Set();
  result.rows.forEach((row) => processed.add(row.local_resource_id));
  return processed;
}

// ============================================
// SIMPAN STATUS KE DATABASE
// ============================================
async function saveResourceStatus(data) {
  try {
    const query = `
      INSERT INTO satusehat_resource_status 
      (resource_type, local_resource_id, satusehat_id, patient_id, 
       status, request_payload, response_payload, response_status_code,
       last_error, batch_id, source_system, processed_by, retry_count, 
       duration_ms, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    `;

    const values = [
      data.resource_type || "Encounter",
      data.local_resource_id,
      data.satusehat_id || null,
      data.patient_id || null,
      data.status || "processing",
      data.request_payload ? JSON.stringify(data.request_payload) : null,
      data.response_payload ? JSON.stringify(data.response_payload) : null,
      data.response_status_code || null,
      data.last_error || null,
      data.batch_id || `BATCH-${new Date().toISOString().slice(0, 10)}`,
      data.source_system || "SIMRS",
      data.processed_by || "bridge-service",
      data.retry_count || 0,
      data.duration_ms || 0,
    ];

    await satusehat.query(query, values);
    logger.info(
      `💾 Status recorded: ${data.status} for ${data.local_resource_id}`,
    );
  } catch (error) {
    logger.error(`❌ Failed to save status: ${error.message}`);
  }
}

// ============================================
// PROSES SEMUA RESOURCE UNTUK SATU REGISTRY
// ============================================
async function processRegistryResources(
  reg,
  patientId,
  encounterId,
  practitionerId,
) {
  const results = {
    condition: null,
    observation: null,
    procedure: null,
    composition: null,
  };

  // 1. CREATE CONDITION (ICD-10)
  try {
    const condition = await createCondition(
      reg.registry_id,
      patientId,
      encounterId,
    );
    if (condition.success) {
      logger.info(`✅ Condition created: ${condition.id || "existing"}`);
      results.condition = condition;
    } else {
      logger.warn(`⚠️ Condition skipped: ${condition.error}`);
    }
  } catch (e) {
    logger.warn(`⚠️ Condition error: ${e.message}`);
  }

  // 2. CREATE OBSERVATION (Vital Sign)
  try {
    const observation = await createObservation(
      reg.registry_id,
      patientId,
      encounterId,
      practitionerId,
    );
    if (observation.success) {
      const successCount =
        observation.results?.filter((r) => r.success).length || 0;
      const totalCount = observation.results?.length || 0;
      logger.info(`✅ Observations created: ${successCount}/${totalCount}`);
      results.observation = observation;
    } else {
      logger.warn(`⚠️ Observation skipped: ${observation.error}`);
    }
  } catch (e) {
    logger.warn(`⚠️ Observation error: ${e.message}`);
  }

  // 3. CREATE PROCEDURE (ICD-9)
  try {
    const procedure = await createProcedure(
      reg.registry_id,
      patientId,
      encounterId,
    );
    if (procedure.success) {
      logger.info(`✅ Procedure created: ${procedure.id || "existing"}`);
      results.procedure = procedure;
    } else {
      logger.warn(`⚠️ Procedure skipped: ${procedure.error}`);
    }
  } catch (e) {
    logger.warn(`⚠️ Procedure error: ${e.message}`);
  }

  // 4. CREATE COMPOSITION (Resume Medis)
  try {
    const composition = await createComposition(
      reg.registry_id,
      patientId,
      encounterId,
      practitionerId,
    );
    if (composition.success) {
      logger.info(`✅ Composition created: ${composition.id || "existing"}`);
      results.composition = composition;
    } else {
      logger.warn(`⚠️ Composition skipped: ${composition.error}`);
    }
  } catch (e) {
    logger.warn(`⚠️ Composition error: ${e.message}`);
  }

  return results;
}

// ============================================
// PROSES BRIDGING
// ============================================
async function processBridging() {
  logger.info("\n🚀 START BRIDGING...");
  const token = await getToken();
  console.log(`\n🔑 ACCESS TOKEN: ${token}\n`);

  const registrations = await getRegistrations(100);
  logger.info(`📊 Found ${registrations.length} registrations`);

  const processedIds = await getProcessedRegistries();

  let success = 0;
  let failed = 0;
  let skipped = 0;
  let invalid = 0;

  for (const reg of registrations) {
    logger.info(`\n📌 ${reg.registry_id} - ${reg.nm_pasien}`);

    // STEP 1: CEK SUDAH DIPROSES
    if (processedIds.has(reg.registry_id)) {
      logger.info(`⏭️ Already processed today, skip`);
      skipped++;
      continue;
    }

    // STEP 2: VALIDASI DATA
    const validation = isDataComplete(reg);
    if (!validation.valid) {
      logger.warn(`⚠️ Data incomplete: ${validation.errors.join(", ")}`);
      invalid++;
      await satusehat.query(
        `INSERT INTO satusehat_resource_status 
        (resource_type, local_resource_id, status, last_error, created_at)
        VALUES ($1, $2, $3, $4, NOW())`,
        ["Encounter", reg.registry_id, "skipped", validation.errors.join(", ")],
      );
      continue;
    }

    // STEP 3: PROSES PATIENT
    let patientId = reg.patient_ihs_number;

    if (!patientId) {
      logger.info(`🔍 Checking patient in SatuSehat (NIK: ${reg.no_ktp})`);

      const existing = await getPatientByNIK(reg.no_ktp);
      if (existing.success && existing.patient) {
        patientId = existing.patient.id;
        logger.info(`✅ Patient exists in SatuSehat: ${patientId}`);
        try {
          await simrs.query(
            `UPDATE patient SET patient_ihs_number = ? WHERE mr_id = ?`,
            [patientId, reg.mr_id],
          );
        } catch (e) {
          logger.warn(`⚠️ Could not update SIMRS: ${e.message}`);
        }
      } else {
        logger.info(`👤 Creating new patient: ${reg.nm_pasien}`);
        const patient = await createPatient({
          mr_id: reg.mr_id,
          no_ktp: reg.no_ktp,
          nm_pasien: reg.nm_pasien,
          jk: reg.jk,
          tgl_lahir: reg.tgl_lahir,
          alamat: reg.alamat,
          province_id: reg.province_id,
          district_id: reg.district_id,
          subdistrict_id: reg.subdistrict_id,
          village_id: reg.village_id,
          province_name: reg.province_name,
          district_name: reg.district_name,
          subdistrict_name: reg.subdistrict_name,
          village_name: reg.village_name,
        });

        if (!patient.success) {
          logger.error(`❌ Patient creation failed, skip`);
          failed++;
          continue;
        }
        patientId = patient.id;
        logger.info(`✅ Patient created: ${patientId}`);
      }
    } else {
      logger.info(`✅ Patient has IHS: ${patientId}`);
    }

    // STEP 4: CREATE ENCOUNTER (arrived)
    const encounter = await createEncounter(reg, patientId);

    if (encounter.success && encounter.id && !encounter.existing) {
      const encounterId = encounter.id;
      const practitionerId = encounter.practitionerId || null;
      logger.info(`✅ Encounter created: ${encounterId}`);

      // REKAM STATUS ARRIVED
      await saveResourceStatus({
        resource_type: "Encounter",
        local_resource_id: reg.registry_id,
        satusehat_id: encounterId,
        patient_id: patientId,
        status: "arrived",
        request_payload: encounter.requestPayload || null,
        response_payload: encounter.data || null,
        response_status_code: 201,
        batch_id: `BATCH-${new Date().toISOString().slice(0, 10)}`,
        source_system: "SIMRS",
        processed_by: "bridge-service",
        duration_ms: encounter.duration || 0,
      });

      // STEP 5: UPDATE ENCOUNTER TO IN-PROGRESS
      const inProgressResult = await updateEncounterToInProgress(
        reg.registry_id,
        encounterId,
        reg.registry_dt,
      );

      if (inProgressResult.success) {
        logger.info(`✅ Encounter updated to in-progress`);
        await saveResourceStatus({
          resource_type: "Encounter",
          local_resource_id: reg.registry_id,
          satusehat_id: encounterId,
          patient_id: patientId,
          status: "in-progress",
          request_payload: inProgressResult.requestPayload || null,
          response_payload: inProgressResult.data || null,
          response_status_code: 200,
          batch_id: `BATCH-${new Date().toISOString().slice(0, 10)}`,
          source_system: "SIMRS",
          processed_by: "bridge-service",
          duration_ms: inProgressResult.duration || 0,
        });
      }

      // STEP 6: UPDATE ENCOUNTER TO FINISHED
      const finishedResult = await updateEncounterToFinished(
        reg.registry_id,
        encounterId,
        reg.registry_dt,
      );

      if (finishedResult.success) {
        logger.info(`✅ Encounter updated to finished`);
        await saveResourceStatus({
          resource_type: "Encounter",
          local_resource_id: reg.registry_id,
          satusehat_id: encounterId,
          patient_id: patientId,
          status: "finished",
          request_payload: finishedResult.requestPayload || null,
          response_payload: finishedResult.data || null,
          response_status_code: 200,
          batch_id: `BATCH-${new Date().toISOString().slice(0, 10)}`,
          source_system: "SIMRS",
          processed_by: "bridge-service",
          duration_ms: finishedResult.duration || 0,
        });
      }

      // STEP 7: PROCESS CONDITION, OBSERVATION, PROCEDURE, COMPOSITION
      const resourceResults = await processRegistryResources(
        reg,
        patientId,
        encounterId,
        practitionerId,
      );

      success++;
      await satusehat.query(
        `INSERT INTO satusehat_resource_status 
        (resource_type, local_resource_id, satusehat_id, status, created_at)
        VALUES ($1, $2, $3, $4, NOW())`,
        ["Encounter", reg.registry_id, encounterId, "success"],
      );
    } else if (encounter.existing) {
      logger.info(`⏭️ Encounter already exists, skip update`);
      skipped++;
      await saveResourceStatus({
        resource_type: "Encounter",
        local_resource_id: reg.registry_id,
        satusehat_id: encounter.id || null,
        patient_id: patientId,
        status: "skipped",
        last_error: "Encounter already exists",
        batch_id: `BATCH-${new Date().toISOString().slice(0, 10)}`,
        source_system: "SIMRS",
        processed_by: "bridge-service",
      });
    } else {
      failed++;
      logger.error(`❌ Encounter failed: ${encounter.error}`);
      await saveResourceStatus({
        resource_type: "Encounter",
        local_resource_id: reg.registry_id,
        patient_id: patientId,
        status: "failed",
        last_error: encounter.error || "Unknown error",
        batch_id: `BATCH-${new Date().toISOString().slice(0, 10)}`,
        source_system: "SIMRS",
        processed_by: "bridge-service",
        retry_count: 0,
      });
    }

    // Delay antar registry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.info(
    `\n📊 SUMMARY: ${success} success, ${failed} failed, ${skipped} skipped, ${invalid} invalid`,
  );
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log("🏥 SATUSEHAT BRIDGE\n");
  await connectDB();
  await processBridging();
  console.log("\n✅ Done!");
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { connectDB, processBridging };
