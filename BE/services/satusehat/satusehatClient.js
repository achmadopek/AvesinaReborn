const axios = require("axios");

let accessToken = null;
let tokenExpiredAt = null;

// ==========================
// CREATE CLIENT
// ==========================
const satusehatClient = axios.create({
  baseURL: process.env.SATUSEHAT_BASE_URL,
  timeout: 30000,
});

// ==========================
// GET TOKEN
// ==========================
const getAccessToken = async () => {
  try {
    // kalau token masih valid, pakai
    if (accessToken && tokenExpiredAt && Date.now() < tokenExpiredAt) {
      return accessToken;
    }

    console.log("Fetching new SatuSehat token...");

    const response = await axios.post(
      process.env.SATUSEHAT_AUTH_URL,
      new URLSearchParams({
        client_id: process.env.SATUSEHAT_CLIENT_ID,
        client_secret: process.env.SATUSEHAT_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    accessToken = response.data.access_token;

    // kasih buffer 60 detik biar aman
    tokenExpiredAt = Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (err) {
    console.error(
      "Gagal ambil token SatuSehat:",
      err.response?.data || err.message,
    );
    throw err;
  }
};

// ==========================
// INTERCEPTOR
// ==========================
satusehatClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  config.headers.Authorization = `Bearer ${token}`;
  config.headers["Content-Type"] = "application/json";

  return config;
});

module.exports = {
  satusehatClient,
};
