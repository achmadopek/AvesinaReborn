// src/services/encounterService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");
const {
  validateLocation,
  validatePractitioner,
} = require("./validationService");

/**
 * CEK APAKAH ENCOUNTER SUDAH ADA
 */
async function checkExistingEncounter(registryId) {
  try {
    const token = await getToken();
    const organizationId = config.api.orgId;

    const response = await axios.get(`${config.api.baseUrl}/Encounter`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        identifier: `http://sys-ids.kemkes.go.id/encounter/${organizationId}|${registryId}`,
      },
    });

    if (response.data?.entry?.length > 0) {
      const encounter = response.data.entry[0].resource;
      logger.info(`ℹ️ Encounter already exists: ${encounter.id}`);
      return { exists: true, id: encounter.id, data: encounter };
    }
    return { exists: false };
  } catch (error) {
    if (error.response?.status === 404) {
      return { exists: false };
    }
    logger.warn(`⚠️ Error checking encounter: ${error.message}`);
    return { exists: false, error: error.message };
  }
}

/**
 * CARI PRACTITIONER DARI SIMRS
 * Prioritas: Visite → Doctor Mutation → DPJP → Unit Visit → Lab
 */
async function findPractitioner(registryId) {
  try {
    const query = `
    SELECT 
      COALESCE(
        v_emp.satusehat_ihs_number,
        dm_emp.satusehat_ihs_number,
        dpjp_emp.satusehat_ihs_number,
        uv_emp.satusehat_ihs_number,
        patologi_emp.satusehat_ihs_number,
        lab_supervisor.satusehat_ihs_number,
        lab_actors_emp.satusehat_ihs_number
      ) AS satusehat_ihs_number,
      COALESCE(
        v_emp.employee_nm,
        dm_emp.employee_nm,
        dpjp_emp.employee_nm,
        uv_emp.employee_nm,
        patologi_emp.employee_nm,
        lab_supervisor.employee_nm,
        lab_actors_emp.employee_nm
      ) AS employee_nm,
      COALESCE(
        v_emp.nik,
        dm_emp.nik,
        dpjp_emp.nik,
        uv_emp.nik,
        patologi_emp.nik,
        lab_supervisor.nik,
        lab_actors_emp.nik
      ) AS nik,
      CASE 
        WHEN v_emp.satusehat_ihs_number IS NOT NULL THEN 'visite'
        WHEN dm_emp.satusehat_ihs_number IS NOT NULL THEN 'doctor_mutation'
        WHEN dpjp_emp.satusehat_ihs_number IS NOT NULL THEN 'dpjp'
        WHEN uv_emp.satusehat_ihs_number IS NOT NULL THEN 'unit_visit'
        WHEN patologi_emp.satusehat_ihs_number IS NOT NULL THEN 'patologi'
        WHEN lab_supervisor.satusehat_ihs_number IS NOT NULL THEN 'lab_supervisor'
        WHEN lab_actors_emp.satusehat_ihs_number IS NOT NULL THEN 'lab_actors'
        ELSE 'none'
      END AS sumber
    FROM registry r
    LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
    LEFT JOIN employee uv_emp ON uv.employee_entry = uv_emp.employee_id
    LEFT JOIN visite v ON uv.unit_visit_id = v.unit_visit_id
    LEFT JOIN employee v_emp ON v.employee_id = v_emp.employee_id
    LEFT JOIN doctor_mutation dm ON uv.unit_visit_id = dm.unit_visit_id
    LEFT JOIN employee dm_emp ON dm.employee_id = dm_emp.employee_id
    LEFT JOIN employee dpjp_emp ON r.employee_respon = dpjp_emp.employee_id
    
    -- PATOLOGI (PA)
    LEFT JOIN patologi_hdr ph ON uv.unit_visit_id = ph.unit_visit_id
    LEFT JOIN employee patologi_emp ON ph.expert = patologi_emp.employee_id
    
    -- LAB PK (LAB_PJ_SUPERVISOR)
    LEFT JOIN lab_diagnostic ld ON uv.unit_visit_id = ld.unit_visit_id
    LEFT JOIN lab_actors la ON ld.laboratory_id = la.laboratory_id AND la.role = 'LAB_PJ_SUPERVISOR'
    LEFT JOIN employee lab_supervisor ON la.employee_id = lab_supervisor.employee_id
    
    -- LAB ACTORS (fallback)
    LEFT JOIN lab_actors la2 ON ld.laboratory_id = la2.laboratory_id
    LEFT JOIN employee lab_actors_emp ON la2.employee_id = lab_actors_emp.employee_id
    
    WHERE r.registry_id = ?
      AND (
        v_emp.satusehat_ihs_number IS NOT NULL
        OR dm_emp.satusehat_ihs_number IS NOT NULL
        OR dpjp_emp.satusehat_ihs_number IS NOT NULL
        OR uv_emp.satusehat_ihs_number IS NOT NULL
        OR patologi_emp.satusehat_ihs_number IS NOT NULL
        OR lab_supervisor.satusehat_ihs_number IS NOT NULL
        OR lab_actors_emp.satusehat_ihs_number IS NOT NULL
      )
    ORDER BY 
      CASE 
        WHEN v_emp.satusehat_ihs_number IS NOT NULL THEN 1
        WHEN dm_emp.satusehat_ihs_number IS NOT NULL THEN 2
        WHEN dpjp_emp.satusehat_ihs_number IS NOT NULL THEN 3
        WHEN uv_emp.satusehat_ihs_number IS NOT NULL THEN 4
        WHEN patologi_emp.satusehat_ihs_number IS NOT NULL THEN 5
        WHEN lab_supervisor.satusehat_ihs_number IS NOT NULL THEN 6
        WHEN lab_actors_emp.satusehat_ihs_number IS NOT NULL THEN 7
        ELSE 8
      END
    LIMIT 1
  `;

    const [rows] = await simrs.query(query, [registryId]);

    if (rows && rows.length > 0 && rows[0].satusehat_ihs_number) {
      return {
        ihs: rows[0].satusehat_ihs_number,
        name: rows[0].employee_nm,
        nik: rows[0].nik,
        source: rows[0].sumber,
      };
    }
    return null;
  } catch (error) {
    logger.warn(`⚠️ Error finding practitioner: ${error.message}`);
    return null;
  }
}

