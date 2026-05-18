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

    if (
      accessToken &&
      tokenExpiredAt &&
      Date.now() < tokenExpiredAt
    ) {
      return accessToken;
    }

    console.log("Fetching new SatuSehat token...");

    const response = await axios.post(
      process.env.SATUSEHAT_AUTH_URL,

      new URLSearchParams({
        client_id:
          process.env.SATUSEHAT_CLIENT_ID,

        client_secret:
          process.env.SATUSEHAT_CLIENT_SECRET,
      }),

      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken =
      response.data.access_token;

    tokenExpiredAt =
      Date.now() +
      (response.data.expires_in - 60) * 1000;

    return accessToken;

  } catch (err) {

    console.error(
      "Gagal ambil token SatuSehat:",
      err.response?.data || err.message
    );

    throw err;
  }
};

// ==========================
// REQUEST INTERCEPTOR
// ==========================
satusehatClient.interceptors.request.use(
  async (config) => {

    const token =
      await getAccessToken();

    config.headers.Authorization =
      `Bearer ${token}`;

    config.headers["Content-Type"] =
      "application/json";

    config.headers["Accept"] =
      "application/json";

    return config;
  }
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
satusehatClient.interceptors.response.use(

  (response) => {

    console.log(
      `[SATUSEHAT RESPONSE] ${response.status} ${response.config.url}`
    );

    return response;
  },

  (error) => {

    console.log("[SATUSEHAT ERROR]");

    console.log({
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

module.exports = {
  satusehatClient,
};