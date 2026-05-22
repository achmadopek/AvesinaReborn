class PatientMapper {
  static toFHIR(patientData) {
    const identifiers = [];

    if (patientData.nik && patientData.nik.trim() !== "") {
      identifiers.push({
        system: "https://fhir.kemkes.go.id/id/nik",
        value: patientData.nik.trim()
      });
    }

    identifiers.push({
      system: "https://fhir.kemkes.go.id/id/pasien",
      value: patientData.mr_id
    });

    return {
      resourceType: "Patient",
      identifier: identifiers,
      name: [{ use: "official", text: patientData.patient_nm || "Unnamed Patient" }],
      gender: this.mapGender(patientData.gender),
      birthDate: patientData.birth_dt ? patientData.birth_dt.toISOString().split('T')[0] : undefined,
      address: patientData.address ? [{ text: patientData.address, country: "ID" }] : undefined,
      telecom: this.buildTelecom(patientData)
    };
  }

  static mapGender(gender) {
    if (!gender) return "unknown";
    return gender.toLowerCase() === "m" ? "male" : "female";
  }

  static buildTelecom(patient) {
    const telecom = [];
    if (patient.phone) telecom.push({ system: "phone", value: patient.phone });
    return telecom;
  }

  static fromFHIR(fhirPatient) {
    return {
      satusehat_id: fhirPatient.id,
      nik: fhirPatient.identifier?.find(i => i.system?.includes("nik"))?.value,
      mr_number: fhirPatient.identifier?.find(i => i.system?.includes("pasien"))?.value,
    };
  }
}

module.exports = PatientMapper;