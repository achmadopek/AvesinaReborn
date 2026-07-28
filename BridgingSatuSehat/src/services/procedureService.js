// src/services/procedureService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");

/**
 * CREATE PROCEDURE (ICD-9) DI SATUSEHAT
 */
async function createProcedure(registryId, patientId, encounterId) {
  logger.info(`📤 Creating procedure for registry: ${registryId}`);

  try {
    // 1. Ambil prosedur/tindakan dari SIMRS
    const [rows] = await simrs.query(
      `
      SELECT 
        icd.icd_9cm_code,
        icd.icd_9cm_desc,
        b.billing_dt
      FROM registry r
      LEFT JOIN billing b ON r.registry_id = b.registry_id
      LEFT JOIN erm_rswj.master_icd_9cm icd ON b.medical_service_id = icd.icd_9cm_avesina
      WHERE r.registry_id = ?
        AND icd.icd_9cm_code IS NOT NULL
        AND icd.icd_9cm_code != ''
      GROUP BY b.billing_id
      ORDER BY b.billing_dt ASC
      LIMIT 1
      `,
      [registryId],
    );

    if (rows.length === 0) {
      logger.info(`ℹ️ No procedure found for registry ${registryId}`);
      return { success: false, error: "No procedure found" };
    }

    const procedure = rows[0];
    logger.info(
      `📋 Procedure: ${procedure.icd_9cm_code} - ${procedure.icd_9cm_desc}`,
    );

    // 2. Ambil patient name
    const [patientRow] = await simrs.query(
      `SELECT patient_nm FROM patient WHERE mr_id = (SELECT mr_id FROM registry WHERE registry_id = ?)`,
      [registryId],
    );
    const patientName = patientRow[0]?.patient_nm || "Patient";

    // 3. Format tanggal
    const procedureDate = formatDateForSatuSehat(
      procedure.billing_dt || new Date(),
    );

    // 4. Build FHIR Procedure
    const fhirProcedure = {
      resourceType: "Procedure",
      status: "completed",
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-9-cm",
            code: procedure.icd_9cm_code,
            display: procedure.icd_9cm_desc,
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
      performedDateTime: procedureDate,
    };

    // 5. Send to SatuSehat
    const token = await getToken();
    const response = await axios.post(
      `${config.api.baseUrl}/Procedure`,
      fhirProcedure,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Procedure created: ${response.data.id}`);
      return { success: true, id: response.data.id, data: response.data };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info(`ℹ️ Procedure already exists`);
      return { success: true, id: "existing", existing: true };
    }

    if (error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Procedure creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { createProcedure };
