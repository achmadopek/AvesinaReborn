// src/services/patientService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");

function mapGender(gender) {
  if (!gender) return "unknown";
  const g = gender.toUpperCase();
  if (g === "L" || g === "M") return "male";
  if (g === "P" || g === "F") return "female";
  return "unknown";
}

function formatDate(date) {
  if (!date) return null;

  let d = new Date(date);
  if (isNaN(d.getTime())) {
    try {
      d = new Date(date.replace(" ", "T"));
    } catch (e) {
      return null;
    }
    if (isNaN(d.getTime())) return null;
  }

  const now = new Date();

  if (d > now) {
    logger.warn(`⚠️ Future birthDate (${date}) -> using 2000-01-01`);
    return "2000-01-01";
  }

  if (d < new Date("1900-01-01")) {
    logger.warn(`⚠️ Too old birthDate (${date}) -> using 1970-01-01`);
    return "1970-01-01";
  }

  return d.toISOString().split("T")[0];
}

async function getPatientByNIK(nik) {
  try {
    const token = await getToken();
    const response = await axios.get(`${config.api.baseUrl}/Patient`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        identifier: `https://fhir.kemkes.go.id/id/nik|${nik}`,
      },
    });

    if (response.data?.entry?.length > 0) {
      return { success: true, patient: response.data.entry[0].resource };
    }
    return { success: false, patient: null };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, patient: null };
    }
    logger.error(`❌ Get patient failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createPatient(patientData) {
  logger.info(`👤 Creating patient: ${patientData.nm_pasien}`);

  if (!patientData.no_ktp) {
    logger.error("❌ No NIK provided");
    return { success: false, error: "No NIK" };
  }

  const nik = patientData.no_ktp.padStart(16, "0");
  const name = patientData.nm_pasien || "Unknown";
  const gender = mapGender(patientData.jk);
  const birthDate = formatDate(patientData.tgl_lahir);

  // Cek existing
  const existing = await getPatientByNIK(nik);
  if (existing.success && existing.patient) {
    logger.info(`✅ Patient already exists: ${existing.patient.id}`);
    return { success: true, id: existing.patient.id, existing: true };
  }

  // ============================================
  // BUILD FHIR PATIENT (DENGAN ADDRESS TANPA EXTENSION)
  // ============================================
  const fhirPatient = {
    resourceType: "Patient",
    meta: {
      profile: ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"],
    },
    identifier: [
      {
        use: "official",
        system: "https://fhir.kemkes.go.id/id/nik",
        value: nik,
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        text: name,
      },
    ],
    gender: gender,
    birthDate: birthDate,
    deceasedBoolean: false,
    multipleBirthInteger: 0,
    communication: [
      {
        language: {
          coding: [
            {
              system: "urn:ietf:bcp:47",
              code: "id-ID",
              display: "Indonesian",
            },
          ],
          text: "Indonesian",
        },
        preferred: true,
      },
    ],
    // 🔥 ADDRESS TANPA EXTENSION
    address: [
      {
        use: "home",
        line: ["Jl. Contoh No. 1"],
        city: "Kota",
        postalCode: "00000",
        country: "ID",
      },
    ],
  };

  // 🔥 Jika ada alamat dari database, gunakan
  if (patientData.alamat) {
    fhirPatient.address[0].line = [patientData.alamat];
    logger.info(`📍 Using address: ${patientData.alamat}`);
  } else {
    logger.info(`📍 Using dummy address (no extension)`);
  }

  try {
    const token = await getToken();
    const response = await axios.post(
      `${config.api.baseUrl}/Patient`,
      fhirPatient,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Patient created: ${response.data.id}`);
      return { success: true, id: response.data.id, data: response.data };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409) {
      const existingPatient = await getPatientByNIK(nik);
      if (existingPatient.success && existingPatient.patient) {
        logger.info(`✅ Patient exists: ${existingPatient.patient.id}`);
        return {
          success: true,
          id: existingPatient.patient.id,
          existing: true,
        };
      }
    }

    if (error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      logger.error(
        `📋 Detail error: ${JSON.stringify(error.response.data, null, 2)}`,
      );
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Patient creation failed:`,
      error.response?.data || error.message,
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

module.exports = { createPatient, getPatientByNIK, mapGender, formatDate };
