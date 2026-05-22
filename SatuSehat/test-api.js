require("dotenv").config();

const { patientService } = require("./src/services/satusehat");

(async () => {
  try {
    const nik = "3513152411920001";

    console.log("🔎 SEARCH PATIENT ONLY:", nik);

    const result = await patientService.getPatientByNIK("3513152411920001");

    console.log("RESULT:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("ERROR DETAIL:");
    console.error("Status:", err?.status);
    console.error("Message:", err?.message);
    console.error("RAW:", err);
  }
})();