// src/db/simrs.js
const mysql = require("mysql2/promise");
const config = require("../config/database");

const pool = mysql.createPool(config.simrs);

// Test koneksi
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL (SIMRS) Connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Error:", err.message);
  }
})();

module.exports = pool;
