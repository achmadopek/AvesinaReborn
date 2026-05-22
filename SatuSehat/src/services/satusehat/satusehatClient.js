const axios = require("axios");
const { getToken } = require("./authService");

class SatusehatClient {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(method, url, data = null, params = {}) {
    const token = await getToken();
    let fullUrl = `${this.baseUrl}${url}`;

    console.log("FHIR CALL =>", fullUrl);

    try {
      const config = {
        method,
        url: fullUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/fhir+json, application/json",  // lebih baik
          "Content-Type": "application/json",
          "User-Agent": "SatuSehat-Client/1.0"
        },
        timeout: 30000,
      };

      // Handle query params dengan benar (Axios otomatis encode)
      if (Object.keys(params).length > 0) {
        config.params = params;
      }

      if (data) {
        config.data = data;
      }

      const res = await axios(config);
      return res.data;
    } catch (err) {
      console.error("FHIR ERROR STATUS:", err?.response?.status);
      console.error("FHIR ERROR DATA:", err?.response?.data);

      throw {
        status: err?.response?.status || 500,
        message: err?.response?.data || err.message,
        raw: err?.response?.data,
      };
    }
  }

  // GET with optional params
  get(url, params = {}) {
    return this.request("GET", url, null, params);
  }

  post(url, data = {}) {
    return this.request("POST", url, data);
  }
}

module.exports = SatusehatClient;