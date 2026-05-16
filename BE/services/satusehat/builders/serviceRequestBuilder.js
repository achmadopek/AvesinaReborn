const buildServiceRequest = (data) => {

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
          code: data.loinc_code || "30745-4",
          display: data.loinc_display || "Radiology study"
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
        reference: `Practitioner/${data.practitioner_ihs}`
      }
    ],

    occurrenceDateTime:
      new Date(
        data.measured_dt
      ).toISOString()
  };

};

module.exports = {
  buildServiceRequest,
};