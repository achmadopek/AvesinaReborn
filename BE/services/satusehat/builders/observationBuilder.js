import { formatSatuSehatDate } from "../../../utility/formatSatuSehatDate.js";

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
    ccode: {
      coding: [{
        system: "http://loinc.org",
        code: data.loinc_code || "30745-4",
        display: data.loinc_display || "Radiology study"
      }],
      text: data.local_display || "Hasil Pemeriksaan Radiologi"
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
    effectiveDateTime: formatSatuSehatDate(data.measured_dt),
    issued: formatSatuSehatDate(new Date()),
    valueString: data.hasil_bacaan,
  };
};