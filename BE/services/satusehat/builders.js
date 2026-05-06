const generateUID = (orgId) => {
  const root = `1.2.826.0.1.3680043.10.${orgId}`;

  // angka pendek tapi cukup unik
  const rand = Math.floor(Math.random() * 1e9); // max 9 digit
  const time = Date.now().toString().slice(-6); // ambil 6 digit belakang

  const unique = `${time}${rand}`; // max 15 digit

  const base = `${root}.${unique}`;

  return {
    study: `urn:oid:${base}`, // ✔ hanya study pakai urn:oid
    series: `${base}.1`,
    instance1: `${base}.2`,
    instance2: `${base}.3`,
  };
};

module.exports = { generateUID };