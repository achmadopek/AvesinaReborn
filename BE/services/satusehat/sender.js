const { generateUID } = require("./builders");
const { satusehatClient } = require("./satusehatClient");
const { validatePayload } = require("./validator");

const { buildImagingStudy } = require("./builders/imagingStudyBuilder");
const { buildObservation } = require("./builders/observationBuilder");
const { buildDiagnosticReport } = require("./builders/diagnosticReportBuilder");

const sendSatuSehat = async (data, orgId) => {
  try {
    validatePayload(data);

    const uid = generateUID(orgId);

    // 1. ImagingStudy
    const imagingPayload = buildImagingStudy(data, uid, orgId);
    const imagingRes = await satusehatClient.post(
      "/ImagingStudy",
      imagingPayload
    );

    // 2. Observation
    const obsPayload = buildObservation(data);
    const obsRes = await satusehatClient.post(
      "/Observation",
      obsPayload
    );

    // 3. DiagnosticReport
    const diagPayload = buildDiagnosticReport(
      data,
      obsRes.data.id,
      imagingRes.data.id,
      orgId
    );

    await satusehatClient.post("/DiagnosticReport", diagPayload);

    return {
      success: true,
    };
  } catch (err) {
    console.error(err?.response?.data || err);
    throw err;
  }
};

module.exports = { sendSatuSehat };