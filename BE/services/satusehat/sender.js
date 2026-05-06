const { logSection, logJSON, logError } = require("../../utility/debugLogger");

const { generateUID } = require("./builders");
const { satusehatClient } = require("./satusehatClient");
const { validatePayload } = require("./validator");

const { buildImagingStudy } = require("./builders/imagingStudyBuilder");
const { buildObservation } = require("./builders/observationBuilder");
const { buildDiagnosticReport } = require("./builders/diagnosticReportBuilder");

// ==========================
// NORMALIZER
// ==========================
const normalize = (data) => ({
  ...data,
  patient_id: data.patient_ihs,
  encounter_id: data.encounter_uuid,
  doctor_id: data.practitioner_ihs,
});

// ==========================
// 1. IMAGING STUDY
// ==========================
const sendImagingStudyToSatuSehat = async (data, orgId) => {
  try {
    validatePayload(data);

    const uid = generateUID(orgId);
    const normalized = normalize(data);

    const payload = buildImagingStudy(normalized, uid, orgId);

    logSection("IMAGING STUDY");
    logJSON("Payload", payload);

    const res = await satusehatClient.post("/ImagingStudy", payload);

    logJSON("RESPONSE", res.data);

    return res.data;
  } catch (err) {
    logError("IMAGING ERROR", err);
    throw err;
  }
};

// ==========================
// 2. OBSERVATION
// ==========================
const sendObservationToSatuSehat = async (data) => {
  try {
    const normalized = normalize(data);

    const payload = buildObservation(normalized);

    logSection("OBSERVATION");
    logJSON("Payload", payload);

    const res = await satusehatClient.post("/Observation", payload);

    logJSON("RESPONSE", res.data);

    return res.data;
  } catch (err) {
    logError("OBS ERROR", err);
    throw err;
  }
};

// ==========================
// 3. DIAGNOSTIC REPORT
// ==========================
const sendDiagnosticToSatuSehat = async (
  data,
  observationId,
  imagingId,
  orgId
) => {
  try {
    const normalized = normalize(data);

    const payload = buildDiagnosticReport(
      normalized,
      observationId,
      imagingId,
      orgId
    );

    logSection("DIAGNOSTIC REPORT");
    logJSON("Payload", payload);

    const res = await satusehatClient.post(
      "/DiagnosticReport",
      payload
    );

    logJSON("RESPONSE", res.data);

    return res.data;
  } catch (err) {
    logError("DIAGNOSTIC ERROR", err);
    throw err;
  }
};

module.exports = {
  sendImagingStudyToSatuSehat,
  sendObservationToSatuSehat,
  sendDiagnosticToSatuSehat,
};