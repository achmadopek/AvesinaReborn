// src/services/observationService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");

/**
 * VITAL SIGNS MAPPING
 */
const VITAL_SIGNS = {
  pulse: {
    code: "8867-4",
    display: "Heart rate",
    unit: "beats/minute",
    system: "/min",
  },
  respiration: {
    code: "9279-1",
    display: "Respiratory rate",
    unit: "breaths/minute",
    system: "/min",
  },
  systole: {
    code: "8480-6",
    display: "Systolic blood pressure",
    unit: "mm[Hg]",
    system: "mm[Hg]",
  },
  diastole: {
    code: "8462-4",
    display: "Diastolic blood pressure",
    unit: "mm[Hg]",
    system: "mm[Hg]",
  },
  temperature: {
    code: "8310-5",
    display: "Body temperature",
    unit: "C",
    system: "Cel",
  },
};

/**
 * CREATE OBSERVATION (Vital Sign) DI SATUSEHAT
 */
async function createObservation(
  registryId,
  patientId,
  encounterId,
  practitionerId,
) {
  logger.info(`📤 Creating observations for registry: ${registryId}`);

  try {
    // 1. Ambil vital sign dari SIMRS
    const [rows] = await simrs.query(
      `
      SELECT 
        pulse,
        respiration,
        systole,
        diastole,
        temperature,
        registry_dt
      FROM registry
      WHERE registry_id = ?
      `,
      [registryId],
    );

    if (rows.length === 0) {
      logger.info(`ℹ️ No vital sign found for registry ${registryId}`);
      return { success: false, error: "No vital sign found" };
    }

    const vitalData = rows[0];
    const registryDate = formatDateForSatuSehat(vitalData.registry_dt);

    // 2. Ambil patient name
    const [patientRow] = await simrs.query(
      `SELECT patient_nm FROM patient WHERE mr_id = (SELECT mr_id FROM registry WHERE registry_id = ?)`,
      [registryId],
    );
    const patientName = patientRow[0]?.patient_nm || "Patient";

    const results = [];
    const token = await getToken();

    // 3. Loop untuk setiap vital sign
    for (const [key, mapping] of Object.entries(VITAL_SIGNS)) {
      const value = vitalData[key];

      // Skip jika kosong atau 0
      if (!value || value === "" || parseFloat(value) === 0) {
        logger.info(`⏭️ Skipping ${key} (empty or zero)`);
        continue;
      }

      logger.info(`📊 Processing ${key}: ${value} ${mapping.unit}`);

      const fhirObservation = {
        resourceType: "Observation",
        status: "final",
        category: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: mapping.code,
              display: mapping.display,
            },
          ],
        },
        subject: {
          reference: `Patient/${patientId}`,
          display: patientName,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
        effectiveDateTime: registryDate,
        issued: registryDate,
        valueQuantity: {
          value: parseFloat(value),
          unit: mapping.unit,
          system: "http://unitsofmeasure.org",
          code: mapping.system,
        },
      };

      // Tambahkan performer jika ada practitioner
      if (practitionerId) {
        fhirObservation.performer = [
          {
            reference: `Practitioner/${practitionerId}`,
          },
        ];
      }

      try {
        const response = await axios.post(
          `${config.api.baseUrl}/Observation`,
          fhirObservation,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data && response.data.id) {
          logger.info(`✅ Observation ${key} created: ${response.data.id}`);
          results.push({ key, id: response.data.id, success: true });
        }
      } catch (error) {
        if (error.response?.status === 409) {
          logger.info(`ℹ️ Observation ${key} already exists`);
          results.push({ key, success: true, existing: true });
        } else {
          logger.error(
            `❌ Observation ${key} failed:`,
            error.response?.data || error.message,
          );
          results.push({
            key,
            success: false,
            error: error.response?.data || error.message,
          });
        }
      }
    }

    return { success: true, results };
  } catch (error) {
    logger.error(
      `❌ Observation creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { createObservation, VITAL_SIGNS };
