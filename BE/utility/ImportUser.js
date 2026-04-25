const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Baca file Excel
const workbook = xlsx.readFile(path.join(__dirname, '../users.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const users = xlsx.utils.sheet_to_json(sheet);

// Siapkan stream untuk menulis ke file
const outputFilePath = path.join(__dirname, 'output.sql');
const writeStream = fs.createWriteStream(outputFilePath);

// Proses dan tulis hasil SQL-nya
users.forEach(user => {
  const { nik, username, password, role } = user;

  // Hash password
  const hashedPassword = bcrypt.hashSync(String(password), 10);

  // SQL query
  const sql = `INSERT INTO users (peg_id, username, password, role) VALUES ('${nik}', '${username}', '${hashedPassword}', '${role}');\n`;

  // Tulis SQL ke dalam file
  writeStream.write(sql);
});

// Tutup stream setelah selesai menulis
writeStream.end(() => {
  console.log(`SQL queries have been exported to ${outputFilePath}`);
});
