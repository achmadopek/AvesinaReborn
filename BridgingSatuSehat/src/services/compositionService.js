// src/services/compositionService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");

/**
 * CREATE COMPOSITION (Resume Medis) DI SATUSEHAT
 */
async function createComposition(
  registryId,
  patientId,
  encounterId,
  practitionerId,
) {
  logger.info(`📤 Creating composition for registry: ${registryId}`);

  try {
    // 1. Ambil data resume dari SIMRS
    const [rows] = await simrs.query(
      `
      SELECT 
        r.registry_id,
        r.registry_dt,
        r.complaint,
        p.patient_nm,
        p.id_number AS nik,
        p.birth_dt,
        p.gender,
        e.employee_nm AS practitioner_name,
        e.satusehat_ihs_number AS practitioner_ihs
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
      LEFT JOIN visite v ON uv.unit_visit_id = v.unit_visit_id
      LEFT JOIN employee e ON v.employee_id = e.employee_id
      WHERE r.registry_id = ?
      LIMIT 1
      `,
      [registryId],
    );

    if (rows.length === 0) {
      logger.info(`ℹ️ No data found for registry ${registryId}`);
      return { success: false, error: "No data found" };
    }

    const data = rows[0];
    const registryDate = formatDateForSatuSehat(data.registry_dt || new Date());

    // 2. Ambil diagnosis
    const [diagnosisRows] = await simrs.query(
      `
      SELECT 
        icd.icd_10_code,
        icd.icd_10_desc
      FROM registry r
      LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
      LEFT JOIN visite v ON uv.unit_visit_id = v.unit_visit_id
      LEFT JOIN diagnosa d ON v.visite_id = d.visite_id
      LEFT JOIN diagnosa_dtl dtl ON d.diagnosa_id = dtl.diagnosa_id
      LEFT JOIN erm_rswj.icd_mapping icd ON dtl.icd_id = icd.icd_id
      WHERE r.registry_id = ?
        AND icd.icd_10_code IS NOT NULL
      LIMIT 1
      `,
      [registryId],
    );

    const diagnosisText =
      diagnosisRows.length > 0
        ? `${diagnosisRows[0].icd_10_code} - ${diagnosisRows[0].icd_10_desc}`
        : "Tidak ada diagnosa";

    // 3. Build FHIR Composition
    const fhirComposition = {
      resourceType: "Composition",
      status: "final",
      type: {
        coding: [
          {
            system: "http://loinc.org",
            code: "18842-5",
            display: "Discharge summary",
          },
        ],
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: data.patient_nm || "Patient",
      },
      encounter: {
        reference: `Encounter/${encounterId}`,
        display: `Kunjungan ${data.patient_nm} tanggal ${registryDate}`,
      },
      date: registryDate,
      author: [
        {
          reference: `Practitioner/${practitionerId || "N10000001"}`,
          display: data.practitioner_name || "Dokter",
        },
      ],
      title: "Resume Medis Rawat Jalan",
      custodian: {
        reference: `Organization/${config.api.orgId}`,
      },
      section: [
        {
          title: "Identitas Pasien",
          text: {
            status: "generated",
            div: `<div><p><b>Nama:</b> ${data.patient_nm || "-"}</p>
                  <p><b>NIK:</b> ${data.nik || "-"}</p>
                  <p><b>Tanggal Lahir:</b> ${data.birth_dt ? new Date(data.birth_dt).toISOString().split("T")[0] : "-"}</p>
                  <p><b>Gender:</b> ${data.gender === "L" ? "Laki-laki" : "Perempuan"}</p></div>`,
          },
        },
        {
          title: "Diagnosis",
          text: {
            status: "generated",
            div: `<div><p>${diagnosisText}</p></div>`,
          },
        },
        {
          title: "Keluhan",
          text: {
            status: "generated",
            div: `<div><p>${data.complaint || "Tidak ada keluhan"}</p></div>`,
          },
        },
      ],
    };

    // 4. Send to SatuSehat
    const token = await getToken();
    const response = await axios.post(
      `${config.api.baseUrl}/Composition`,
      fhirComposition,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Composition created: ${response.data.id}`);
      return { success: true, id: response.data.id, data: response.data };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info(`ℹ️ Composition already exists`);
      return { success: true, id: "existing", existing: true };
    }

    if (error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Composition creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { createComposition };
