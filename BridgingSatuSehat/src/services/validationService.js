// src/services/validationService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");

/**
 * VALIDASI LOCATION
 * Cek apakah Location UUID valid di SatuSehat
 */
async function validateLocation(locationUuid) {
  if (!locationUuid || locationUuid.trim() === "") {
    return { valid: false, reason: "Location UUID kosong" };
  }

  try {
    const token = await getToken();
    const response = await axios.get(
      `${config.api.baseUrl}/Location/${locationUuid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.data && response.data.status === "active") {
      logger.info(`✅ Location ${locationUuid} is active`);
      return { valid: true, data: response.data };
    } else {
      logger.warn(`⚠️ Location ${locationUuid} is not active`);
      return { valid: false, reason: "Location not active" };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logger.warn(`⚠️ Location ${locationUuid} not found in SatuSehat`);
      return { valid: false, reason: "Location not found" };
    }
    logger.error(`❌ Error validating location: ${error.message}`);
    return { valid: false, reason: error.message };
  }
}

/**
 * VALIDASI PRACTITIONER
 * Cek apakah Practitioner valid di SatuSehat (by NIK)
 */
async function validatePractitioner(nik) {
  if (!nik || nik.trim() === "") {
    return { valid: false, reason: "NIK kosong" };
  }

  try {
    const token = await getToken();
    const response = await axios.get(`${config.api.baseUrl}/Practitioner`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        identifier: `https://fhir.kemkes.go.id/id/nik|${nik}`,
      },
    });

    if (response.data?.total > 0) {
      const practitioner = response.data.entry[0].resource;
      logger.info(`✅ Practitioner with NIK ${nik} found: ${practitioner.id}`);
      return {
        valid: true,
        id: practitioner.id,
        name: practitioner.name?.[0]?.text || null,
        data: practitioner,
      };
    } else {
      logger.warn(`⚠️ Practitioner with NIK ${nik} not found`);
      return { valid: false, reason: "Practitioner not found" };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return { valid: false, reason: "Practitioner not found" };
    }
    logger.error(`❌ Error validating practitioner: ${error.message}`);
    return { valid: false, reason: error.message };
  }
}

/**
 * VALIDASI PATIENT
 * Cek apakah Patient valid di SatuSehat (by NIK)
 * Kembalikan IHS Number jika ditemukan
 */
async function validatePatient(nik) {
  if (!nik || nik.trim() === "") {
    return { valid: false, reason: "NIK kosong", ihsNumber: null };
  }

  try {
    const token = await getToken();
    const response = await axios.get(`${config.api.baseUrl}/Patient`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        identifier: `https://fhir.kemkes.go.id/id/nik|${nik}`,
      },
    });

    if (response.data?.entry?.length > 0) {
      const patient = response.data.entry[0].resource;
      const ihsNumber =
        patient.identifier?.find(
          (i) => i.system?.includes("nik") || i.system?.includes("ihs-number"),
        )?.value || patient.id;

      logger.info(`✅ Patient with NIK ${nik} found: ${patient.id}`);
      return {
        valid: true,
        id: patient.id,
        ihsNumber: ihsNumber,
        data: patient,
      };
    } else {
      logger.warn(`⚠️ Patient with NIK ${nik} not found`);
      return { valid: false, reason: "Patient not found", ihsNumber: null };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return { valid: false, reason: "Patient not found", ihsNumber: null };
    }
    logger.error(`❌ Error validating patient: ${error.message}`);
    return { valid: false, reason: error.message, ihsNumber: null };
  }
}

module.exports = { validateLocation, validatePractitioner, validatePatient };
