// src/services/patientService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForFHIR } = require("../helpers/dateHelper");
const { validatePatient } = require("./validationService");

function mapGender(gender) {
  if (!gender) return "unknown";
  const g = gender.toUpperCase();
  if (g === "L" || g === "M") return "male";
  if (g === "P" || g === "F") return "female";
  return "unknown";
}

async function getPatientByNIK(nik) {
  // Gunakan validatePatient dari validationService
  const result = await validatePatient(nik);
  if (result.valid) {
    return { success: true, patient: result.data };
  }
  return { success: false, patient: null };
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
  const birthDate = formatDateForFHIR(patientData.tgl_lahir);

  // Cek existing via validatePatient
  const existing = await validatePatient(nik);
  if (existing.valid) {
    logger.info(`✅ Patient already exists: ${existing.id}`);
    return { success: true, id: existing.id, existing: true };
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
        line: [patientData.alamat || "Alamat belum diisi"],
        city: "Kota",
        postalCode: "00000",
        country: "ID",
      },
    ],
  };

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
      const existingPatient = await validatePatient(nik);
      if (existingPatient.valid) {
        logger.info(`✅ Patient exists: ${existingPatient.id}`);
        return { success: true, id: existingPatient.id, existing: true };
      }
    }

    if (error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Patient creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { createPatient, getPatientByNIK, mapGender };
