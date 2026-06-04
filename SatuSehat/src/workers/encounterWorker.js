require("dotenv").config();

const queueRepo = require("../queue/queueRepository");
const queueService = require("../queue/queueService");

const WORKER_NAME = "encounter-worker";

const MAX_RETRY = 5;
const INTERVAL = 5000;

// ========================================
// PROCESS SINGLE QUEUE
// ========================================
const processQueue = async () => {

  let queue = null;

  try {

    // ========================================
    // GET NEXT QUEUE
    // ========================================
    queue = await queueRepo.getPendingQueue();

    if (!queue) {
      return;
    }

    // ========================================
    // LOCK QUEUE
    // ========================================
    await queueRepo.lockQueue(
      queue.id,
      WORKER_NAME
    );

    console.log(
      `🔄 [${WORKER_NAME}] Processing: ` +
      `${queue.resource_type} - ` +
      `${queue.local_resource_id}`
    );

    // ========================================
    // PROCESS RESOURCE
    // ========================================
    const result =
      await queueService.processQueue(queue);

    // ========================================
    // SKIPPED RESOURCE
    // ========================================
    if (result?.skipped) {

      const retryable =
        result.retryable === true;

      const final =
        result.final === true;

      // FINAL SKIP
      if (final) {

        await queueRepo.update(queue.id, {
          status: "done",
          processed_at: new Date(),
          locked_by: null,
          locked_at: null,
          last_error: result.message || null
        });

        console.log(
          `⏭️ Queue final skipped: ${queue.local_resource_id}`
        );

        return;
      }

      // RETRYABLE SKIP
      if (retryable) {

        const nextRetry =
          (queue.retry_count || 0) + 1;

        const nextStatus =
          nextRetry >= MAX_RETRY
            ? "dead"
            : "failed";

        await queueRepo.update(queue.id, {
          status: nextStatus,
          retry_count: nextRetry,
          last_error: result.message || "Retryable skip",
          locked_by: null,
          locked_at: null
        });

        console.log(
          `⏭️ Queue retryable skip: ${queue.local_resource_id} ` +
          `(${nextRetry}/${MAX_RETRY})`
        );

        return;
      }

      // default skip -> done
      await queueRepo.update(queue.id, {
        status: "done",
        processed_at: new Date(),
        locked_by: null,
        locked_at: null,
        last_error: result.message || null
      });

      return;
    }

    // ========================================
    // SUCCESS
    // ========================================
    await queueRepo.update(queue.id, {

      status: "done",

      processed_at: new Date(),

      locked_by: null,

      locked_at: null,

      last_error: null
    });

    console.log(
      `✅ Queue done: ` +
      `${queue.local_resource_id}`
    );

  } catch (err) {

    console.error(
      `❌ [${WORKER_NAME}] Error:`,
      err.message
    );

    if (!queue?.id) {
      return;
    }

    const nextRetry =
      (queue.retry_count || 0) + 1;

    const nextStatus =
      nextRetry >= MAX_RETRY
        ? "dead"
        : "failed";

    await queueRepo.update(queue.id, {

      status: nextStatus,

      retry_count: nextRetry,

      last_error:
        err.message || "Unknown Error",

      locked_by: null,

      locked_at: null
    });

    console.log(
      `⚠️ Queue ${queue.id} -> ${nextStatus} ` +
      `(retry ${nextRetry}/${MAX_RETRY})`
    );
  }
};

// ========================================
// WORKER LOOP
// ========================================
const startWorker = async () => {

  console.log(
    `🚀 Encounter Worker started as ${WORKER_NAME}...`
  );

  while (true) {

    try {

      await processQueue();

    } catch (err) {

      console.error(
        `💥 Worker crash:`,
        err.message
      );
    }

    await new Promise(resolve =>
      setTimeout(resolve, INTERVAL)
    );
  }
};

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on("SIGINT", async () => {

  console.log(
    `\n🛑 Stopping ${WORKER_NAME}...`
  );

  process.exit(0);
});

process.on("SIGTERM", async () => {

  console.log(
    `\n🛑 SIGTERM received. Exiting...`
  );

  process.exit(0);
});

// ========================================
// START
// ========================================
startWorker();