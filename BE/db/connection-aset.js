const mysql = require('mysql2');
require('dotenv').config();

// Membuat connection pool
const db_aset = mysql.createPool({
  host: process.env.DB_ASET_HOST,
  port: process.env.DB_ASET_PORT,
  user: process.env.DB_ASET_USER,
  password: process.env.DB_ASET_PASS,
  database: process.env.DB_ASET_NAME,
  waitForConnections: true,
  connectionLimit: 10, // sesuaikan jika perlu
  queueLimit: 0,
});

module.exports = db_aset;
