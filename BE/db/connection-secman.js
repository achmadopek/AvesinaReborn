const mysql = require('mysql2');
require('dotenv').config();

// Membuat connection pool
const db_secman = mysql.createPool({
  host: process.env.DB_SECMAN_HOST,
  port: process.env.DB_SECMAN_PORT,
  user: process.env.DB_SECMAN_USER,
  password: process.env.DB_SECMAN_PASS,
  database: process.env.DB_SECMAN_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db_secman;