const crypto = require('crypto');

const key = process.env.SECRET_KEY;
const iv = Buffer.alloc(16, 0); 

function decryptNik(encryptedBuffer) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function maskNik(nik) {
  return nik.replace(/^.{10}/, '**********');
}

module.exports = { decryptNik, maskNik };
