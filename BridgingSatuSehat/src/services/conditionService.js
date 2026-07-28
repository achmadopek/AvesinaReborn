// src/services/conditionService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");

/**
 * CREATE CONDITION (ICD-10) DI SATUSEHAT
 */
async function createCondition(registryId, patientId, encounterId) {
  logger.info(`📤 Creating condition for registry: ${registryId}`);

  try {
    // 1. Ambil diagnosa dari SIMRS
    const [rows] = await simrs.query(
      `
      SELECT 
        icd.icd_10_code,
        icd.icd_10_desc,
        d.diagnosa_dt,
        d.diagnosa_id
      FROM registry r
      LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
      LEFT JOIN visite v ON uv.unit_visit_id = v.unit_visit_id
      LEFT JOIN diagnosa d ON v.visite_id = d.visite_id
      LEFT JOIN diagnosa_dtl dtl ON d.diagnosa_id = dtl.diagnosa_id
      LEFT JOIN erm_rswj.icd_mapping icd ON dtl.icd_id = icd.icd_id
      WHERE r.registry_id = ?
        AND icd.icd_10_code IS NOT NULL
        AND icd.icd_10_code != ''
      GROUP BY d.diagnosa_id
      ORDER BY d.diagnosa_dt ASC
      LIMIT 1
      `,
      [registryId],
    );

    if (rows.length === 0) {
      logger.info(`ℹ️ No diagnosis found for registry ${registryId}`);
      return { success: false, error: "No diagnosis found" };
    }

    const diagnosis = rows[0];
    logger.info(
      `📋 Diagnosis: ${diagnosis.icd_10_code} - ${diagnosis.icd_10_desc}`,
    );

    // 2. Ambil patient name
    const [patientRow] = await simrs.query(
      `SELECT patient_nm FROM patient WHERE mr_id = (SELECT mr_id FROM registry WHERE registry_id = ?)`,
      [registryId],
    );
    const patientName = patientRow[0]?.patient_nm || "Patient";

    // 3. Format tanggal
    const diagnosaDate = formatDateForSatuSehat(diagnosis.diagnosa_dt);

    // 4. Build FHIR Condition
    const fhirCondition = {
      resourceType: "Condition",
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "encounter-diagnosis",
              display: "Encounter Diagnosis",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: diagnosis.icd_10_code,
            display: diagnosis.icd_10_desc,
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
      onsetDateTime: diagnosaDate,
      recordedDate: diagnosaDate,
    };

    // 5. Send to SatuSehat
    const token = await getToken();
    const response = await axios.post(
      `${config.api.baseUrl}/Condition`,
      fhirCondition,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Condition created: ${response.data.id}`);
      return { success: true, id: response.data.id, data: response.data };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info(`ℹ️ Condition already exists`);
      return { success: true, id: "existing", existing: true };
    }

    if (error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Condition creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { createCondition };
