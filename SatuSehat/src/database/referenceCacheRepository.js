const db = require("../db/postgres");

class ReferenceCacheRepository {
  async save({
    reference_type,
    local_id,
    satusehat_id,
    resource_type,
    extra_data = null
  }) {
    const query = `
      INSERT INTO satusehat_reference_cache 
        (reference_type, local_id, satusehat_id, resource_type, extra_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (reference_type, local_id) 
      DO UPDATE SET 
        satusehat_id = EXCLUDED.satusehat_id,
        extra_data = EXCLUDED.extra_data,
        created_at = NOW()
      RETURNING *
    `;

    const values = [reference_type, local_id, satusehat_id, resource_type, extra_data];
    
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (err) {
      // Fallback jika ON CONFLICT masih error (constraint belum dibuat)
      console.warn(`⚠️ ON CONFLICT gagal, pakai INSERT biasa untuk ${reference_type}/${local_id}`);
      
      const fallbackQuery = `
        INSERT INTO satusehat_reference_cache 
          (reference_type, local_id, satusehat_id, resource_type, extra_data)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        RETURNING *
      `;
      const { rows } = await db.query(fallbackQuery, values);
      return rows[0];
    }
  }

  async getSatusehatId(reference_type, local_id) {
    const query = `
      SELECT satusehat_id 
      FROM satusehat_reference_cache 
      WHERE reference_type = $1 AND local_id = $2
    `;
    const { rows } = await db.query(query, [reference_type, local_id]);
    return rows[0]?.satusehat_id || null;
  }

  async getCache(reference_type, local_id) {
    const query = `
      SELECT * FROM satusehat_reference_cache 
      WHERE reference_type = $1 AND local_id = $2
    `;
    const { rows } = await db.query(query, [reference_type, local_id]);
    return rows[0];
  }
}

module.exports = new ReferenceCacheRepository();