const axios = require("axios");

let accessToken = null;
let expiredAt = null;

const getToken = async () => {

  try {

    const now = Date.now();

    // token masih valid
    if (accessToken && expiredAt && now < expiredAt) {
      return accessToken;
    }

    console.log("REQUEST NEW TOKEN...");

    const params = new URLSearchParams();

    params.append("client_id", process.env.SATUSEHAT_CLIENT_ID);

    params.append(
      "client_secret",
      process.env.SATUSEHAT_CLIENT_SECRET
    );

    const response = await axios.post(
      process.env.SATUSEHAT_AUTH_URL,

      params,

      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;

    expiredAt = now + ((response.data.expires_in - 60) * 1000);

    console.log("Accesstoken:", accessToken);

    return accessToken;

  } catch (err) {

    console.error("AUTH ERROR:");
    console.error(err.response?.data);
    console.error(err.response?.status);

    throw err;
  }
};

module.exports = {
  getToken,
};