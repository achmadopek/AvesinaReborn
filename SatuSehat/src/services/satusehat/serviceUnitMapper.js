class ServiceUnitMapper {
  static toFHIR(serviceUnit, organizationId = process.env.ORGANIZATION_ID) {
    return {
      resourceType: "Location",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/location/${organizationId}`,
          value: serviceUnit.srvc_unit_id
        }
      ],
      status: "active",
      name: serviceUnit.srvc_unit_nm || "Ruang " + serviceUnit.srvc_unit_id,
      description: serviceUnit.desc || serviceUnit.srvc_unit_nm,
      mode: "instance",
      physicalType: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
            code: "ro",
            display: "Room"
          }
        ]
      },
      managingOrganization: {
        reference: `Organization/${organizationId}`
      }
    };
  }
}

module.exports = ServiceUnitMapper;