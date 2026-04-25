const { v4: uuidv4 } = require("uuid");

/**
 * Generate UID untuk SATUSEHAT / DICOM
 * 
 * @returns {object}
 */
function generateUID() {
  // Root OID (punya kamu / dummy boleh pakai ini dulu)
  const rootOID = "1.2.826.0.1.3680043.10";

  // timestamp biar unik
  const now = Date.now();

  // helper bikin OID valid (numeric only, no prefix)
  const makeOID = (suffix) => `${rootOID}.${now}.${suffix}`;

  return {
    // untuk identifier (boleh UUID)
    studyIdentifier: `urn:uuid:${uuidv4()}`,

    // untuk ImagingStudy.uid (boleh tetap pakai urn:oid)
    studyUID: `urn:oid:${makeOID(0)}`,

    // WAJIB numeric OID (tanpa urn:)
    seriesUID: makeOID(1),

    // WAJIB numeric OID (tanpa urn:)
    instanceUID1: makeOID(2),
    instanceUID2: makeOID(3)
  };
}

module.exports = generateUID;