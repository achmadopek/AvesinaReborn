/**
 * Format tanggal ke format Indonesia: DD MMMM YYYY
 * @example
 * formatDate("2025-10-03") // "03 Oktober 2025"
 * formatDate("2023-01-15") // "15 Januari 2023"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date)) return "";

  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const d = date.getDate();
  const m = bulanIndo[date.getMonth()];
  const y = date.getFullYear();

  return `${d} ${m} ${y}`;
};


/**
 * Format tanggal ke format Indonesia: DD MMMM YYYY
 * @example
 * formatDate("2025-10-03") // "03 Oktober 2025 10:30"
 * formatDate("2023-01-15") // "15 Januari 2023 23:12"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format tanggal ke input form HTML type="date" (YYYY-MM-DD)
 * dengan timezone Asia/Jakarta
 * @example
 * formatDateInput("2025-10-03T15:30:00Z") // "2025-10-04"
 * formatDateInput("2025-02-01") // "2025-02-01"
 */
export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);

  const jakartaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return jakartaDate; // Format en-CA = yyyy-MM-dd
};

/**
 * Format tanggal ke periode MM-YYYY
 * @example
 * formatDateToPeriode("2025-10-03") // "10-2025"
 * formatDateToPeriode("2023-01-15") // "01-2023"
 */
export const formatDateToPeriode = (dateStr) => {
  if (!dateStr) return "";
  const [y, m] = dateStr.split("-");
  return `${m}-${y}`;
};

/**
 * Format tanggal ke periode YYYY-MM
 * @example
 * formatDateToPeriodeYYYYMM("2025-10-03") // "2025-10"
 * formatDateToPeriodeYYYYMM("2023-01-15") // "2023-01"
 */
export const formatDateToPeriodeYYYYMM = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.slice(0, 7); // YYYY-MM
};


/**
 * Ubah periode "MM-YYYY" menjadi "NamaBulan YYYY"
 * @example
 * formatPeriodeToText("01-2025") // "Januari 2025"
 * formatPeriodeToText("10-2025") // "Oktober 2025"
 */
export const formatPeriodeToText = (periode) => {
  if (!periode) return "";

  const [monthStr, year] = periode.split("-");
  const month = parseInt(monthStr, 10);

  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return `${bulanIndo[month - 1]} ${year}`;
};


/**
 * Ubah tgl menjadi "DD-MM-YYYY HH:MM:SS"
 * @example
 * formatSortDateTime("2025-11-17 21:45:32.000") // "17-11-2025 21:45:32"
 */
export const formatSortDateTime = (periode) => {
  if (!periode) return "";

  // Jika ada ".000" → buang
  const clean = periode.replace(/\.\d+$/, "");

  // Parsing aman
  const date = new Date(clean.replace(" ", "T")); // Ubah jadi ISO-like

  if (isNaN(date)) return ""; // Jika invalid date

  const pad = (n) => n.toString().padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Ubah tgl menjadi "DD-MM-YYYY"
 * @example
 * formatSortDate("2025-11-17 21:45:32.000") // "17-11-2025"
 */
export const formatSortDate = (periode) => {
  if (!periode) return "";

  // Jika ada ".000" → buang
  const clean = periode.replace(/\.\d+$/, "");

  // Parsing aman
  const date = new Date(clean.replace(" ", "T")); // Ubah jadi ISO-like

  if (isNaN(date)) return ""; // Jika invalid date

  const pad = (n) => n.toString().padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};