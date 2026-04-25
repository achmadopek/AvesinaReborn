const bcrypt = require('bcryptjs');

function generateHash(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

module.exports = generateHash;