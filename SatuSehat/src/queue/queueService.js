const registryRepo = require("../database/registryRepository");

const {
  patientService,
  encounterService
} = require("../services/satusehat");

const { 
  insertQueue, 
  findExistingQueue 
} = require("./queueRepository");

const resourceStatus =
  require("../database/resourceStatusRepository");

class QueueService {

  // =========================================
  // GENERATE ENCOUNTER QUEUE
  // =========================================
  async generateEncounterQueue(days = 1) {

    console.log(
      `🔄 Mengambil registry ${days} hari terakhir...`
    );

    const registries =
      await registryRepo.getTodaysRegistry(100);

    let inserted = 0;
    let skipped = 0;

    for (const reg of registries) {

      const nik =
        reg.nik?.trim();

      // =========================
      // SKIP NIK KOSONG
      // =========================
      if (!nik) {

        console.log(
          `⏭️ SKIP Registry ${reg.registry_id} ` +
          `(NIK kosong)`
        );

        skipped++;

        continue;
      }

      const existingPending =
        await findExistingQueue(
          "Encounter",
          reg.registry_id
        );

      if (existingPending) {

        console.log(
          `⏭️ Queue ${reg.registry_id} masih pending`
        );

        skipped++;

        continue;
      }

      try {

        await insertQueue({
          resource_type: "Encounter",
          local_resource_id: reg.registry_id,
          patient_local_id: reg.mr_id,
          payload: reg,
          priority: 1
        });

        inserted++;

      } catch (err) {

        console.error(
          `❌ Gagal insert queue ${reg.registry_id}:`,
          err.message
        );
      }
    }

    console.log(
      `✅ ${inserted} queue berhasil dibuat`
    );

    console.log(
      `⏭️ ${skipped} queue di-skip`
    );

    return {
      inserted,
      skipped
    };
  }

  // =========================================
  // PROCESS QUEUE
  // =========================================
  async processQueue(queue) {

    console.log(
      `🚀 Processing queue ID: ${queue.id} | ` +
      `${queue.resource_type} | ` +
      `${queue.local_resource_id}`
    );

    try {

      switch (queue.resource_type) {

        case "Encounter":
          return await this.processEncounter(queue);

        default:
          throw new Error(
            `Unknown resource_type: ${queue.resource_type}`
          );
      }

    } catch (err) {

      console.error(
        `❌ Gagal proses queue ${queue.id}:`,
        err.message
      );

      throw err;
    }
  }

  // =========================================
  // PROCESS ENCOUNTER
  // =========================================
  async processEncounter(queue) {

    const registry =
      queue.payload;

    const nik =
      registry.nik?.trim();

    // =========================
    // VALIDASI NIK
    // =========================
    if (!nik) {

      console.log(
        `⏭️ SKIP Encounter ${registry.registry_id} ` +
        `(NIK kosong)`
      );

      await resourceStatus.create({
        resource_type: "Encounter",
        local_resource_id: registry.registry_id,
        status: "skipped",
        last_error: "NIK kosong",
        request_payload: registry
      });

      return {
        skipped: true,
        message: "NIK kosong"
      };
    }

    // =========================
    // STEP 1 - GET/CREATE PATIENT
    // =========================
    console.log(
      `👤 Processing Patient ` +
      `NIK: ${nik} | ` +
      `MR: ${registry.mr_id}`
    );

    const patientResult =
      await patientService.getOrCreatePatient(
        registry
      );

    if (!patientResult?.satusehatId) {

      throw new Error(
        "Gagal mendapatkan Patient ID"
      );
    }

    // =========================
    // STEP 2 - CREATE ENCOUNTER
    // =========================
    const encounterResult =
      await encounterService.createEncounter(
        registry,
        patientResult.satusehatId
      );
      
    // =========================
    // SKIPPED
    // =========================
    if (encounterResult?.skipped) {

      console.log(
        `⏭️ Encounter ${registry.registry_id} skipped`
      );

      await resourceStatus.create({
        resource_type: "Encounter",
        local_resource_id: registry.registry_id,
        patient_id: patientResult.satusehatId,
        request_payload: registry,
        status: "skipped",
        last_error:
          encounterResult.reason ||
          "Encounter skipped"
      });

      return encounterResult;
    }

    // =========================
    // VALIDASI RESULT
    // =========================
    if (!encounterResult?.id) {

      throw new Error(
        "Encounter gagal dibuat"
      );
    }

    // =========================
    // SUCCESS
    // =========================
    console.log(
      `✅ Sukses Encounter ` +
      `${encounterResult.id} ` +
      `untuk registry ${registry.registry_id}`
    );

    return {
      success: true,
      id: encounterResult.id
    };
  }
}

module.exports = new QueueService();

