// scheduler.js
require("dotenv").config();
const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ============================================
// LOGGING
// ============================================
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);

  // Tulis ke file log
  const logFile = path.join(__dirname, "logs", "scheduler.log");
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

// ============================================
// RUN BRIDGE
// ============================================
function runBridge() {
  const timestamp = new Date().toISOString();
  log(`🚀 Running bridge at ${timestamp}`);

  const startTime = Date.now();

  const child = exec("npm start", {
    cwd: __dirname,
    maxBuffer: 1024 * 1024 * 10,
  });

  child.stdout.on("data", (data) => {
    log(`📤 ${data.trim()}`);
  });

  child.stderr.on("data", (data) => {
    log(`⚠️ ${data.trim()}`);
  });

  child.on("close", (code) => {
    const duration = (Date.now() - startTime) / 1000;
    if (code === 0) {
      log(`✅ Bridge SUCCESS after ${duration}s`);
    } else {
      log(`❌ Bridge FAILED after ${duration}s (code: ${code})`);
    }
  });
}

// ============================================
// RUN RETRY (untuk data yang gagal)
// ============================================
function runRetry() {
  log(`🔄 Running retry worker`);
  const child = exec("node src/workers/retryWorker.js", { cwd: __dirname });
  child.on("close", (code) => {
    if (code === 0) {
      log(`✅ Retry SUCCESS`);
    } else {
      log(`❌ Retry FAILED (code: ${code})`);
    }
  });
}

// ============================================
// SCHEDULE
// ============================================
log("🔄 Scheduler started (3x daily + retry)");

// 🔥 06:00 - Batch 1
cron.schedule("0 6 * * *", () => {
  log("⏰ Running batch 1 (06:00)");
  runBridge();
});

// 🔥 12:00 - Batch 2
cron.schedule("0 12 * * *", () => {
  log("⏰ Running batch 2 (12:00)");
  runBridge();
});

// 🔥 18:00 - Batch 3
cron.schedule("15 13 * * *", () => {
  log("⏰ Running batch 3 (18:00)");
  runBridge();
});

// 🔥 22:00 - Retry data yang gagal
cron.schedule("0 22 * * *", () => {
  log("⏰ Running retry (22:00)");
  runRetry();
});

// 🔥 02:00 - Retry data yang gagal (final)
cron.schedule("0 2 * * *", () => {
  log("⏰ Running final retry (02:00)");
  runRetry();
});

log("📋 Jobs scheduled: 06:00, 12:00, 18:00 (bridge) | 22:00, 02:00 (retry)");
