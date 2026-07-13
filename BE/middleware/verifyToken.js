const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  console.log("AUTH HEADER:", authHeader);

  const token = authHeader?.split(" ")[1];

  console.log("TOKEN RAW:", token);

  try {
    const decodedNoVerify = jwt.decode(token);

    console.log("DECODED NO VERIFY:");
    console.log(decodedNoVerify);
  } catch (e) {
    console.log("DECODE ERROR:", e.message);
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("JWT ERROR:", err.message);

      return res.status(403).json({
        message: "Token tidak valid",
        error: err.message,
      });
    }

    console.log("VERIFY SUCCESS");

    next();
  });
};
