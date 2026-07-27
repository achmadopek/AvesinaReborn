// src/helpers/addressHelper.js

/**
 * Build FHIR Address untuk SatuSehat
 * TANPA extension (karena kode wilayah tidak dikenali)
 */
function buildFHIRAddress(patient) {
  const hasAddress = patient.alamat || patient.address;

  if (!hasAddress) {
    return null;
  }

  // ============================================
  // BUILD ADDRESS (TANPA EXTENSION)
  // ============================================
  const address = {
    use: "home",
    line: [patient.alamat || patient.address || "Alamat belum diisi"],
    country: "ID",
  };

  // Tambahkan city jika ada nama district
  if (patient.district_name) {
    address.city = patient.district_name;
  }

  // 🔥 JANGAN KIRIM EXTENSION
  // address.extension = [...]  // ❌ DIHAPUS!

  return address;
}

/**
 * Build address sederhana (fallback)
 */
function buildSimpleAddress(patient) {
  if (!patient.alamat && !patient.address) {
    return null;
  }

  const address = {
    use: "home",
    line: [patient.alamat || patient.address || "Alamat belum diisi"],
    country: "ID",
  };

  if (patient.district_name) {
    address.city = patient.district_name;
  }

  return address;
}

module.exports = { buildFHIRAddress, buildSimpleAddress };
