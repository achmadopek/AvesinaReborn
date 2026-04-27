import { formatSatuSehatDate } from "../../../utility/formatSatuSehatDate.js";

export const buildImagingStudy = (data, uid, orgId) => {
  return {
    resourceType: "ImagingStudy",
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/acsn/${orgId}`,
        value: data.no_reg || String(Date.now()),
      },
      {
        system: "urn:dicom:uid",
        value: uid.study,
      },
    ],
    status: "available",
    modality: [
      {
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: "CR",
      },
    ],
    subject: {
      reference: `Patient/${data.patient_id}`,
    },
    encounter: {
      reference: `Encounter/${data.encounter_id}`,
    },
    started: formatSatuSehatDate(data.measured_dt),
    basedOn: [
      {
        reference: `ServiceRequest/${data.service_request_id}`,
      },
    ],
    numberOfSeries: 1,
    numberOfInstances: data.foto2 ? 2 : 1,
    series: [
      {
        uid: `urn:oid:${uid.series}`,
        number: 1,
        modality: {
          system: "http://dicom.nema.org/resources/ontology/DCM",
          code: "CR",
        },
        numberOfInstances: data.foto2 ? 2 : 1,
        instance: [
          {
            uid: `urn:oid:${uid.instance1}`,
            sopClass: {
              system: "urn:ietf:rfc:3986",
              code: "urn:oid:1.2.840.10008.5.1.4.1.1.1",
            },
            number: 1,
            title: "Foto 1",
          },
          ...(data.foto2
            ? [
                {
                  uid: uid.instance2,
                  sopClass: {
                    system: "urn:ietf:rfc:3986",
                    code: "urn:oid:1.2.840.10008.5.1.4.1.1.1",
                  },
                  number: 2,
                  title: "Foto 2",
                },
              ]
            : []),
        ],
      },
    ],
  };
};