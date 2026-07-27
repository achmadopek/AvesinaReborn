// src/index.js - MAIN FILE
require("dotenv").config();
const mysql = require("mysql2/promise");
const { Pool } = require("pg");
const config = require("./config/database");
const { createPatient, getPatientByNIK } = require("./services/patientService");
const {
  createEncounter,
  checkExistingEncounter,
} = require("./services/encounterService");
const logger = require("./helpers/logger");
const { getToken } = require("./services/authService");

// ============================================
// KONEKSI DATABASE
// ============================================
let simrs, erm, satusehat;

async function connectDB() {
  try {
    logger.info("🔄 Connecting to MySQL (SIMRS)...");
    simrs = await mysql.createConnection(config.simrs);
    logger.info("✅ MySQL (SIMRS) connected");

    logger.info("🔄 Connecting to MySQL (ERM)...");
    erm = await mysql.createConnection(config.erm);
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
// ✅ VALIDASI DATA LENGKAP SEBELUM KIRIM
// ============================================

function isDataComplete(reg) {
  const errors = [];
  const now = new Date(); // 🔥 TAMBAHKAN INI!

  // 1. Cek NIK (wajib)
  if (!reg.no_ktp || reg.no_ktp.length !== 16) {
    errors.push(`NIK tidak valid (${reg.no_ktp})`);
  }

  // 2. Cek tanggal lahir (tidak future)
  if (reg.tgl_lahir) {
    const birthDate = new Date(reg.tgl_lahir);
    if (birthDate > now) {
      errors.push(`Tanggal lahir future (${reg.tgl_lahir})`);
    }
    if (birthDate < new Date("1900-01-01")) {
      errors.push(`Tanggal lahir terlalu tua (${reg.tgl_lahir})`);
    }
  }

  // 3. Cek tanggal registrasi (tidak future)
  const regDate = new Date(reg.registry_dt);
  if (regDate > now) {
    errors.push(`Tanggal registrasi future (${reg.registry_dt})`);
  }

  // 4. Cek tanggal registrasi terlalu tua
  const minDate = new Date("2014-06-03");
  if (regDate < minDate) {
    errors.push(`Tanggal registrasi terlalu tua (${reg.registry_dt})`);
  }

  // 5. Cek unit_id_to (harus ada)
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
      -- AMBIL DATA 8 JAM TERAKHIR
      -- r.registry_dt >= DATE_SUB(NOW(), INTERVAL 8 HOUR)
      -- AND r.registry_dt <= NOW()

      -- AMBIL DATA KEMARIN (00:00 - 23:59)
      r.registry_dt >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND r.registry_dt < CURDATE()
      
      AND p.id_number IS NOT NULL
      AND p.id_number != ''
      AND LENGTH(p.id_number) = 16
      -- AND p.patient_ihs_number IS NOT NULL (--> ambil meski yg belum punya IHS, untuk nnti dibuatkan)
      AND uv.unit_id_from = 'T0001'
    ORDER BY r.registry_dt DESC
    LIMIT ?
  `,
    [limit],
  );

  // Untuk setiap row, ambil location_uuid dari ERM (jika belum ada)
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
// ✅ CEK DATA YANG SUDAH DIPROSES (TIDAK KIRIM ULANG)
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
// PROSES BRIDGING
// ============================================
async function processBridging() {
  logger.info("\n🚀 START BRIDGING...");
  const token = await getToken();
  console.log(`\n🔑 ACCESS TOKEN: ${token}\n`);

  // 🔥 Ambil data dengan LIMIT yang sesuai (250-350 per hari / 3 batch = ~100 per batch)
  const registrations = await getRegistrations(100);
  logger.info(`📊 Found ${registrations.length} registrations`);

  // 🔥 Data yang sudah diproses hari ini (hindari duplikat)
  const processedIds = await getProcessedRegistries();

  let success = 0;
  let failed = 0;
  let skipped = 0;
  let invalid = 0;

  for (const reg of registrations) {
    logger.info(`\n📌 ${reg.registry_id} - ${reg.nm_pasien}`);

    // ============================================
    // ✅ STEP 1: CEK APAKAH SUDAH DIPROSES
    // ============================================
    if (processedIds.has(reg.registry_id)) {
      logger.info(`⏭️ Already processed today, skip`);
      skipped++;
      continue;
    }

    // ============================================
    // ✅ STEP 2: VALIDASI DATA LENGKAP
    // ============================================
    const validation = isDataComplete(reg);
    if (!validation.valid) {
      logger.warn(`⚠️ Data incomplete: ${validation.errors.join(", ")}`);
      invalid++;

      // Simpan ke database sebagai skipped dengan alasan
      try {
        await satusehat.query(
          `INSERT INTO satusehat_resource_status 
          (resource_type, local_resource_id, status, last_error, created_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            "Encounter",
            reg.registry_id,
            "skipped",
            validation.errors.join(", "),
          ],
        );
      } catch (e) {}
      continue;
    }

    // ============================================
    // ✅ STEP 3: CEK DI SATUSEHAT (duplikat)
    // ============================================
    const existing = await checkExistingEncounter(reg.registry_id);
    if (existing.exists) {
      logger.info(`⏭️ Already exists in SatuSehat (${existing.id})`);
      skipped++;

      // Simpan ke database
      try {
        await satusehat.query(
          `INSERT INTO satusehat_resource_status 
          (resource_type, local_resource_id, satusehat_id, status, created_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          ["Encounter", reg.registry_id, existing.id, "skipped"],
        );
      } catch (e) {}
      continue;
    }

    // ============================================
    // STEP 4: PROSES PATIENT
    // ============================================
    let patientId = reg.patient_ihs_number;

    if (!patientId) {
      // 🔥 Coba cari di SatuSehat dulu
      logger.info(`🔍 Checking patient in SatuSehat (NIK: ${reg.no_ktp})`);

      const existing = await getPatientByNIK(reg.no_ktp);
      if (existing.success && existing.patient) {
        patientId = existing.patient.id;
        logger.info(`✅ Patient exists in SatuSehat: ${patientId}`);

        // Update SIMRS dengan IHS number
        try {
          await simrs.query(
            `UPDATE patient SET patient_ihs_number = ? WHERE mr_id = ?`,
            [patientId, reg.mr_id],
          );
          logger.info(`💾 Updated patient_ihs_number in SIMRS`);
        } catch (e) {
          logger.warn(`⚠️ Could not update SIMRS: ${e.message}`);
        }
      } else {
        // 🔥 CREATE PATIENT BARU!
        logger.info(`👤 Creating new patient: ${reg.nm_pasien}`);

        const patient = await createPatient({
          mr_id: reg.mr_id,
          no_ktp: reg.no_ktp,
          nm_pasien: reg.nm_pasien,
          jk: reg.jk,
          tgl_lahir: reg.tgl_lahir,
          alamat: reg.alamat,
          //address: reg.alamat,
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

    // ============================================
    // STEP 5: PROSES ENCOUNTER
    // ============================================
    const encounter = await createEncounter(reg, patientId);

    if (encounter.success) {
      success++;
      logger.info(`✅ Encounter success: ${encounter.id || "created"}`);

      // 🔥 SAVE SUCCESS KE DATABASE
      try {
        const result = await satusehat.query(
          `INSERT INTO satusehat_resource_status 
      (resource_type, local_resource_id, satusehat_id, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id`,
          ["Encounter", reg.registry_id, encounter.id || "success", "success"],
        );
        logger.info(`💾 Saved to database (ID: ${result.rows[0].id})`);
      } catch (e) {
        logger.error(`❌ Failed to save to database: ${e.message}`);
      }
    } else {
      failed++;
      logger.error(`❌ Encounter failed: ${encounter.error}`);

      try {
        await satusehat.query(
          `INSERT INTO satusehat_resource_status 
      (resource_type, local_resource_id, status, last_error, created_at)
      VALUES ($1, $2, $3, $4, NOW())`,
          [
            "Encounter",
            reg.registry_id,
            "failed",
            encounter.error || "Unknown error",
          ],
        );
      } catch (e) {
        logger.error(`❌ Failed to save failed status: ${e.message}`);
      }
    }

    // Delay
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

// Jalankan
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { connectDB, processBridging };
