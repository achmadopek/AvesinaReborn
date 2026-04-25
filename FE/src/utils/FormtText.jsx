// Capitalize huruf pertama kata
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Format role: ubah underscore/dash/dot jadi spasi + kapital tiap kata
export function formatRole(role) {
  if (!role) return "";
  return role
    .replace(/[_\-.]+/g, " ")       // ganti underscore/dash/dot jadi spasi
    .replace(/[^a-zA-Z0-9 ]/g, "")  // buang karakter non-alfanumerik lain
    .split(" ")
    .filter(Boolean)                // buang string kosong
    .map(word => capitalize(word))
    .join(" ");
}
