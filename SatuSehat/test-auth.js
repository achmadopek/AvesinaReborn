require("dotenv").config();

const { getToken } = require("./src/services/satusehat/authService");

(async () => {

  try {

    const token = await getToken();

    console.log("TOKEN:");
    console.log(token);

  } catch (err) {

    console.error(err.response?.data || err.message);

  }

})();