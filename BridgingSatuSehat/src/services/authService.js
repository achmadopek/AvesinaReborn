// src/services/authService.js
const axios = require("axios");
const config = require("../config/database");
const logger = require("../helpers/logger");

let token = null;
let tokenExpiry = null;

async function getToken() {
  // Cek token masih valid
  if (token && tokenExpiry && tokenExpiry > Date.now()) {
    const remaining = Math.round((tokenExpiry - Date.now()) / 1000);
    logger.info(`🔑 Using cached token (${remaining}s remaining)`);
    return token;
  }

  try {
    logger.info("🔄 Getting new token...");

    const response = await axios.post(
      config.api.authUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.api.clientId,
        client_secret: config.api.secret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    token = response.data.access_token;

    // 🔥 Cek expires_in
    const expiresIn = response.data.expires_in || 3600; // default 1 jam
    tokenExpiry = Date.now() + expiresIn * 1000 - 60000; // buffer 1 menit

    logger.info(`✅ Token obtained (expires in ${expiresIn}s)`);
    logger.info(`🔑 ACCESS TOKEN: ${token.substring(0, 20)}...`);

    return token;
  } catch (error) {
    logger.error("❌ Auth error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getToken };
