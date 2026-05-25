const db = require("../db/postgres");

class ResourceStatusRepository {
  async create({
    resource_type,
    local_resource_id,
    satusehat_id = null,
    patient_id = null,
    encounter_id = null,
    request_payload = null,
    response_payload = null,
    response_status_code = null,
    status = "success",
    last_error = null
  }) {
    const query = `
      INSERT INTO satusehat_resource_status 
        (resource_type, local_resource_id, satusehat_id, patient_id, encounter_id,
         request_payload, response_payload, response_status_code, status, last_error)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      resource_type, local_resource_id, satusehat_id, patient_id, encounter_id,
      request_payload, response_payload, response_status_code, status, last_error
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async update(id, { satusehat_id, status, response_payload, last_error }) {
    const query = `
      UPDATE satusehat_resource_status 
      SET satusehat_id = $1,
          status = $2,
          response_payload = $3,
          last_error = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const { rows } = await db.query(query, [satusehat_id, status, response_payload, last_error, id]);
    return rows[0];
  }

  async getByLocalId(resource_type, local_resource_id) {
    const query = `SELECT * FROM satusehat_resource_status WHERE resource_type = $1 AND local_resource_id = $2`;
    const { rows } = await db.query(query, [resource_type, local_resource_id]);
    return rows[0];
  }

  async findSuccess(resourceType, localId) {
    const query = `
      SELECT *
      FROM satusehat_resource_status
      WHERE resource_type = $1
        AND local_resource_id = $2
        AND status = 'success'
      LIMIT 1
    `;

    const result =
      await db.query(query, [
        resourceType,
        localId
      ]);

    return result.rows[0];
  }
}

module.exports = new ResourceStatusRepository();