// Middleware untuk memverifikasi token JWT dalam request
const jwt = require('jsonwebtoken');

// Mengambil secret key dari environment variable
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  // Mengambil header Authorization dari request (format: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Ambil token setelah kata "Bearer"

  // Jika tidak ada token, kirim respons 401 (Unauthorized)
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  // Verifikasi token menggunakan secret key
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("JWT ERROR:", err.message);
      return res.status(403).json({ message: 'Token tidak valid' });
    }

    const role = decoded.roles?.[0]?.roles?.[0]?.role_name;

    req.user = {
      peg_id: decoded.id,
      role: role,
      employee_id: decoded.employee_id
    };

    console.log("DECODED:", decoded);
    console.log("REQ.USER:", req.user);
    console.log("ROLE:", req.user.role);

    next();
  });
};
