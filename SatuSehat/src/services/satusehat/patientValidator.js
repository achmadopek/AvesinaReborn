function validatePatientData(registry) {
  const errors = [];

  if (!registry) {
    errors.push("registry null");
    return errors;
  }

  if (!registry.mr_id) errors.push("mr_id kosong");
  if (!registry.nik) errors.push("nik kosong");
  if (!registry.patient_nm) errors.push("nama kosong");

  return errors;
}

module.exports = { validatePatientData };