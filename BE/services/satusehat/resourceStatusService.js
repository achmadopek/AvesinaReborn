const dbERM = require("../../db/connection-erm");

const TABLE_MAP = {
  ServiceRequest: {
    table: "satusehat_service_request",
    uuidField: "service_request_uuid",
  },

  ImagingStudy: {
    table: "satusehat_imaging_study",
    uuidField: "imaging_study_uuid",
  },

  Observation: {
    table: "satusehat_observation",
    uuidField: "observation_uuid",
  },

  DiagnosticReport: {
    table: "satusehat_diagnostic_report",
    uuidField: "diagnostic_report_uuid",
  },
};

exports.updateResourceStatus = async ({
  resourceType,
  registry_id,
  x_ray_dtl_id,

  uuid = null,

  sync_status = "pending",
  sync_message = null,
}) => {

  const config = TABLE_MAP[resourceType];

  if (!config) {
    throw new Error(`Unknown resourceType: ${resourceType}`);
  }

  const { table, uuidField } = config;

  await dbERM.promise().query(
    `
    UPDATE ${table}
    SET
      ${uuidField} = ?,
      sync_status = ?,
      sync_message = ?,
      last_sent_at = NOW(),
      updated_at = NOW()

    WHERE registry_id = ?
      AND x_ray_dtl_id = ?
    `,
    [
      uuid,
      sync_status,
      sync_message,
      registry_id,
      x_ray_dtl_id,
    ]
  );

};