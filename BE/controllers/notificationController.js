const bcrypt = require('bcrypt');
const db = require('../db/connection-lokal'); // Koneksi ke database lokal

const { buildUnionQuery } = require('../utility/utilsGabungQuery');

exports.getData = (req, res) => {  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const role = req.query.role || 'kepegawaian';
  const peg_id = req.query.peg_id;

  const unionQuery = buildUnionQuery(role, peg_id);

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM (${unionQuery}) AS combined
  `;

  const dataQuery = `
    ${unionQuery}
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, [], (err, countResult) => {
    if (err) {
      console.error('Gagal ambil jumlah total:', err);
      return res.status(500).json({ message: 'Gagal ambil total data' });
    }

    const total = countResult[0].total;

    db.query(dataQuery, [limit, offset], (err, results) => {
      if (err) {
        console.error('Gagal ambil data:', err);
        return res.status(500).json({ message: 'Gagal ambil data' });
      }

      res.json({
        data: results,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    });
  });
};
