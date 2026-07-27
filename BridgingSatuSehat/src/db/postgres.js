// src/db/postgres.js
const { Pool } = require("pg");
const config = require("../config/database");

const pool = new Pool(config.satusehat);

// Test koneksi
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ PostgreSQL Error:", err.message);
  } else {
    console.log("✅ PostgreSQL Connected");
  }
});

module.exports = pool;
