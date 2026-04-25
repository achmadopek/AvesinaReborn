// Ambil data monitoring icare dengan pagination dan join ke DB2
require("dotenv").config();
const db2 = require("../../db/connection-avesina");

// Ambil daftar poli unik dari monitoring_icare
exports.getData = async (req, res) => {
  try {
    const query = `
      select su.srvc_unit_id, su.srvc_unit_nm, su.unit_group_id 
      from service_unit su 
      where su.unit_group_id in (8,9)
      order by su.unit_group_id desc, srvc_unit_nm asc
    `;

    const [rows] = await db2.promise().query(query);

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};