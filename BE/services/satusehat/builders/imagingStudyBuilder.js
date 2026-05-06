import { formatSatuSehatDate } from "../../../utility/formatSatuSehatDate.js";

export const buildImagingStudy = (data, uid, orgId) => {
  if (!data.patient_id) throw new Error("patient_id kosong");
  if (!data.encounter_id) throw new Error("encounter_id kosong");
  if (!data.service_request_id) throw new Error("service_request_id kosong");
  if (!data.measured_dt) throw new Error("measured_dt kosong");

  if (!uid?.study || !uid?.series || !uid?.instance) {
    throw new Error("UID DICOM tidak lengkap");
  }

  return {
    resourceType: "ImagingStudy",

    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/acsn/${orgId}`,
        value: data.no_reg || String(Date.now()),
      },
      {
        system: "urn:dicom:uid",
        value: `urn:oid:${uid.study}`,
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
    numberOfInstances: 1,

    series: [
      {
        uid: uid.series,
        number: 1,

        modality: {
          system: "http://dicom.nema.org/resources/ontology/DCM",
          code: "CR",
        },

        numberOfInstances: 1,

        instance: [
          {
            uid: uid.instance,
            sopClass: {
              system: "urn:ietf:rfc:3986",
              code: "urn:oid:1.2.840.10008.5.1.4.1.1.1",
            },
            number: 1,
            title: "DICOM Image",
          },
        ],
      },
    ],
  };
};