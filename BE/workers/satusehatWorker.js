const dbERM = require("../db/connection-erm");

const satuSehatService = require("../services/satusehat/satusehatService");

const {
  buildPayloadFromDB
} = require("../controllers/wj_sirad/monitoringXRayController");

// =====================================
// FAILED
// =====================================

async function markFailed(id, error) {

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
    [error, id]
  );

}

// =====================================
// SKIPPED
// =====================================

async function markSkipped(id, reason) {

  await dbERM.promise().query(
    `
    UPDATE satusehat_outbox
    SET
      status = 'skipped',
      last_error = ?
    WHERE id = ?
    `,
    [JSON.stringify(reason), id]
  );

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

        await markSkipped(item.id, payload.missingFields);

        return;
      }

      result = await satuSehatService.sendServiceRequest(payload);

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

    } else {

      await markFailed(item.id, result?.error || "Unknown Error");

    }

  } catch (err) {

    console.error("WORKER ERROR:", err.message);

    await markFailed(item.id, err.message);

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