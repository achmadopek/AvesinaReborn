const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.SIMRS_DB_HOST || "localhost",
  port: process.env.SIMRS_DB_PORT || 3306,
  user: process.env.SIMRS_DB_USER,
  password: process.env.SIMRS_DB_PASSWORD,
  database: process.env.SIMRS_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00", // WIB
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("SIMRS MySQL Connected successfully");
    connection.release();
  } catch (err) {
    console.error("SIMRS MySQL Connection Error:", err.message);
  }
};

// Test otomatis saat pertama kali diimport
testConnection();

module.exports = pool;