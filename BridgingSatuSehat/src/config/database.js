// src/config/database.js
require("dotenv").config();

module.exports = {
  simrs: {
    host: process.env.SIMRS_DB_HOST,
    port: parseInt(process.env.SIMRS_DB_PORT) || 3306,
    user: process.env.SIMRS_DB_USER,
    password: process.env.SIMRS_DB_PASSWORD,
    database: process.env.SIMRS_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+07:00",
  },
  // Tambahkan database erm_rswj
  erm: {
    host: process.env.SIMRS_DB_HOST,
    port: parseInt(process.env.SIMRS_DB_PORT) || 3306,
    user: process.env.SIMRS_DB_USER,
    password: process.env.SIMRS_DB_PASSWORD,
    database: "erm_rswj",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    timezone: "+07:00",
  },
  satusehat: {
    host: process.env.SATUSEHAT_DB_HOST,
    port: parseInt(process.env.SATUSEHAT_DB_PORT) || 5432,
    user: process.env.SATUSEHAT_DB_USER,
    password: process.env.SATUSEHAT_DB_PASSWORD,
    database: process.env.SATUSEHAT_DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  api: {
    baseUrl: process.env.SATUSEHAT_BASE_URL,
    authUrl: process.env.SATUSEHAT_AUTH_URL,
    clientId: process.env.SATUSEHAT_CLIENT_ID,
    secret: process.env.SATUSEHAT_SECRET,
    orgId: process.env.ORGANIZATION_ID,
  },
};
