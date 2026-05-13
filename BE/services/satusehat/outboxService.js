const dbERM = require("../../db/connection-erm");

exports.enqueue = async ({
  registry_id,
  x_ray_id = null,
  x_ray_dtl_id = null,
  resource_type,
  payload = null,
}) => {

  await dbERM.promise().query(
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
      JSON.stringify(payload || {})
    ]
  );

};