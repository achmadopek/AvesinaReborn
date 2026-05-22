require("dotenv").config();

const {
  getPendingQueue,
  lockQueue,
  markDone,
  markFailed,
} = require("../queue/queueRepository");

const WORKER_NAME = "main-worker";

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const processQueue = async () => {

  let queue = null;

  try {

    queue = await getPendingQueue();

    if (!queue) {
      console.log("No pending queue...");
      return;
    }

    console.log("QUEUE FOUND:");
    console.log(queue.id, queue.resource_type);

    await lockQueue(queue.id, WORKER_NAME);

    console.log("PROCESSING...");

    await sleep(2000);

    await markDone(queue.id);

    console.log("DONE:", queue.id);

  } catch (err) {

    console.error("WORKER ERROR:", err.message);

    if (queue?.id) {
      await markFailed(queue.id, err.message);
    }
  }
};

setInterval(async () => {
  await processQueue();
}, 5000);

console.log("Queue worker started...");