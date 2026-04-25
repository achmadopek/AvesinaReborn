const mysql = require('mysql2');
require('dotenv').config();

const db1 = mysql.createPool({
  host: process.env.DB_ERM_HOST,
  port: process.env.DB_ERM_PORT,
  user: process.env.DB_ERM_USER,
  password: process.env.DB_ERM_PASSWORD,
  database: process.env.DB_ERM_NAME,
  waitForConnections: true,
  connectionLimit: 10, // bisa disesuaikan
  queueLimit: 0,
});

module.exports = db1;
