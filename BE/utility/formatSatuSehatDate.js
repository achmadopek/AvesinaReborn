export const formatSatuSehatDate = (date) => {
  const d = new Date(date);

  // paksa ke WIB
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (7 * 60 * 60 * 1000));

  const pad = (n) => String(n).padStart(2, "0");

  return `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())}T${pad(wib.getHours())}:${pad(wib.getMinutes())}:${pad(wib.getSeconds())}+07:00`;
};