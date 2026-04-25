const db = require("../../db/connection-lokal");

const conn = db.promise();

/**
 * ============================
 * 1. GRAFIK + KPI RINGKAS
 * ============================
 */
exports.getGrafikDashboard = async (req, res) => {
  try {
    const [rows] = await conn.query(`
      SELECT
        COUNT(*) AS totalPegawai,
        SUM(employee_sts = 'PNS') AS pns,
        SUM(employee_sts <> 'PNS') AS nonPns,
        SUM(job_sts LIKE 'Dokter%') AS dokter,
        SUM(job_sts NOT LIKE 'Dokter%') AS nonDokter
      FROM sdm_pegawai
    `);

    // Grafik MKG
    const [mkg] = await conn.query(`
      SELECT
        CASE
          WHEN mkg BETWEEN 0 AND 2 THEN '0-2'
          WHEN mkg BETWEEN 3 AND 5 THEN '3-5'
          WHEN mkg BETWEEN 6 AND 8 THEN '6-8'
          WHEN mkg BETWEEN 9 AND 11 THEN '9-11'
          WHEN mkg BETWEEN 12 AND 14 THEN '12-14'
          WHEN mkg BETWEEN 15 AND 19 THEN '15-19'
          WHEN mkg BETWEEN 20 AND 24 THEN '20-24'
          ELSE '≥25'
        END AS label,
        COUNT(*) AS total
      FROM sdm_pegawai
      GROUP BY label
      ORDER BY
        MIN(mkg);
    `);

    res.json({
      summary: rows[0],
      grafikMKG: {
        labels: mkg.map(r => r.label),
        data: mkg.map(r => r.total),
      },
    });

  } catch (err) {
    console.error('[getGrafikDashboard]', err);
    res.status(500).json({ message: 'Gagal load dashboard SDM' });
  }
};


/**
 * ============================
 * 2. ALERT ADMINISTRATIF
 * ============================
 */
exports.getAlertAdministratif = async (req, res) => {
  try {
    const [rows] = await conn.query(`
      SELECT
        SUM(verified_at IS NULL) AS belumVerified,
        SUM(validated_at IS NULL) AS belumValidated
      FROM sdm_pegawai
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error('[getAlertAdministratif]', err);
    res.status(500).json({ message: "Error alert administratif" });
  }
};


/**
 * ============================
 * 3. TOP RANKING
 * ============================
 */
exports.getTopRanking = async (req, res) => {
  try {
    const allowedGroupBy = {
      employee_sts: 'employee_sts',
      job_sts: 'job_sts',
      doctor_sts: 'doctor_sts',
      golongan: 'golongan',
      pangkat: 'pangkat',
      education: 'education',
    };

    const key = req.query.by || 'employee_sts';
    if (!allowedGroupBy[key]) {
      return res.status(400).json({ message: 'Invalid parameter' });
    }

    const column = allowedGroupBy[key];

    const [rows] = await conn.query(`
      SELECT 
        ${column} AS label,
        COUNT(*) AS total
      FROM sdm_pegawai
      WHERE ${column} IS NOT NULL
      GROUP BY ${column}
      ORDER BY total DESC
      LIMIT 5
    `);

    res.json(rows);

  } catch (err) {
    console.error('[getTopRanking]', err);
    res.status(500).json({ message: 'Gagal load top ranking' });
  }
};


/**
 * ============================
 * 4. BOTTOM RANKING
 * ============================
 */
exports.getBottomRanking = async (req, res) => {
  try {
    const allowedGroupBy = {
      employee_sts: 'employee_sts',
      job_sts: 'job_sts',
      doctor_sts: 'doctor_sts',
      golongan: 'golongan',
      pangkat: 'pangkat',
      education: 'education',
    };

    const key = req.query.by || 'employee_sts';
    if (!allowedGroupBy[key]) {
      return res.status(400).json({ message: 'Invalid parameter' });
    }

    const column = allowedGroupBy[key];

    const [rows] = await conn.query(`
      SELECT 
        ${column} AS label,
        COUNT(*) AS total
      FROM sdm_pegawai
      WHERE ${column} IS NOT NULL
      GROUP BY ${column}
      ORDER BY total ASC
      LIMIT 5
    `);

    res.json(rows);

  } catch (err) {
    console.error('[getBottomRanking]', err);
    res.status(500).json({ message: 'Dashboard bottom error' });
  }
};

