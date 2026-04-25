const mysql = require('mysql2');
require('dotenv').config();

const db1 = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // bisa disesuaikan
  queueLimit: 0,
});

module.exports = db1;
