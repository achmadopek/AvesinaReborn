// src/helpers/dateHelper.js

/**
 * Format tanggal untuk SatuSehat (UTC dengan timezone +07:00)
 */
function formatDateForSatuSehat(date) {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();

  // Jika future, gunakan sekarang
  if (d > now) {
    d.setTime(now.getTime());
  }

  // Jika terlalu tua (< 2014), gunakan sekarang
  const minDate = new Date("2014-06-03");
  if (d < minDate) {
    d.setTime(now.getTime());
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

/**
 * Format tanggal untuk FHIR (YYYY-MM-DD)
 */
function formatDateForFHIR(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  if (d > now) {
    // Jika future, kurangi 30 tahun
    const newDate = new Date(now);
    newDate.setFullYear(now.getFullYear() - 30);
    return newDate.toISOString().split("T")[0];
  }

  if (d < new Date("1900-01-01")) {
    return "1970-01-01";
  }

  return d.toISOString().split("T")[0];
}

module.exports = { formatDateForSatuSehat, formatDateForFHIR };
