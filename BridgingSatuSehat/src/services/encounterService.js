// src/services/encounterService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const simrs = require("../db/simrs");

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

async function createEncounter(registryData, patientId) {
  logger.info(`📤 Processing encounter: ${registryData.registry_id}`);

  // CEK DUPLIKAT
  const existing = await checkExistingEncounter(registryData.registry_id);
  if (existing.exists) {
    logger.info(`⏭️ Encounter already exists (ID: ${existing.id})`);
    return { success: true, id: existing.id, existing: true };
  }

  // TANGGAL
  let startDate = registryData.registry_dt
    ? new Date(registryData.registry_dt)
    : new Date();

  const now = new Date();
  if (startDate.getTime() > now.getTime()) {
    logger.warn(`⚠️ Future registration detected, skip`);
    return { success: false, error: "Future registration" };
  }

  const minDate = new Date("2014-06-03");
  if (startDate < minDate) {
    logger.warn(`⚠️ Date is too old, using current date`);
    startDate = now;
  }

  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, "0");
  const day = String(startDate.getDate()).padStart(2, "0");
  const hours = String(startDate.getHours()).padStart(2, "0");
  const minutes = String(startDate.getMinutes()).padStart(2, "0");
  const seconds = String(startDate.getSeconds()).padStart(2, "0");
  const formattedStart = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

  // ============================================
  // BUILD BASE ENCOUNTER
  // ============================================
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
    period: {
      start: formattedStart,
    },
    statusHistory: [
      {
        status: "arrived",
        period: {
          start: formattedStart,
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
  };

  // ============================================
  // CARI PRACTITIONER (DENGAN LAB FALLBACK)
  // ============================================
  let practitionerIhs = null;
  let practitionerName = null;

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
    
    -- 🔥 PATOLOGI (PA)
    LEFT JOIN patologi_hdr ph ON uv.unit_visit_id = ph.unit_visit_id
    LEFT JOIN employee patologi_emp ON ph.expert = patologi_emp.employee_id
    
    -- 🔥 LAB PK (dengan role LAB_PJ_SUPERVISOR)
    LEFT JOIN lab_diagnostic ld ON uv.unit_visit_id = ld.unit_visit_id
    LEFT JOIN lab_actors la ON ld.laboratory_id = la.laboratory_id AND la.role = 'LAB_PJ_SUPERVISOR'
    LEFT JOIN employee lab_supervisor ON la.employee_id = lab_supervisor.employee_id
    
    -- 🔥 LAB ACTORS (fallback)
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

    const [rows] = await simrs.query(query, [registryData.registry_id]);

    if (rows && rows.length > 0 && rows[0].satusehat_ihs_number) {
      practitionerIhs = rows[0].satusehat_ihs_number;
      practitionerName = rows[0].employee_nm;
      logger.info(
        `👨‍⚕️ Practitioner: ${practitionerName} (${practitionerIhs}) - sumber: ${rows[0].sumber || "unknown"}`,
      );
    } else {
      logger.info(`👨‍⚕️ No practitioner found`);
    }
  } catch (e) {
    logger.warn(`⚠️ Error finding practitioner: ${e.message}`);
  }

  // ============================================
  // TAMBAHKAN PARTICIPANT (HANYA JIKA ADA)
  // ============================================
  if (practitionerIhs) {
    fhirEncounter.participant = [
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
          reference: `Practitioner/${practitionerIhs}`,
          display: practitionerName || "Dokter",
        },
      },
    ];
  }

  // ============================================
  // 🔥 LOCATION - DENGAN FALLBACK IGD
  // ============================================
  let locationUuid = registryData.satusehat_uuid || null;
  let locationName = registryData.srvc_unit_nm || null;

  // 🔥 Jika tidak ada UUID, gunakan fallback IGD
  if (!locationUuid || locationUuid.trim() === "") {
    locationUuid = "af64efb9-32d6-4200-8e1b-f638708009b5"; // IGD
    locationName = "IGD (Fallback)";
    logger.info(`📍 Using fallback location: IGD (${locationUuid})`);
  }

  // Kirim location
  if (locationUuid && locationUuid.trim() !== "") {
    fhirEncounter.location = [
      {
        location: {
          reference: `Location/${locationUuid}`,
          display: locationName || "Location",
        },
      },
    ];
    logger.info(`📍 Location: ${locationName} (${locationUuid})`);
  } else {
    logger.warn(`⚠️ No location available, encounter will fail`);
    return { success: false, error: "No location available" };
  }

  // ============================================
  // VALIDASI PRACTITIONER
  // ============================================
  if (!practitionerIhs) {
    logger.warn(`⚠️ No practitioner found, skipping`);
    return { success: false, error: "No practitioner found" };
  }

  // ============================================
  // SEND TO SATUSEHAT
  // ============================================
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
      return { success: true, id: response.data.id, data: response.data };
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

module.exports = { createEncounter, checkExistingEncounter };
