// src/workers/retryWorker.js
require("dotenv").config();
const { processBridging } = require("../index");

(async () => {
  console.log("🔄 RETRY WORKER STARTED");
  console.log("🔄 Processing failed registrations...");

  try {
    // Jalankan bridging ulang untuk data yang gagal
    await processBridging();
    console.log("✅ RETRY WORKER COMPLETED");
  } catch (error) {
    console.error("❌ RETRY WORKER FAILED:", error.message);
  }

  process.exit(0);
})();
