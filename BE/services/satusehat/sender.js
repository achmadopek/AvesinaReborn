const { logSection, logJSON, logError } = require("../../utility/debugLogger");

const { generateUID } = require("./builders");
const { satusehatClient } = require("./satusehatClient");
const { validatePayload } = require("./validator");

const { buildImagingStudy } = require("./builders/imagingStudyBuilder");
const { buildObservation } = require("./builders/observationBuilder");
const { buildDiagnosticReport } = require("./builders/diagnosticReportBuilder");

const sendSatuSehat = async (data, orgId) => {
  try {
    validatePayload(data);

    logSection("RAW DATA");
    logJSON("Input Data", data);

    const uid = generateUID(orgId);

    logSection("GENERATED UID");
    logJSON("UID", uid);

    const normalized = {
      ...data,
      patient_id: data.patient_ihs,
      encounter_id: data.encounter_uuid,
      doctor_id: data.practitioner_ihs,
    };

    // =========================
    // 1. IMAGING STUDY
    // =========================
    /*const imagingPayload = buildImagingStudy(normalized, uid, orgId);

    logSection("IMAGING STUDY PAYLOAD");
    logJSON("Payload", imagingPayload);

    let imagingRes;
    try {
      imagingRes = await satusehatClient.post("/ImagingStudy", imagingPayload);

      logJSON("IMAGING RESPONSE", imagingRes.data);
    } catch (err) {
      logError("IMAGING ERROR", err);
      throw err;
    }

    // =========================
    // 2. OBSERVATION
    // =========================
    const obsPayload = buildObservation(normalized);

    logSection("OBSERVATION PAYLOAD");
    logJSON("Payload", obsPayload);

    let obsRes;
    try {
      obsRes = await satusehatClient.post("/Observation", obsPayload);

      logJSON("OBS RESPONSE", obsRes.data);
    } catch (err) {
      logError("OBSERVATION ERROR", err);
      throw err;
    }

    // =========================
    // 3. DIAGNOSTIC REPORT
    // =========================
    const diagPayload = buildDiagnosticReport(
      normalized,
      obsRes.data.id,
      imagingRes.data.id,
      orgId
    );

    logSection("DIAGNOSTIC REPORT PAYLOAD");
    logJSON("Payload", diagPayload);

    try {
      const diagRes = await satusehatClient.post(
        "/DiagnosticReport",
        diagPayload
      );

      logJSON("DIAG RESPONSE", diagRes.data);
    } catch (err) {
      logError("DIAGNOSTIC ERROR", err);
      throw err;
    }*/

    logSection("SELESAI");
    console.log("Semua resource berhasil dikirim");

    return {
      success: true,
    };
  } catch (err) {
    console.log("\nFINAL ERROR");
    logError("SEND SATUSEHAT FAILED", err);
    throw err;
  }
};

module.exports = { sendSatuSehat };