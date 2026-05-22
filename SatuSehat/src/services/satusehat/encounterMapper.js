class EncounterMapper {

  static toFHIR(
    registry,
    patientSatusehatId,
    locationSatusehatId,
    practitioner
  ) {

    const organizationId =
      process.env.ORGANIZATION_ID;

    const startTime =
      this.formatDate(registry.registry_dt);

    return {

      resourceType: "Encounter",

      identifier: [
        {
          system:
            `http://sys-ids.kemkes.go.id/encounter/${organizationId}`,

          value: registry.registry_id
        }
      ],

      status: "arrived",

      statusHistory: [
        {
          status: "arrived",
          period: {
            start: startTime
          }
        }
      ],

      class: {
        system:
          "http://terminology.hl7.org/CodeSystem/v3-ActCode",

        code:
          registry.in_out_sts === "I"
            ? "IMP"
            : "AMB",

        display:
          registry.in_out_sts === "I"
            ? "inpatient encounter"
            : "ambulatory"
      },

      subject: {
        reference:
          `Patient/${patientSatusehatId}`,

        display:
          registry.patient_nm || ""
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
            reference: `Practitioner/${practitioner.ihs}`,
            display: practitioner.name
          }
        }
      ],

      period: {
        start: startTime
      },

      // ==================== LOCATION ====================

      location: [
        {
          location: {
            reference:
              `Location/${locationSatusehatId}`,

            display:
              registry.srvc_unit_nm ||
              registry.srvc_unit_id
          },

          period: {
            start: startTime
          },

          extension: [
            {
              url:
                "https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass",

              extension: [
                {
                  url: "value",

                  valueCodeableConcept: {
                    coding: [
                      {
                        system:
                          "http://terminology.kemkes.go.id/CodeSystem/locationServiceClass-Outpatient",

                        code: "reguler",

                        display:
                          "Kelas Reguler"
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ],

      serviceProvider: {
        reference:
          `Organization/${organizationId}`
      }
    };
  }

  static formatDate(dateValue) {

    if (!dateValue)
      return undefined;

    try {

      const date =
        dateValue instanceof Date
          ? dateValue
          : new Date(dateValue);

      if (isNaN(date.getTime()))
        return undefined;

      return date
        .toISOString()
        .replace("Z", "+07:00");

    } catch (err) {

      return undefined;
    }
  }
}

module.exports = EncounterMapper;