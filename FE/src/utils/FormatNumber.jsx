// Mengubah angka mentah menjadi format ribuan (Indonesia)
// Contoh:
//   formatNumber(1500000.57)     -> "1.500.000,57"
//   formatNumber("2000000")      -> "2.000.000"
//   formatNumber("abc12345xyz")  -> "12.345"
// Bisa dipakai untuk tampilan harga, jumlah, dst.
export function formatNumber(input) {
  if (input == null || input === "") return "0";

  // Pastikan input berupa number
  let num = parseFloat(
    String(input)
      .replace(/[^\d,.-]/g, "") // hapus semua kecuali digit dan tanda desimal
      .replace(",", ".") // ubah koma ke titik agar bisa diparse
  );

  if (isNaN(num)) num = 0;

  // Gunakan Intl.NumberFormat agar sesuai lokal Indonesia
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0, // jika ada desimal, tampilkan 2 digit
    maximumFractionDigits: 2,
  }).format(num);
}

// Menghapus semua karakter non-digit, untuk mendapatkan angka mentah
// Contoh:
//   extractRawNumber("1.500.000,57") -> "150000057"
//   extractRawNumber("Rp 2.345.000") -> "2345000"
export function extractRawNumber(formatted) {
  return String(formatted).replace(/\D/g, "");
}

// Parse string terformat menjadi number (float)
// Contoh:
//   parseNumber("1.500.000,57") -> 1500000.57
//   parseNumber("2.345,9")      -> 2345.9
//   parseNumber(1000)           -> 1000
export function parseNumber(input) {
  if (!input && input !== 0) return 0;

  const clean = String(input)
    .replace(/\./g, "") // hilangkan titik ribuan
    .replace(",", "."); // ubah koma jadi titik agar bisa diparse sebagai float

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

// Format ke mata uang Rupiah (pakai simbol Rp)
// Contoh:
//   formatCurrency(1500000)    -> "Rp1.500.000,00"
//   formatCurrency(10000.5)    -> "Rp10.000,50"
export function formatCurrency(value) {
  // Pastikan value bisa diubah ke float
  const num = parseFloat(value);
  if (isNaN(num)) return "Rp 0,00";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
