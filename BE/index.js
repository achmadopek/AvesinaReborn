// ==========================
// IMPORT DAN KONFIGURASI DASAR
// ==========================
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================
// KONEKSI DATABASE
// ==========================
const db_avesina = require('./db/connection-avesina');
const db_erm = require('./db/connection-erm');
const db_lokal = require('./db/connection-lokal');
const db_aset = require('./db/connection-aset');
const db_secman = require('./db/connection-secman');
const db_antrian = require('./db/connection-antrian');

const http = require("http");
const { WebSocketServer } = require("ws");

// Tes koneksi DB (dd singkat)
[[db_avesina, 'Avesina'], [db_lokal, 'Lokal'], [db_aset, 'Aset'], [db_secman, 'Secman'], [db_antrian, 'Antrian'], [db_erm, 'ERM']].forEach(([db, name]) => {
  db.getConnection((err, conn) => {
    if (err) console.error(`Gagal DB ${name}:`, err.message);
    else {
      console.log(`Terhubung ke DB ${name}`);
      conn.release();
    }
  });
});

// ==========================
// KONFIGURASI CORS
// ==========================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ==========================
// AUTH ROUTES
// ==========================
const authRoutes = require('./routes/AuthRoutes');
app.use('/api', authRoutes);

// ==========================
// AUTH ROUTES MTH
// ==========================
const authRoutesMTH = require('./routes/AuthRoutesMTH');
app.use('/api/rswj-inv/auth', authRoutesMTH);

// ==========================
// MIDDLEWARE TOKEN
// ==========================
const jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ada' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid' });
    req.user = user;
    next();
  });
}

