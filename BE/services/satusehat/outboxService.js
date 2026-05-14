const dbERM = require("../../db/connection-erm");

exports.enqueue = async ({
  registry_id,
  x_ray_id = null,
  x_ray_dtl_id = null,

  resource_type,

  payload = null,
}) => {

  // CEK DUPLIKAT PENDING
  const [[existing]] = await dbERM.promise().query(
    `
    SELECT id
    FROM satusehat_outbox
    WHERE registry_id = ?
      AND x_ray_dtl_id = ?
      AND resource_type = ?
      AND status IN ('pending', 'processing')
    LIMIT 1
    `,
    [
      registry_id,
      x_ray_dtl_id,
      resource_type,
    ]
  );

  if (existing) {
    return existing.id;
  }

  const [insert] = await dbERM.promise().query(
    `
    INSERT INTO satusehat_outbox
    (
      registry_id,
      x_ray_id,
      x_ray_dtl_id,
      resource_type,
      payload,
      status
    )
    VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [
      registry_id,
      x_ray_id,
      x_ray_dtl_id,
      resource_type,
      JSON.stringify(payload || {}),
    ]
  );

  return insert.insertId;

};