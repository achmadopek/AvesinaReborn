require("dotenv").config();
const dbAvesina = require("../../db/connection-avesina");
const dbErm = require("../../db/connection-erm");

async function getLabByDate(startDate, endDate) {
  const sql = `
    SELECT 
      r.registry_id,
      r.registry_dt,
      p.mr_code,
      p.patient_nm,
      su.srvc_unit_nm,
      uv.unit_visit_dt,
      ls.lab_srvc_id,
      ls.lab_srvc_code,
      ld.sample_dt,
      ld.measured_dt,
      ld.result_dt,
      ls.methode,
      ls.lab_srvc_nm,
      lr.lab_result
    FROM lab_diagnostic ld
      JOIN lab_result lr on ld.laboratory_id = lr.laboratory_id 
      JOIN laboratory_service ls on lr.lab_srvc_id = ls.lab_srvc_id
      JOIN unit_visit uv on uv.unit_visit_id = ld.unit_visit_id 
      JOIN service_unit su on su.srvc_unit_id = uv.unit_id_to 
      JOIN registry r on uv.registry_id = r.registry_id 
      JOIN patient p on r.mr_id = p.mr_id
    WHERE r.registry_dt BETWEEN ? AND ?
  `;

  const params = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
  const [rows] = await dbAvesina.promise().query(sql, params);
  return rows;
}

async function getSatuSehatMapping() {
  const [rows] = await dbErm.promise().query(`
    SELECT 
      local_id,
      local_code,
      local_display,
      snomed_code,
      snomed_display,
      loinc_code,
      loinc_display
    FROM satusehat_mapping
  `);

  const map = new Map();
  rows.forEach((r) => map.set(r.local_id, r));
  return map;
}

async function getDetailWithMapping(labId) {
  const [[row]] = await dbAvesina.promise().query(
    `
    SELECT 
      p.mr_code,
      ld.sample_dt,
      ls.lab_srvc_id,
      ls.lab_srvc_nm
    FROM lab_diagnostic ld
      JOIN lab_result lr ON ld.laboratory_id = lr.laboratory_id
      JOIN laboratory_service ls ON lr.lab_srvc_id = ls.lab_srvc_id
      JOIN unit_visit uv ON uv.unit_visit_id = ld.unit_visit_id
      JOIN registry r ON uv.registry_id = r.registry_id
      JOIN patient p ON r.mr_id = p.mr_id
    WHERE ls.lab_srvc_id = ?
    LIMIT 1
    `,
    [labId]
  );

  if (!row) return null;

  const [[mapping]] = await dbErm.promise().query(
    `
    SELECT snomed_code, snomed_display, loinc_code, loinc_display
    FROM satusehat_mapping
    WHERE local_id = ?
    LIMIT 1
    `,
    [labId]
  );

  return {
    ...row,
    snomed_code: mapping?.snomed_code ?? null,
    snomed_display: mapping?.snomed_display ?? null,
  };
}

async function sendToSatuSehat(mapping) {
  const payload = {
    resourceType: "Specimen",
    type: {
      coding: [
        {
          code: mapping.snomed_code,
          display: mapping.snomed_display,
        },
      ],
    },
    subject: {
      reference: "Patient/" + mapping.mr_code,
    },
    collection: {
      collectedDateTime: mapping.sample_dt,
    },
  };


  return { status: "simulasi success", payload };
}

async function getSatusehatByRegistryIds(registryIds) {
  if (!registryIds.length) return new Map();

  const [rows] = await dbErm.promise().query(
    `
    SELECT 
      registry_id,
      request_service_uuid,
      speciment_uuid,
      observation_uuid,
      performer_ihs_number,
      patient_ihs_number
    FROM satusehat
    WHERE registry_id IN (?)
    `,
    [registryIds]
  );

  const map = new Map();
  rows.forEach((r) => {
    map.set(r.registry_id, r);
  });

  return map;
}

module.exports = {
  getLabByDate,
  getSatuSehatMapping,
  getDetailWithMapping,
  sendToSatuSehat,
  getSatusehatByRegistryIds
};