app.get('/api/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================
// ROUTES MODUL UMUM
// ==========================
app.use('/api/UnitSearch', require('./routes/UnitSearch'));
app.use('/api/Notification', require('./routes/Notification'));

// ADMIN
app.use("/api/admin/MasterUnitSPM", require("./routes/admin/MasterUnitSPM"));
app.use("/api/admin/MasterInstalasiSPM", require("./routes/admin/MasterInstalasiSPM"));

// SDM
app.use("/api/sdm/Dashboard", require("./routes/wj_sdm/DashboardSDM"));
app.use('/api/sdm/PegawaiSearch', require('./routes/wj_sdm/MasterPegawai'));
app.use('/api/sdm/MasterPegawai', require('./routes/wj_sdm/MasterPegawai'));
app.use('/api/sdm/KegiatanPegawai', require('./routes/wj_sdm/KegiatanPegawai'));
app.use('/api/sdm/PresensiPegawai', require('./routes/wj_sdm/PresensiPegawai'));
app.use('/api/sdm/MutasiPegawai', require('./routes/wj_sdm/MutasiPegawai'));

// THP
app.use('/api/thp/DashboardTHP', require('./routes/wj_thp/DashboardTakeHomePay'));
app.use('/api/thp/MasterKeuangan', require('./routes/wj_thp/MasterKeuangan'));
app.use('/api/thp/KomponenPenghasilan', require('./routes/wj_thp/KomponenPenghasilan'));
app.use('/api/thp/KomponenPotongan', require('./routes/wj_thp/KomponenPotongan'));
app.use('/api/thp/ImportGajiPegawai', require('./routes/wj_thp/ImportGajiPegawai'));
app.use('/api/thp/ImportJPJMPegawai', require('./routes/wj_thp/ImportJPJMPegawai'));
app.use('/api/thp/PenghasilanPegawai', require('./routes/wj_thp/PenghasilanPegawai'));
app.use('/api/thp/PotonganPegawai', require('./routes/wj_thp/PotonganPegawai'));
app.use('/api/thp/EndrollTHP', require('./routes/wj_thp/EndrollTakeHomePay'));
app.use('/api/thp/LaporanTHP', require('./routes/wj_thp/LaporanTakeHomePay'));

// Monitoring
app.use('/api/mibers/DaftarPoli', require('./routes/wj_mibers/DaftarPoli'));
app.use('/api/mibers/MasterAnjungan', require('./routes/wj_mibers/MasterAnjungan'));
app.use('/api/mibers/MonitoringAplicares', require('./routes/wj_mibers/MonitoringAplicares'));
app.use('/api/mibers/MonitoringIcare', require('./routes/wj_mibers/MonitoringIcare'));
app.use('/api/mibers/MonitoringAntrian', require('./routes/wj_mibers/MonitoringAntrian'));
app.use('/api/mibers/MonitoringSatuSehat', require('./routes/wj_mibers/MonitoringSatuSehat'));
app.use('/api/mibers/MonitoringTHP', require('./routes/wj_mibers/MonitoringTHP'));
app.use('/api/mibers/MonitoringDisplay', require('./routes/wj_mibers/MonitoringDisplay'));

// SPM
app.use('/api/spm/MasterUnit', require('./routes/wj_spm/MasterUnitRoutes'));
app.use("/api/spm/EntriSPMHarian", require("./routes/wj_spm/EntriSPMHarianRoutes"));
app.use("/api/spm/DataSPM", require("./routes/wj_spm/DataSPMRoutes"));
app.use("/api/spm/DashboardSPM", require("./routes/wj_spm/DashboardRoutes"));
app.use("/api/spm/VerifikasiSPMHarian", require("./routes/wj_spm/VerifikasiSPMHarianRoutes"));

// INM
app.use("/api/inm/EntriINMHarian", require("./routes/wj_inm/EntriINMHarianRoutes"));
app.use("/api/inm/DataINM", require("./routes/wj_inm/DataINMRoutes"));
app.use("/api/inm/DashboardINM", require("./routes/wj_inm/DashboardRoutes"));
app.use("/api/inm/VerifikasiINMHarian", require("./routes/wj_inm/VerifikasiINMHarianRoutes"));

// Mobay
app.use("/api/mobay/Dashboard", require("./routes/wj_mobay/DashboardMobay"));
app.use('/api/mobay/KonsolidasiTagihan', require('./routes/wj_mobay/KonsolidasiTagihanRoutes'));
app.use('/api/mobay/PengajuanTagihan', require('./routes/wj_mobay/PengajuanTagihanRoutes'));
app.use('/api/mobay/PengirimanBerkas', require('./routes/wj_mobay/PengirimanBerkasRoutes'));
app.use('/api/mobay/PenerimaanBerkas', require('./routes/wj_mobay/PenerimaanBerkasRoutes'));
app.use('/api/mobay/VerifikasiPengajuan', require('./routes/wj_mobay/VerifikasiPengajuanRoutes'));
app.use('/api/mobay/PembayaranTagihan', require('./routes/wj_mobay/PembayaranTagihanRoutes'));
app.use('/api/mobay/MonitoringTagihan', require('./routes/wj_mobay/MonitoringTagihanRoutes'));
app.use("/api/mobay/RekapPembayaranBahanMedis", require("./routes/wj_mobay/RekapPembayaranBahanMedis"));

// Antrian
app.use("/api/antrian/AntrianPasien", require("./routes/wj_antrian/AntrianPasien"));

// MCU
app.use("/api/mcu/DataMCU", require("./routes/wj_mcu/DataMCURoutes"));
app.use("/api/mcu/DataPasienMCU", require("./routes/wj_mcu/DataPasienMCURoutes"));
app.use("/api/mcu/SaveMirrorMCU", require("./routes/wj_mcu/MCUMirrorRoutes"));
app.use("/api/mcu/HasilAkhirMCU", require("./routes/wj_mcu/MCUMirrorRoutes"));
app.use("/api/mcu/DataBiometrik", require("./routes/wj_mcu/DataBiometrikRoutes"));

// WAVA
app.use("/api/wava/VirtualAssistant", require("./routes/wava/PrologWavaRoutes"));

// BUGARR
app.use("/api/bugarr/MonitoringBugarr", require("./routes/wj_bugarr/MonitoringBugarrRoutes"));

// SIRAD
app.use("/api/sirad/MonitoringXRay", require("./routes/wj_sirad/MonitoringXRayRoutes"));

app.use("/uploads", express.static("uploads"));

// ==========================
// JALANKAN SERVER + WEBSOCKET
// ==========================
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer(app);

// ========== INISIALISASI WEBSOCKET ==========
// (dipisah dari server.listen agar global.broadcast bisa akses wss)
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "connected", message: "WS connected" }));
});

// Broadcast global untuk semua modul
function broadcastToClients(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// buat global supaya bisa dipanggil dari controller mana saja
global.broadcastToClients = broadcastToClients;


server.listen(PORT, HOST, () => {
  console.log(`Server berjalan di http://${HOST}:${PORT}`);
});
