const dbERM = require("../db/connection-erm");

const satuSehatService = require("../services/satusehat/satusehatService");

const {
  buildPayloadFromDB
} = require("../controllers/wj_sirad/monitoringXRayController");

const {
  updateResourceStatus
} = require("../services/satusehat/resourceStatusService");

// =====================================
// FAILED
// =====================================

async function markFailed(item, error) {

  await dbERM.promise().query(
    `
    UPDATE satusehat_outbox
    SET
      retry_count = retry_count + 1,
      last_error = ?,

      status =
        CASE
          WHEN retry_count + 1 >= max_retry
          THEN 'failed'
          ELSE 'pending'
        END

    WHERE id = ?
    `,
    [
      JSON.stringify(error),
      item.id
    ]
  );

  await updateResourceStatus({
    resourceType: item.resource_type,

    registry_id: item.registry_id,
    x_ray_dtl_id: item.x_ray_dtl_id,

    sync_status: "failed",

    sync_message:
      typeof error === "string"
        ? error
        : JSON.stringify(error),
  });

}

// =====================================
// SKIPPED
// =====================================

async function markSkipped(item, reason) {

  await dbERM.promise().query(
    `
    UPDATE satusehat_outbox
    SET
      status = 'skipped',
      last_error = ?
    WHERE id = ?
    `,
    [
      JSON.stringify(reason),
      item.id
    ]
  );

  await updateResourceStatus({
    resourceType: item.resource_type,

    registry_id: item.registry_id,
    x_ray_dtl_id: item.x_ray_dtl_id,

    sync_status: "queued",

    sync_message:
      Array.isArray(reason)
        ? reason.join(", ")
        : String(reason),
  });

}

// =====================================
// PROCESS ITEM
// =====================================

async function processOutbox(item) {

  try {

    await dbERM.promise().query(
      `
      UPDATE satusehat_outbox
      SET status='processing'
      WHERE id=?
      `,
      [item.id]
    );

    let result = null;

    // =====================================
    // SERVICE REQUEST
    // =====================================

    if (item.resource_type === "ServiceRequest") {

      const payload = await buildPayloadFromDB(
        item.registry_id,
        item.x_ray_dtl_id,
        "ServiceRequest"
      );

      if (!payload.isCompleteForSatuSehat) {

        await markSkipped(item, payload.missingFields);

        return;
      }

      result = await satuSehatService.sendServiceRequest(
        payload
      );

    }

    // =====================================
    // IMAGING STUDY
    // =====================================

    if (item.resource_type === "ImagingStudy") {

      const payload = await buildPayloadFromDB(
        item.registry_id,
        item.x_ray_dtl_id,
        "ImagingStudy"
      );

      if (!payload.isCompleteForSatuSehat) {

        await markSkipped(item, payload.missingFields);

        return;
      }

      result = await satuSehatService.sendImagingStudy(
        {
          patient_ihs: payload.patient_ihs,
          encounter_uuid: payload.encounter_uuid,
          practitioner_ihs: payload.practitioner_ihs,

          service_request_id:
            payload.service_request_id,

          measured_dt: payload.measured_dt,

          modality:
            payload.modality || "CR",

          no_reg:
            payload.registry_id,
        },
        process.env.ORGANIZATION_ID
      );

    }

    // =====================================
    // OBSERVATION
    // =====================================

    if (item.resource_type === "Observation") {

      const payload = await buildPayloadFromDB(
        item.registry_id,
        item.x_ray_dtl_id,
        "Observation"
      );

      if (!payload.isCompleteForSatuSehat) {

        await markSkipped(item, payload.missingFields);

        return;
      }

      result = await satuSehatService.sendObservation(
        payload
      );

    }

    // =====================================
    // DIAGNOSTIC REPORT
    // =====================================

    if (item.resource_type === "DiagnosticReport") {

      const payload = await buildPayloadFromDB(
        item.registry_id,
        item.x_ray_dtl_id,
        "DiagnosticReport"
      );

      if (!payload.isCompleteForSatuSehat) {

        await markSkipped(item, payload.missingFields);

        return;
      }

      // OBSERVATION
      const [[obs]] = await dbERM.promise().query(
        `
        SELECT observation_uuid
        FROM satusehat_observation
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
        LIMIT 1
        `,
        [
          item.registry_id,
          item.x_ray_dtl_id,
        ]
      );

      // IMAGING STUDY
      const [[img]] = await dbERM.promise().query(
        `
        SELECT imaging_study_uuid
        FROM satusehat_imaging_study
        WHERE registry_id = ?
          AND x_ray_dtl_id = ?
        LIMIT 1
        `,
        [
          item.registry_id,
          item.x_ray_dtl_id,
        ]
      );

      // Dependency tambahan
      if (!obs?.observation_uuid) {

        await markSkipped(
          item,
          "Observation belum tersedia"
        );

        return;
      }

      // ImagingStudy optional untuk IMAGE
      const imagingId =
        img?.imaging_study_uuid || null;

      result =
        await satuSehatService.sendDiagnosticReport(
          payload,
          obs.observation_uuid,
          imagingId,
          process.env.ORGANIZATION_ID
        );

    }

    // =====================================
    // SUCCESS
    // =====================================

    if (result?.success) {

      await dbERM.promise().query(
        `
        UPDATE satusehat_outbox
        SET
          status='success',
          processed_at=NOW(),
          response_json=?,
          updated_at=NOW()
        WHERE id=?
        `,
        [
          JSON.stringify(result.data || {}),
          item.id
        ]
      );
    
      await updateResourceStatus({
        resourceType: item.resource_type,
    
        registry_id: item.registry_id,
        x_ray_dtl_id: item.x_ray_dtl_id,
    
        uuid: result.data?.id || null,
    
        sync_status: "success",
    
        sync_message: null,
      });
    
    }

  } catch (err) {

    console.error("WORKER ERROR:", err.message);
    await markFailed(item, err.message);

  }

}

// =====================================
// RUN WORKER
// =====================================

async function runWorker() {

  const [items] = await dbERM.promise().query(
    `
    SELECT *
    FROM satusehat_outbox
    WHERE status IN ('pending')
    ORDER BY created_at ASC
    LIMIT 10
    `
  );

  for (const item of items) {

    console.log(
      `[OUTBOX] PROCESS ${item.resource_type} ID=${item.id}`
    );

    await processOutbox(item);

  }

}

module.exports = {
  runWorker
};