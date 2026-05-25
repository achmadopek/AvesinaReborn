const EncounterMapper = require("./encounterMapper");

const referenceCache =
  require("../../database/referenceCacheRepository");

const resourceStatus =
  require("../../database/resourceStatusRepository");

class EncounterService {

  constructor(
    client,
    serviceUnitService,
    practitionerService
  ) {
    this.client = client;
    this.serviceUnitService = serviceUnitService;
    this.practitionerService = practitionerService;
  }

  // ====================================================
  // RESOLVE PRACTITIONER
  // ====================================================
  resolvePractitioner(registry) {

    // =========================
    // RAWAT INAP -> DPJP
    // =========================
    if (registry.in_out_sts === "I") {

      if (registry.dpjp_ihs_number) {
        return {
          ihs: registry.dpjp_ihs_number,
          name: registry.dpjp_name
        };
      }

      return null;
    }

    // =========================
    // RAWAT JALAN / IGD
    // =========================
    if (registry.satusehat_ihs_number) {
      return {
        ihs: registry.satusehat_ihs_number,
        name: registry.employee_nm
      };
    }

    return null;
  }

  // ====================================================
  // CHECK ENCOUNTER
  // ====================================================
  async getEncounterByIdentifier(registryId) {

    const organizationId =
      process.env.ORGANIZATION_ID;

    const result = await this.client.get(
      "/Encounter",
      {
        identifier:
          `http://sys-ids.kemkes.go.id/encounter/${organizationId}|${registryId}`
      }
    );

    const encounter =
      result?.entry?.[0]?.resource;

    if (!encounter) {
      return null;
    }

    return encounter;
  }

  // ====================================================
  // CREATE ENCOUNTER
  // ====================================================
  async createEncounter(
    registry,
    patientSatusehatId
  ) {

    // =========================
    // CEK CACHE LOKAL
    // =========================
    const existingEncounter =
      await referenceCache.getSatusehatId(
        "encounter",
        registry.registry_id
      );

    if (existingEncounter) {

      console.log(
        `⏭️ Encounter sudah ada di cache local`
      );

     return {
        id: existingEncounter,
        skipped: true,
        exists: true,
        final: true,
        message: "Encounter sudah ada"
      };
    }

    // =========================
    // CEK DI SATUSEHAT
    // (antisipasi vendor lama)
    // =========================
    const existingFHIR =
      await this.getEncounterByIdentifier(
        registry.registry_id
      );

    if (existingFHIR) {

      console.log(
        `⏭️ Encounter sudah ada di SATUSEHAT`
      );

      // simpan ke cache lokal
      await referenceCache.save({
        reference_type: "encounter",
        local_id: registry.registry_id,
        satusehat_id: existingFHIR.id,
        resource_type: "Encounter"
      });

      return {
        id: existingFHIR.id,
        skipped: true,
        exists: true,
        final: true,
        message: "Encounter sudah ada di SATUSEHAT"
      };
    }

    // =========================
    // RESOLVE PRACTITIONER
    // =========================
    const practitioner =
      this.resolvePractitioner(registry);

    if (!practitioner) {

      console.log(
        `⏭️ SKIP Encounter ${registry.registry_id} - Practitioner belum tersedia`
      );

      return {
        skipped: true,
        reason: "Practitioner belum tersedia"
      };
    }

    // =========================
    // VALIDASI PRACTITIONER
    // ADA DI SATUSEHAT?
    // =========================
    const practitionerExists =
      await this.practitionerService.exists(
        practitioner.ihs
      );

    if (!practitionerExists) {

      console.log(
        `⏭️ Practitioner ${practitioner.ihs} ` +
        `belum ada di SATUSEHAT`
      );

      return {
        skipped: true,
        message:
          `Practitioner ${practitioner.ihs} belum tersedia`
      };
    }

    // =========================
    // GET / CREATE LOCATION
    // =========================
    const locationId =
      await this.serviceUnitService
        .getOrCreateLocation(registry);

    // =========================
    // BUILD PAYLOAD
    // =========================
    const fhirPayload =
      EncounterMapper.toFHIR(
        registry,
        patientSatusehatId,
        locationId,
        practitioner
      );

    // =========================
    // LOGGING
    // =========================
    console.log(
      "📤 [ENCOUNTER PAYLOAD] " +
      "dikirim ke SatuSehat:"
    );

    console.log(
      JSON.stringify(fhirPayload, null, 2)
    );

    console.log(
      "👨‍⚕️ Practitioner:",
      practitioner.name,
      practitioner.ihs
    );

    try {

      // =========================
      // CREATE ENCOUNTER
      // =========================
      const result =
        await this.client.post(
          "/Encounter",
          fhirPayload
        );

      console.log(
        `✅ Sukses Create Encounter ID: ${result.id}`
      );

      // =========================
      // SAVE CACHE
      // =========================
      await referenceCache.save({
        reference_type: "encounter",
        local_id: registry.registry_id,
        satusehat_id: result.id,
        resource_type: "Encounter"
      });

      // =========================
      // SAVE RESOURCE STATUS
      // =========================
      await resourceStatus.create({
        resource_type: "Encounter",
        local_resource_id: registry.registry_id,
        satusehat_id: result.id,
        patient_id: patientSatusehatId,
        request_payload: fhirPayload,
        response_payload: result,
        response_status_code: 201,
        status: "success"
      });

      return result;

    } catch (error) {

      console.error(
        "❌ FHIR ERROR DETAIL:",
        JSON.stringify(
          error?.raw ||
          error?.message ||
          error,
          null,
          2
        )
      );

      await resourceStatus.create({
        resource_type: "Encounter",
        local_resource_id: registry.registry_id,
        patient_id: patientSatusehatId,
        request_payload: fhirPayload,
        last_error: JSON.stringify(
          error?.raw || error.message
        ),
        status: "failed"
      });

      throw error;
    }
  }
}

module.exports = EncounterService;