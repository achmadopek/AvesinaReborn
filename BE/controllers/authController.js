const db = require('../db/connection-lokal');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || 'refresh_secret_default';

// Durasi token
const ACCESS_TOKEN_EXPIRES = '1h'; // 1 jam
const REFRESH_TOKEN_EXPIRES = '7d'; // 7 hari

// Buat Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      peg_id: user.peg_id,
      nama: user.nama
    },
    SECRET_KEY,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

// Buat Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET_KEY,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
};

// ===== LOGIN =====
exports.login = (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT u.id, u.username, u.password, u.status, u.peg_id, p.employee_nm AS nama
    FROM users u
    LEFT JOIN sdm_pegawai p ON u.peg_id = p.id
    WHERE u.username = ?
    LIMIT 1
  `;

  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

    const user = results[0];

    if (user.status === 'Non-Aktif') {
      return res.status(403).json({ error: 'Akun Anda nonaktif. Silakan hubungi Kepegawaian.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password salah' });

    // Ambil semua roles user
    const roleSql = `SELECT role FROM user_roles WHERE user_id = ?`;
    db.query(roleSql, [user.id], (roleErr, roleResults) => {
      if (roleErr) return res.status(500).json({ error: 'Server error roles' });
      const roles = roleResults.map(r => r.role);

      if (roles.length === 0) {
        return res.status(403).json({ error: 'User tidak memiliki role' });
      }

      if (roles.length === 1) {
        // langsung generate token
        const payload = { ...user, role: roles[0] };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
          token: accessToken,
          user: {
            id: user.id,
            username: user.username,
            role: roles[0],
            peg_id: user.peg_id,
            nama: user.nama
          }
        });
      } else {
        // kirim list roles ke FE, supaya pilih salah satu
        return res.json({
          needRoleSelection: true,
          user: {
            id: user.id,
            username: user.username,
            peg_id: user.peg_id,
            nama: user.nama
          },
          roles
        });
      }
    });
  });
};

// ===== SELECT ROLE =====
exports.selectRole = (req, res) => {
  const { userId, role } = req.body;

  const sql = `
    SELECT u.id, u.username, u.peg_id, p.employee_nm AS nama
    FROM users u
    LEFT JOIN sdm_pegawai p ON u.peg_id = p.id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const user = results[0];

    // pastikan role valid untuk user
    const roleSql = `SELECT role FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1`;
    db.query(roleSql, [userId, role], (roleErr, roleResults) => {
      if (roleErr) return res.status(500).json({ error: 'Server error' });
      if (roleResults.length === 0) {
        return res.status(403).json({ error: 'Role tidak valid untuk user ini' });
      }

      const payload = { ...user, role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        token: accessToken,
        user: {
          id: user.id,
          username: user.username,
          role,
          peg_id: user.peg_id,
          nama: user.nama
        }
      });
    });
  });
};

// ===== REFRESH TOKEN =====
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token tidak ada' });

  jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Refresh token tidak valid atau sudah expired' });

    // Ambil data user dari database untuk generate access token baru
    const sql = `
      SELECT id, username, role, peg_id, sdm_pegawai.employee_nm AS nama
      FROM users
      LEFT JOIN sdm_pegawai ON users.peg_id = sdm_pegawai.id
      WHERE id = ?
      LIMIT 1
    `;

    db.query(sql, [decoded.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).json({ error: 'User tidak ditemukan' });
      }

      const user = results[0];
      const newAccessToken = generateAccessToken(user);

      res.json({ token: newAccessToken });
    });
  });
};