require("dotenv").config();
const queueService = require("./src/queue/queueService");

console.log("=====================================");
console.log("🚀 TEST ENCOUNTER QUEUE GENERATION");
console.log("=====================================\n");

(async () => {
  try {
    console.log("⏳ Sedang mengambil data registry dari SIMRS...");

    // Ambil registry 24 jam terakhir (bisa diubah)
    const count = await queueService.generateEncounterQueue(3);
    console.log(`📊 Total antrian yang dimasukkan: ${count} (NIK valid)`);

    console.log("\n✅ Test selesai!");
    console.log(`📊 Total antrian Encounter yang dimasukkan: ${count}`);

    console.log("\n💡 Selanjutnya jalankan worker dengan perintah:");
    console.log("   node src/workers/encounterWorker.js");

  } catch (error) {
    console.error("\n❌ Test gagal:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
})();