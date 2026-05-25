const db = require("../db/postgres");

// ==================== CHECK QUEUE ====================
const findExistingQueue = async (
  resourceType,
  localResourceId
) => {

  const query = `
    SELECT *
    FROM satusehat_queue
    WHERE resource_type = $1
      AND local_resource_id = $2
      AND status IN (
        'pending',
        'processing',
        'failed'
      )
    LIMIT 1
  `;

  const result =
    await db.query(query, [
      resourceType,
      localResourceId
    ]);

  return result.rows[0];
};

// ==================== INSERT QUEUE ====================
const insertQueue = async ({
  resource_type,
  local_resource_id,
  encounter_local_id = null,
  patient_local_id = null,
  dependency_resource_type = null,
  dependency_local_id = null,
  payload,
  priority = 1
}) => {

  const query = `
    INSERT INTO satusehat_queue (
      resource_type,
      local_resource_id,
      encounter_local_id,
      patient_local_id,
      dependency_resource_type,
      dependency_local_id,
      payload,
      priority
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;

  const values = [
    resource_type,
    local_resource_id,
    encounter_local_id,
    patient_local_id,
    dependency_resource_type,
    dependency_local_id,
    payload,
    priority
  ];

  const result =
    await db.query(query, values);

  return result.rows[0];
};

// ==================== GET PENDING ====================
const getPendingQueue = async () => {

  const query = `
    SELECT *
    FROM satusehat_queue
    WHERE status IN ('pending', 'failed')
      AND (
        locked_at IS NULL
        OR locked_at < NOW() - INTERVAL '10 minutes'
      )
      AND retry_count < 5
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  const result =
    await db.query(query);

  return result.rows[0];
};

// ==================== LOCK QUEUE ====================
const lockQueue = async (
  id,
  workerName
) => {

  const query = `
    UPDATE satusehat_queue
    SET
      status = 'processing',
      locked_by = $1,
      locked_at = NOW(),
      updated_at = NOW()
    WHERE id = $2
  `;

  await db.query(query, [
    workerName,
    id
  ]);
};

// ==================== UPDATE GENERIC ====================
const update = async (
  id,
  fields
) => {

  const keys = Object.keys(fields);

  const sets = keys.map(
    (key, index) =>
      `${key} = $${index + 1}`
  );

  const values = Object.values(fields);

  values.push(id);

  const query = `
    UPDATE satusehat_queue
    SET
      ${sets.join(", ")},
      updated_at = NOW()
    WHERE id = $${values.length}
  `;

  await db.query(query, values);
};

// ==================== MARK DONE ====================
const markDone = async (id) => {

  const query = `
    UPDATE satusehat_queue
    SET
      status = 'done',
      processed_at = NOW(),
      locked_by = NULL,
      locked_at = NULL,
      updated_at = NOW()
    WHERE id = $1
  `;

  await db.query(query, [id]);
};

// ==================== MARK FAILED ====================
const markFailed = async (
  id,
  errorMessage
) => {

  const query = `
    UPDATE satusehat_queue
    SET
      status = 'failed',
      retry_count = retry_count + 1,
      last_error = $1,
      locked_by = NULL,
      locked_at = NULL,
      updated_at = NOW()
    WHERE id = $2
  `;

  await db.query(query, [
    errorMessage,
    id
  ]);
};

// ==================== MARK DEAD ====================
const markDead = async (
  id,
  errorMessage
) => {

  const query = `
    UPDATE satusehat_queue
    SET
      status = 'dead',
      retry_count = retry_count + 1,
      last_error = $1,
      locked_by = NULL,
      locked_at = NULL,
      updated_at = NOW()
    WHERE id = $2
  `;

  await db.query(query, [
    errorMessage,
    id
  ]);
};

module.exports = {
  findExistingQueue,
  insertQueue,
  getPendingQueue,
  lockQueue,
  update,
  markDone,
  markFailed,
  markDead
};