// controllers/unitSearchController.js
const db2 = require('../db/connection-avesina'); // Koneksi ke DB Avesina

exports.getUnitSearch = (req, res) => {
  const search = `%${req.query.nama || ''}%`;
  const sql = `
    SELECT srvc_unit_id, service_unit_code, srvc_unit_nm AS nama
    FROM service_unit
    WHERE LOWER(srvc_unit_nm) LIKE LOWER(?)
    ORDER BY srvc_unit_nm
  `;

  db2.query(sql, [search], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data unit' });
    res.json(result);
  });
};
