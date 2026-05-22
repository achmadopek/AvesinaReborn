const db = require("../db/simrs");

class RegistryRepository {
  async getTodaysRegistry(limit = 50) {
    const query = `
      SELECT
        r.registry_id,
        r.mr_id,
        r.srvc_unit_id,
        r.registry_dt,
        r.queue_no,
        r.old_new_visit,
        r.complaint,
        r.height,
        r.weight,
        r.systole,
        r.diastole,
        r.pulse,
        r.temperature,
        r.in_out_sts,
        r.registry_sts,
        r.visit_number,
        r.employee_respon,
        r.description,
        r.registry_type,

        -- patient
        p.patient_nm,
        p.birth_dt,
        p.gender,
        p.address,
        p.phone,
        p.id_number AS nik,
        p.place_of_birth,

        -- service unit
        su.srvc_unit_nm,
        su.satusehat_uuid,

        -- dokter visite
        e.employee_id,
        e.employee_nm,
        e.satusehat_ihs_number

    FROM registry r

    LEFT JOIN patient p
        ON r.mr_id = p.mr_id

    LEFT JOIN service_unit su
        ON r.srvc_unit_id = su.srvc_unit_id

    LEFT JOIN unit_visit uv
        ON r.registry_id = uv.registry_id

    LEFT JOIN visite v
        ON uv.unit_visit_id = v.unit_visit_id

    LEFT JOIN employee e
        ON v.employee_id = e.employee_id

    -- WHERE r.registry_dt >= NOW() - INTERVAL 48 HOUR
    WHERE DATE(r.registry_dt) = CURDATE() - INTERVAL 1 DAY

    ORDER BY r.registry_dt DESC
    LIMIT ?
    `;

    const [rows] = await db.execute(query, [limit]);
    return rows;
  }

  async getRegistryById(registry_id) {
    const query = `SELECT * FROM registry WHERE registry_id = ?`;
    const [rows] = await db.execute(query, [registry_id]);
    return rows[0];
  }

  async getRegistryByMrId(mr_id, limit = 10) {
    const query = `
      SELECT * FROM registry 
      WHERE mr_id = ? 
      ORDER BY registry_dt DESC 
      LIMIT ?
    `;
    const [rows] = await db.execute(query, [mr_id, limit]);
    return rows;
  }
}

module.exports = new RegistryRepository();