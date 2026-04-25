require("dotenv").config();
const db = require("../../db/connection-antrian");

/**
 * GET /api/monitoring/display/summary
 * Query:
 *  - date (optional, default = today)
 *  - offlineThreshold (optional, default = 20 detik)
 */
exports.getDisplaySummary = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().slice(0, 10),
      offlineThreshold = 20
    } = req.query;

    // ===============================
    // Ambil status realtime display
    // ===============================
    const statusSql = `
      SELECT
        device_id,
        last_seen,
        last_ip,
        last_page,
        TIMESTAMPDIFF(SECOND, last_seen, NOW()) AS diff_seconds,
        CASE
          WHEN TIMESTAMPDIFF(SECOND, last_seen, NOW()) <= ?
            THEN 'ONLINE'
          ELSE 'OFFLINE'
        END AS status
      FROM display_status
      ORDER BY device_id
    `;

    const [statusRows] = await db
      .promise()
      .query(statusSql, [offlineThreshold]);

    // hitung online / offline
    let online = 0;
    let offline = 0;

    statusRows.forEach(r => {
      if (r.status === "ONLINE") online++;
      else offline++;
    });

    // ===============================
    // Ambil daily stats (hari ini)
    // ===============================
    const dailySql = `
      SELECT
        device_id,
        disconnect_count,
        total_offline_seconds
      FROM display_daily_stats
      WHERE stat_date = ?
      ORDER BY device_id
    `;

    const [dailyRows] = await db
      .promise()
      .query(dailySql, [date]);

    // ===============================
    // Merge status + daily stats
    // ===============================
    const dailyMap = new Map(
      dailyRows.map(d => [d.device_id, d])
    );

    let totalOfflineSeconds = 0;
    let totalDisconnect = 0;

    const perDisplay = statusRows.map(s => {
      const daily = dailyMap.get(s.device_id) || {
        disconnect_count: 0,
        total_offline_seconds: 0
      };

      totalOfflineSeconds += daily.total_offline_seconds || 0;
      totalDisconnect += daily.disconnect_count || 0;

      return {
        device_id: s.device_id,
        status: s.status,
        last_seen: s.last_seen,
        last_ip: s.last_ip,
        last_page: s.last_page,
        diff_seconds: s.diff_seconds,

        // daily stats
        disconnect_count: daily.disconnect_count || 0,
        total_offline_seconds: daily.total_offline_seconds || 0
      };
    });

    // ===============================
    // Response
    // ===============================
    res.json({
      date,
      offlineThreshold: Number(offlineThreshold),

      summary: {
        totalDisplay: statusRows.length,
        online,
        offline,
        totalOfflineSeconds,
        totalDisconnect
      },

      perDisplay
    });

  } catch (err) {
    console.error("DISPLAY MONITORING ERROR:", err);
    res.status(500).json({
      message: "Gagal ambil monitoring display",
      error: err.message
    });
  }
};


/** REKAP BULANAN */
exports.getDisplayMonthlyRecap = async (req, res) => {
  try {
    const { month, offlineThreshold = 20 } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "Parameter month wajib (format: YYYY-MM)",
      });
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // 1. Ambil data mentah
    const [rows] = await db.promise().query(
      `
      SELECT
        DATE(stat_date) AS stat_date,
        device_id,
        SUM(
          CASE 
            WHEN total_offline_seconds >= ? 
            THEN total_offline_seconds 
            ELSE 0 
          END
        ) AS offline_seconds
      FROM display_daily_stats
      WHERE stat_date BETWEEN ? AND ?
      GROUP BY stat_date, device_id
      ORDER BY stat_date, device_id
      `,
      [offlineThreshold, startDate, endDate]
    );

    if (rows.length === 0) {
      return res.json({
        month,
        devices: [],
        data: [],
      });
    }

    // 2. Ambil daftar device unik
    const devices = [...new Set(rows.map((r) => r.device_id))];

    // 3. Kelompokkan per tanggal
    const mapByDate = {};

    rows.forEach((row) => {
      const date = row.stat_date.toISOString().slice(0, 10);

      if (!mapByDate[date]) {
        mapByDate[date] = { date };
      }

      // convert ke MENIT biar enak dibaca
      mapByDate[date][row.device_id] = Math.round(
        row.offline_seconds / 60
      );
    });

    // 4. Normalisasi: isi device yg tidak ada = 0
    const data = Object.values(mapByDate).map((row) => {
      devices.forEach((dev) => {
        if (row[dev] === undefined) {
          row[dev] = 0;
        }
      });
      return row;
    });

    res.json({
      month,
      devices,
      data,
    });
  } catch (error) {
    console.error("Gagal ambil monitoring display monthly:", error);
    res.status(500).json({
      message: "Gagal ambil monitoring display monthly",
      error: error.message,
    });
  }
};

