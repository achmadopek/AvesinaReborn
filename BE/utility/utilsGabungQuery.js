const notificationQueries = require('../middleware/notificationQueries');

function buildUnionQuery(role, peg_id) {
  const queries = typeof notificationQueries[role] === "function"
    ? notificationQueries[role](peg_id)
    : notificationQueries[role];

  if (!queries) {
    return `select null as pegID, 'Tidak ada data' as status, '' as route, '' as object, '' as judul, '${role}' as role`;
  }

  return queries.join('\nUNION ALL\n');
}

module.exports = { buildUnionQuery };
