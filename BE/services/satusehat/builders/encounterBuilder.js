const formatDate = require("../utils/formatDate");

function buildEncounterPayload(row) {

  return {

    resourceType: "Encounter",

    status: "finished",

    class: {
      system:
        "http://terminology.hl7.org/CodeSystem/v3-ActCode",

      code: "AMB",
      display: "ambulatory"
    },

    subject: {
      reference:
        `Patient/${row.patient_ihs_number}`,

      display:
        row.patient_name
    },

    participant: [
      {
        type: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",

                code: "ATND",
                display: "attender"
              }
            ]
          }
        ],

        individual: {
          reference:
            `Practitioner/${row.practitioner_ihs_number}`,

          display:
            row.practitioner_name
        }
      }
    ],

    period: {
      start: formatDate(row.arrived_start_date),
      end: formatDate(row.finish_end_date)
    },

    location: [
      {
        location: {
          reference:
            `Location/${row.location_uuid}`,

          display:
            row.location_name
        }
      }
    ],

    serviceProvider: {
      reference:
        `Organization/${row.organization_uuid}`
    },

    identifier: [
      {
        system:
          `http://sys-ids.kemkes.go.id/encounter/${row.organization_uuid}`,

        value:
          row.registry_id
      }
    ]
  };
}

module.exports = buildEncounterPayload;