const SatusehatClient =
  require("./satusehatClient");

const PatientService =
  require("./patientService");

const EncounterService =
  require("./encounterService");

const ServiceUnitService =
  require("./serviceUnitService");

const PractitionerService =
  require("./practitionerService");

// =====================================================
// CLIENT
// =====================================================
const client = new SatusehatClient({
  baseUrl:
    process.env.SATUSEHAT_BASE_URL,
});

// =====================================================
// SERVICES
// =====================================================
const serviceUnitService =
  new ServiceUnitService(client);

const practitionerService =
  new PractitionerService(client);

const patientService =
  new PatientService(client);

const encounterService =
  new EncounterService(
    client,
    serviceUnitService,
    practitionerService
  );

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  client,
  patientService,
  encounterService,
  serviceUnitService,
  practitionerService
};