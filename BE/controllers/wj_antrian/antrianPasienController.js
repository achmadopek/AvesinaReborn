require("dotenv").config();
const db = require("../../db/connection-avesina");

exports.getData = async (req, res) => {
  try {
    let { poli = "RJ004" } = req.query;

    const sql = `
      SELECT
        r.registry_id,
        r.registry_dt,
        uv.queue_no,
        p.mr_code,
        p.patient_nm,
        if(p.gender = 'M', 'L', 'P') as gender,
        CASE
          WHEN p.birth_dt IS NOT NULL THEN
            CONCAT(
              TIMESTAMPDIFF(YEAR, p.birth_dt, CURDATE()), ' th ',
              MOD(TIMESTAMPDIFF(MONTH, p.birth_dt, CURDATE()), 12), ' bln ',
              DATEDIFF(
                CURDATE(),
                DATE_ADD(
                  p.birth_dt,
                  INTERVAL TIMESTAMPDIFF(MONTH, p.birth_dt, CURDATE()) MONTH
                )
              ), ' hr'
            )
          ELSE
            CONCAT(p.age, ' th')
        END AS umur,
        p.address,
        su.srvc_unit_id,
        su.srvc_unit_nm
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv  ON r.registry_id = uv.registry_id
      JOIN service_unit su ON uv.unit_id_to = su.srvc_unit_id
      WHERE
        DATE(r.registry_dt) = CURDATE()
        AND uv.unit_id_to = ?
      ORDER BY uv.queue_no ASC
    `;

    const [rows] = await db.promise().query(sql, [poli]);

    res.json({
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
