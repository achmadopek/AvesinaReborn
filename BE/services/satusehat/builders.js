const generateUID = (orgId) => {
  const root = `1.2.826.0.1.3680043.10.${orgId}`;

  const now = Date.now();
  const hr = process.hrtime.bigint(); // nanosecond
  const rand = Math.floor(Math.random() * 100000);

  const unique = `${now}${hr}${rand}`;

  const base = `${root}.${unique}`;

  return {
    study: `urn:oid:${base}.0`,
    series: `${base}.1`,
    instance1: `${base}.2`,
    instance2: `${base}.3`,
  };
};

module.exports = { generateUID };