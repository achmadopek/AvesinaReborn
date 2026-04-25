exports.buildServiceRequest = (data) => {
  return {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "original-order",

    category: [
      {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "363679005",
            display: "Imaging"
          }
        ]
      }
    ],

    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: data.loinc_code,
          display: data.loinc_display
        }
      ]
    },

    subject: {
      reference: `Patient/${data.patient_ihs}`
    },

    encounter: {
      reference: `Encounter/${data.encounter_uuid}`
    },

    requester: {
      reference: `Practitioner/${data.pengirim_ihs}`
    },

    performer: [
      {
        reference: `Practitioner/${data.pemeriksa_ihs}`
      }
    ],

    occurrenceDateTime: new Date(data.tanggal).toISOString()
  };
};