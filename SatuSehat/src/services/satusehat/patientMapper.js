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

    // ✅ normalize birth date
    let birthDate;

    if (patientData.birth_dt) {
      const d = new Date(patientData.birth_dt);

      if (!isNaN(d.getTime())) {
        birthDate = d.toISOString().split("T")[0];
      }
    }

    return {
      resourceType: "Patient",
      identifier: identifiers,

      name: [{
        use: "official",
        text: patientData.patient_nm || "Unnamed Patient"
      }],

      gender: this.mapGender(patientData.gender),

      birthDate,

      multipleBirthBoolean: false,

      address: patientData.address
        ? [{
            use: "home",
            text: patientData.address,
            country: "ID",
            extension: []
          }]
        : undefined,

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