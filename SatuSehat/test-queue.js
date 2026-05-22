require("dotenv").config();

const {
  insertQueue,
  getPendingQueue,
} = require("./src/queue/queueRepository");

(async () => {
  try {

    const inserted = await insertQueue({
      resource_type: "Encounter",
      local_resource_id: "REG-001",
      payload: {
        test: true
      }
    });

    console.log("INSERTED:");
    console.log(inserted);

    const pending = await getPendingQueue();

    console.log("PENDING:");
    console.log(pending);

  } catch (err) {
    console.error(err);
  }
})();