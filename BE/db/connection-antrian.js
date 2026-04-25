const mysql = require('mysql2');
require('dotenv').config();

// Membuat connection pool
const db_antrian = mysql.createPool({
  host: process.env.DB_ANTRIAN_HOST,
  port: process.env.DB_ANTRIAN_PORT,
  user: process.env.DB_ANTRIAN_USER,
  password: process.env.DB_ANTRIAN_PASS,
  database: process.env.DB_ANTRIAN_NAME,
  waitForConnections: true,
  connectionLimit: 10, // sesuaikan jika perlu
  queueLimit: 0,
});

module.exports = db_antrian;
