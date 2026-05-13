const cron = require("node-cron");

const { runWorker } = require("../workers/satusehatWorker");

cron.schedule("*/1 * * * *", async () => {

  console.log("RUN SATUSEHAT WORKER");

  try {

    await runWorker();

  } catch (err) {

    console.error("CRON ERROR:", err.message);

  }

});