const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.SATUSEHAT_DB_HOST || "localhost",
  port: process.env.SATUSEHAT_DB_PORT || 5432,
  database: process.env.SATUSEHAT_DB_NAME,
  user: process.env.SATUSEHAT_DB_USER,
  password: process.env.SATUSEHAT_DB_PASSWORD,
  // Best practices
  max: 20,                    // maksimal koneksi
  idleTimeoutMillis: 30000,   // tutup koneksi idle setelah 30 detik
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Test koneksi saat pertama kali di-load
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("SatuSehat Postgres Database Connected successfully");
    client.release();
  } catch (err) {
    console.error("SatuSehat Postgres Connection Error:", err.message);
    console.error("Pastikan environment variables sudah benar!");
  }
};

// Jalankan test koneksi
testConnection();

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
  console.log("Postgres pool has ended");
});

module.exports = pool;