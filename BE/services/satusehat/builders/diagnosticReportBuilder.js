import { formatSatuSehatDate } from "../../../utility/formatSatuSehatDate.js";

export const buildDiagnosticReport = (
  data,
  observationId,
  imagingId,
  orgId
) => {
  return {
    resourceType: "DiagnosticReport",
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/diagnostic/${orgId}/rad`,
        value: `RAD-${Date.now()}`,
      },
    ],
    status: "final",
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "RAD",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "30745-4",
        },
      ],
      text: "Hasil Radiologi",
    },
    subject: {
      reference: `Patient/${data.patient_id}`,
    },
    encounter: {
      reference: `Encounter/${data.encounter_id}`,
    },
    effectiveDateTime: formatSatuSehatDate(data.measured_dt),
    issued: formatSatuSehatDate(new Date()),
    result: [
      {
        reference: `Observation/${observationId}`,
      },
    ],
    imagingStudy: [
      {
        reference: `ImagingStudy/${imagingId}`,
      },
    ],
    performer: [
      {
        reference: `Practitioner/${data.doctor_id}`,
      },
      {
        reference: `Organization/${orgId}`,
      },
    ],
    conclusion: data.hasil_bacaan,
  };
};