export const buildObservation = (data) => {
  return {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "imaging",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "30745-4",
          display: "Chest X-ray study",
        },
      ],
      text: "Hasil Rontgen",
    },
    subject: {
      reference: `Patient/${data.patient_id}`,
    },
    encounter: {
      reference: `Encounter/${data.encounter_id}`,
    },
    performer: [
      {
        reference: `Practitioner/${data.doctor_id}`,
      },
    ],
    effectiveDateTime: data.measured_dt,
    issued: new Date().toISOString(),
    valueString: data.hasil_bacaan,
  };
};