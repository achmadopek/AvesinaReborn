// src/helpers/dateHelper.js
function formatDateForSatuSehat(date) {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  // Pastikan tidak future
  const now = new Date();
  if (d > now) {
    d.setDate(d.getDate() - 1);
  }

  return d.toISOString().replace("Z", "+07:00");
}

function formatDateForFHIR(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

module.exports = { formatDateForSatuSehat, formatDateForFHIR };
