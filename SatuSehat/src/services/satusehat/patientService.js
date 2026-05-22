const PatientMapper = require("./patientMapper");
const referenceCache = require("../../database/referenceCacheRepository");
const resourceStatus = require("../../database/resourceStatusRepository");

class PatientService {
  constructor(client) {
    this.client = client;
  }

  async getPatientByNIK(nik) {
    if (!nik) throw new Error("NIK is required");

    const result = await this.client.get("/Patient", {
      identifier: `https://fhir.kemkes.go.id/id/nik|${nik}`
    });

    const patient = result?.entry?.[0]?.resource || null;

    return {
      found: !!patient,
      raw: result,
      patient
    };
  }

  async createPatient(patientFromSIMRS) {
    const fhirPayload = PatientMapper.toFHIR(patientFromSIMRS);
    
    const result = await this.client.post("/Patient", fhirPayload);

    // Simpan ke cache
    await referenceCache.save({
      reference_type: "patient",
      local_id: patientFromSIMRS.mr_id || patientFromSIMRS.nik,
      satusehat_id: result.id,
      resource_type: "Patient",
      extra_data: { nik: patientFromSIMRS.nik }
    });

    return result;
  }

  async getOrCreatePatient(patientFromSIMRS) {
    const localId = patientFromSIMRS.mr_id;
    const nik = patientFromSIMRS.nik?.trim();

    // Cek cache dulu
    const cachedId = await referenceCache.getSatusehatId("patient", localId);
    if (cachedId) {
      return { found: true, isNew: false, satusehatId: cachedId };
    }

    // Jika ada NIK → cari dulu pake NIK
    if (nik && nik.length >= 10) {
      const searchResult = await this.getPatientByNIK(nik);
      if (searchResult.found) {
        const satusehatId = searchResult.patient.id;
        await referenceCache.save({ reference_type: "patient", local_id: localId, satusehat_id: satusehatId, resource_type: "Patient" });
        return { found: true, isNew: false, satusehatId };
      }
    }

    // Jika tidak ada NIK atau tidak ditemukan → langsung Create
    console.log(`🆕 Creating new Patient (MR: ${localId}) - NIK: ${nik || 'KOSONG'}`);
    const newPatient = await this.createPatient(patientFromSIMRS);

    return {
      found: true,
      isNew: true,
      satusehatId: newPatient.id,
      patient: newPatient
    };
  }
}

module.exports = PatientService;