/**
 * CARI LOCATION UUID DARI SIMRS
 */
async function findLocation(registryId, unitIdTo) {
  try {
    // Coba dari unit_visit
    const [rows] = await simrs.query(
      `
      SELECT s_to.satusehat_uuid, s_to.srvc_unit_nm
      FROM registry r
      LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
      LEFT JOIN service_unit s_to ON uv.unit_id_to = s_to.srvc_unit_id
      WHERE r.registry_id = ?
        AND s_to.satusehat_uuid IS NOT NULL
        AND s_to.satusehat_uuid != ''
      LIMIT 1
      `,
      [registryId],
    );

    if (rows && rows.length > 0) {
      return { uuid: rows[0].satusehat_uuid, name: rows[0].srvc_unit_nm };
    }
    return null;
  } catch (error) {
    logger.warn(`⚠️ Error finding location: ${error.message}`);
    return null;
  }
}

/**
 * CREATE ENCOUNTER (arrived)
 */
async function createEncounter(registryData, patientId) {
  logger.info(`📤 Creating encounter: ${registryData.registry_id}`);

  // CEK DUPLIKAT
  const existing = await checkExistingEncounter(registryData.registry_id);
  if (existing.exists) {
    logger.info(`⏭️ Encounter already exists (ID: ${existing.id})`);
    return { success: true, id: existing.id, existing: true };
  }

  // CARI PRACTITIONER
  const practitioner = await findPractitioner(registryData.registry_id);
  let practitionerId = null;
  let practitionerName = null;
  let practitionerNik = null;

  if (practitioner) {
    // VALIDASI PRACTITIONER KE SATUSEHAT
    const validation = await validatePractitioner(practitioner.nik);
    if (validation.valid) {
      practitionerId = practitioner.ihs || validation.id;
      practitionerName = practitioner.name || validation.name;
      practitionerNik = practitioner.nik;
      logger.info(
        `👨‍⚕️ Practitioner validated: ${practitionerName} (${practitionerId})`,
      );
    } else {
      logger.warn(`⚠️ Practitioner validation failed: ${validation.reason}`);
      // Tetap lanjut dengan data dari SIMRS (fallback)
      practitionerId = practitioner.ihs;
      practitionerName = practitioner.name;
      practitionerNik = practitioner.nik;
    }
  } else {
    logger.warn(
      `⚠️ No practitioner found for registry ${registryData.registry_id}`,
    );
    return { success: false, error: "No practitioner found" };
  }

  // CARI LOCATION
  let locationUuid = registryData.satusehat_uuid || null;
  let locationName = registryData.srvc_unit_nm || null;

  if (!locationUuid) {
    const location = await findLocation(
      registryData.registry_id,
      registryData.unit_id_to,
    );
    if (location) {
      locationUuid = location.uuid;
      locationName = location.name;
    }
  }

  // VALIDASI LOCATION KE SATUSEHAT
  if (locationUuid) {
    const validation = await validateLocation(locationUuid);
    if (!validation.valid) {
      logger.warn(`⚠️ Location validation failed: ${validation.reason}`);
      // Gunakan fallback IGD
      locationUuid = "af64efb9-32d6-4200-8e1b-f638708009b5";
      locationName = "IGD (Fallback)";
    }
  } else {
    // Fallback IGD
    locationUuid = "af64efb9-32d6-4200-8e1b-f638708009b5";
    locationName = "IGD (Fallback)";
  }

  // FORMAT TANGGAL
  const registryDate = formatDateForSatuSehat(registryData.registry_dt);

  // BUILD FHIR ENCOUNTER
  const fhirEncounter = {
    resourceType: "Encounter",
    status: "arrived",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: registryData.in_out_sts === "I" ? "IMP" : "AMB",
      display: registryData.in_out_sts === "I" ? "inpatient" : "ambulatory",
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: registryData.nm_pasien || "Patient",
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "ATND",
                display: "attender",
              },
            ],
          },
        ],
        individual: {
          reference: `Practitioner/${practitionerId}`,
          display: practitionerName || "Dokter",
        },
      },
    ],
    period: {
      start: registryDate,
    },
    statusHistory: [
      {
        status: "arrived",
        period: {
          start: registryDate,
        },
      },
    ],
    serviceProvider: {
      reference: `Organization/${config.api.orgId}`,
    },
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/encounter/${config.api.orgId}`,
        value: registryData.registry_id,
      },
    ],
    location: [
      {
        location: {
          reference: `Location/${locationUuid}`,
          display: locationName || "Location",
        },
      },
    ],
  };

  // SEND TO SATUSEHAT
  try {
    const token = await getToken();
    const response = await axios.post(
      `${config.api.baseUrl}/Encounter`,
      fhirEncounter,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Encounter created: ${response.data.id}`);
      return {
        success: true,
        id: response.data.id,
        data: response.data,
        practitionerId,
        practitionerName,
        locationUuid,
        locationName,
      };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const isDuplicate = issues.some(
        (i) => i.details?.text?.includes("duplicate") || i.code === "duplicate",
      );

      if (isDuplicate) {
        logger.info(`ℹ️ Encounter already exists (duplicate detected)`);
        return { success: true, id: "existing", existing: true };
      }

      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }

    logger.error(
      `❌ Encounter creation failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = {
  createEncounter,
  checkExistingEncounter,
  findPractitioner,
  findLocation,
};
