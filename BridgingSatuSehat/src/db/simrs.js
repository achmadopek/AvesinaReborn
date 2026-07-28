// src/db/simrs.js
const mysql = require("mysql2/promise");
const config = require("../config/database");

// ✅ PASTIKAN KONEKSI TERTUTUP SETELAH DIGUNAKAN
const pool = mysql.createPool({
  ...config.simrs,
  connectionLimit: 5, // ← KURANGI DARI 10 JADI 5
  waitForConnections: true,
  queueLimit: 0,
});

// Test koneksi
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL (SIMRS) Connected");
    conn.release(); // ← PASTIKAN DI-RELEASE!
  } catch (err) {
    console.error("❌ MySQL Error:", err.message);
  }
})();

module.exports = pool;
