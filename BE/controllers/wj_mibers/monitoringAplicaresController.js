const crypto = require("crypto");
require("dotenv").config();

// ==========================
// Ketersediaan Kamar RS | BPJS
// ==========================
exports.getDataBPJS = async (req, res) => {
  try {
    const consID = process.env._CONS_ID;
    const secretKey = process.env._SECRET_KEY;
    const hospitalCode = process.env._HOSPITAL_CODE;

    const urlProduction = "https://new-api.bpjs-kesehatan.go.id";

    // Timestamp (pakai detik)
    const timeStamp = Math.floor(Date.now() / 1000).toString();

    // Raw Data & Signature
    const rawData = consID + "&" + timeStamp;
    const hmacSha256 = crypto
      .createHmac("sha256", secretKey)
      .update(rawData)
      .digest("base64");

    // Request ke BPJS
    const url = `${urlProduction}/aplicaresws/rest/bed/read/${hospitalCode}/1/100`;
    const headers = {
      "X-cons-id": consID,
      "X-timestamp": timeStamp,
      "X-signature": hmacSha256,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(url, { method: "GET", headers });
    const bpjsData = await response.json();

    // Ambil list dan metadata dari response BPJS
    const list = bpjsData?.response?.list || [];
    const metadata = bpjsData?.metadata || {};
    const totalItems = metadata.totalitems || list.length;
    const limit = 100; // atau ambil dari req.query.limit jika ada
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: list,
      totalPages,
      totalItems,
      metadata,
    });
  } catch (error) {
    console.error("ERROR getDataBPJS:", error);
    res.status(500).json({ error: error.message });
  }
};


const db2 = require('../../db/connection-avesina'); // Koneksi ke DB Avesina

exports.getData = (req, res) => {
  try {
      const sql = `
      SELECT *
      FROM applicare
    `;

    db2.query(sql, (err, data) => {
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};