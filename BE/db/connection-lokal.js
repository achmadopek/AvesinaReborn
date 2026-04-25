const mysql = require('mysql2');
require('dotenv').config();

// Membuat connection pool
const db2 = mysql.createPool({
  host: process.env.DB2_HOST,
  port: process.env.DB2_PORT,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASS,
  database: process.env.DB2_NAME,
  waitForConnections: true,
  connectionLimit: 10, // sesuaikan jika perlu
  queueLimit: 0,
});

module.exports = db2;
