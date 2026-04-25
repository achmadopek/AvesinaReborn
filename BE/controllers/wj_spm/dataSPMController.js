const db_lokal = require("../../db/connection-lokal");
const ExcelJS = require("exceljs");

function hitungNilaiAkhir(totalNum, totalDen, measurement) {
  if (!totalDen && measurement !== "jumlah") return null;

  switch (measurement) {
    case "%":
      return (totalNum / totalDen) * 100;

    case "Perseribu":
      return (totalNum / totalDen) * 1000;

    case "Menit":
    case "Detik":
    case "Jam":
    case "Hari":
    case "Minggu":
      return totalNum / totalDen;

    case "Tim":
    case "Orang":
      return totalNum;

    default:
      return totalNum / totalDen;
  }
}

// GET data SPM harian by unit & tanggal
exports.getSPMHarianByUnit = (req, res) => {
  const { unit_id, tgl_sensus } = req.query;

  if (!unit_id || !tgl_sensus) {
    return res.status(400).json({
      success: false,
      message: "unit_id dan tgl_sensus wajib diisi",
    });
  }

  const sql = `
  SELECT
    h.id AS harian_id,
    h.status_verifikasi,
    d.indikator_id,
    d.numerator_value,
    d.denominator_value,
    d.is_meet_standard
  FROM spm_harian h
  JOIN spm_harian_detail d ON d.harian_id = h.id
  WHERE h.unit_id = ?
    AND h.tgl_input = ?
`;

  db_lokal.query(sql, [unit_id, tgl_sensus], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        error: err,
      });
    }

    res.json({
      success: true,
      data: rows,
    });
  });
};

exports.getRekapBulanan = (req, res) => {
  const { unit_id, bulan } = req.query; // contoh: 2026-01

  // -------------------------
  // 1. Validasi input
  // -------------------------
  if (!unit_id || !bulan) {
    return res.status(400).json({
      success: false,
      message: "unit_id dan bulan wajib diisi",
    });
  }

  // -------------------------
  // 2. Query (tetap MySQL 5 friendly)
  // -------------------------
  const sql = `
    SELECT
      i.id AS indikator_id,
      i.judul_indikator,
      i.numerator as nama_numerator,
      i.denominator as nama_denominator,
      i.measurement,
      i.operator,
      i.standart,

      sd.is_meet_standard,
      sd.final_value,

      DATE_FORMAT(d.tgl, '%Y-%m-%d') AS tgl,

      h.id AS harian_id,
      h.status_verifikasi,
      h.catatan_verifikasi,

      COALESCE(SUM(sd.numerator_value), 0) AS numerator,
      COALESCE(SUM(sd.denominator_value), 0) AS denominator

    FROM spm_indikator i

    LEFT JOIN spm_unit_group_pelayanan ug
      ON ug.group_pelayanan_id = i.group_pelayanan_id

    LEFT JOIN spm_unit u 
      ON u.id = ug.unit_id

    -- generate tanggal
    CROSS JOIN (
      SELECT DATE_ADD(DATE(CONCAT(?, '-01')), INTERVAL n DAY) AS tgl
      FROM (
        SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
        SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
        SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
        SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
        SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL
        SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL
        SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
      ) nums
      WHERE DATE_ADD(DATE(CONCAT(?, '-01')), INTERVAL n DAY)
            <= LAST_DAY(DATE(CONCAT(?, '-01')))
    ) d

    -- data harian
    LEFT JOIN spm_harian h
      ON h.tgl_input = DATE(d.tgl)
      AND h.unit_id = u.id

    LEFT JOIN spm_harian_detail sd
      ON sd.harian_id = h.id
      AND sd.indikator_id = i.id

    -- filter
    WHERE u.id = ?

    GROUP BY i.id, d.tgl
    ORDER BY i.id, d.tgl
  `;

  const params = [bulan, bulan, bulan, unit_id];

  // -------------------------
  // 3. Eksekusi query
  // -------------------------
  db_lokal.query(sql, params, (err, rows) => {
    if (err) {
      console.error("getRekapBulanan error:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data rekap",
        error: err,
      });
    }

    // -------------------------
    // 4. Transform data → siap FE
    // -------------------------
    const map = {};
    const mapHarian = {};

    rows.forEach((r) => {
      if (!map[r.indikator_id]) {
        map[r.indikator_id] = {
          indikator_id: r.indikator_id,
          nama_indikator: r.judul_indikator,
          nama_numerator: r.nama_numerator,
          nama_denominator: r.nama_denominator,
          measurement: r.measurement,
          operator: r.operator,
          standart: r.standart,
          data: {},
          total_numerator: 0,
          total_denominator: 0,
        };
      }

      const tglKey = r.tgl;

      // kumpulkan header harian (jangan duplikat)
      if (!mapHarian[tglKey]) {
        mapHarian[tglKey] = {
          tanggal: tglKey,
          harian_id: r.harian_id ?? null,
          status_verifikasi: r.status_verifikasi ?? null,
          catatan_verifikasi: r.catatan_verifikasi ?? null,
        };
      }

      const num = Number(r.numerator) || 0;
      const den = Number(r.denominator) || 0;

      const nilai = r.final_value;
      const memenuhi = r.is_meet_standard;

      map[r.indikator_id].data[tglKey] = {
        harian_id: r.harian_id || null,
        numerator: num,
        denominator: den,
        nilai,
        memenuhi,
        status_verifikasi: r.status_verifikasi,
        catatan_verifikasi: r.catatan_verifikasi,
      };

      map[r.indikator_id].total_numerator += num;
      map[r.indikator_id].total_denominator += den;
    });

    // -------------------------
    // 5. Hitung persen & final result
    // -------------------------
    const result = Object.values(map).map((i) => {
      const nilai = hitungNilaiAkhir(
        i.total_numerator,
        i.total_denominator,
        i.measurement
      );

      return {
        ...i,
        nilai_akhir: nilai !== null ? Number(nilai).toFixed(2) : "NIHIL",
      };
    });

    // -------------------------
    // 6. Response
    // -------------------------
    res.json({
      success: true,
      data: {
        indikator: result,
        harian: Object.values(mapHarian),
      },
    });

  });
};


exports.generateRekapValidasi = (req, res) => {
  const { instalasi_id, bulan, tahun } = req.body;
  // bulan: 1-12

  if (!instalasi_id || !bulan || !tahun) {
    return res.status(400).json({
      success: false,
      message: "instalasi_id, bulan, tahun wajib diisi",
    });
  }

  // 1. Ambil semua unit di instalasi
  const sqlUnit = `
    SELECT id FROM spm_unit
    WHERE instalasi_id = ?
  `;

  db_lokal.query(sqlUnit, [instalasi_id], (err, units) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (!units.length)
      return res.json({ success: false, message: "Unit tidak ditemukan" });

    // 2. Buat / ambil header rekap
    const sqlInsertRekap = `
      INSERT INTO spm_rekap (instalasi_id, bulan, tahun)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
    `;

    db_lokal.query(
      sqlInsertRekap,
      [instalasi_id, bulan, tahun],
      (err, r1) => {
        if (err) return res.status(500).json({ success: false, error: err });

        const rekap_id = r1.insertId;

        // 3. Loop unit → ambil rekap bulanan per unit
        let selesai = 0;

        units.forEach((u) => {
          const unit_id = u.id;
          const bulanStr = `${tahun}-${String(bulan).padStart(2, "0")}`;

          ambilRekapUnit(unit_id, bulanStr, (err, dataRekap) => {
            if (err) return console.error(err);

            simpanDetail(rekap_id, unit_id, dataRekap, () => {
              selesai++;
              if (selesai === units.length) {
                res.json({
                  success: true,
                  message: "Rekap verifikasi berhasil digenerate",
                  rekap_id,
                });
              }
            });
          });
        });
      }
    );
  });
};

function ambilRekapUnit(unit_id, bulan, cb) {
  const sql =
    `SELECT
      i.id AS indikator_id,
      i.judul_indikator,
      i.numerator AS nama_numerator,
      i.denominator AS nama_denominator,
      i.measurement,
      i.operator,
      i.standart,
      d.tgl,

      sd.is_meet_standard,
      sd.final_value,

      COALESCE(SUM(sd.numerator_value), 0) AS numerator,
      COALESCE(SUM(sd.denominator_value), 0) AS denominator

    FROM spm_indikator i

    LEFT JOIN spm_unit_group_pelayanan ug
      ON ug.group_pelayanan_id = i.group_pelayanan_id

    LEFT JOIN spm_unit u
      ON u.id = ug.unit_id

    -- generate tanggal 1 bulan
    CROSS JOIN (
      SELECT DATE_ADD(DATE(CONCAT(?, '-01')), INTERVAL n DAY) AS tgl
      FROM (
        SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
        SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
        SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
        SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
        SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL
        SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL
        SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
      ) nums
      WHERE DATE_ADD(DATE(CONCAT(?, '-01')), INTERVAL n DAY)
            <= LAST_DAY(DATE(CONCAT(?, '-01')))
    ) d

    -- data harian
    LEFT JOIN spm_harian h
      ON h.tgl_input = DATE(d.tgl)
      AND h.unit_id = u.id

    LEFT JOIN spm_harian_detail sd
      ON sd.harian_id = h.id
      AND sd.indikator_id = i.id

    -- filter by unit
    WHERE u.id = ?

    GROUP BY i.id, d.tgl
    ORDER BY i.id, d.tgl
  `;
  const params = [bulan, bulan, bulan, unit_id];

  db_lokal.query(sql, params, (err, rows) => {
    if (err) return cb(err);

    const map = {};

    rows.forEach((r) => {
      if (!map[r.indikator_id]) {
        map[r.indikator_id] = {
          indikator_id: r.indikator_id,
          measurement: r.measurement,
          operator: r.operator,
          standart: r.standart,
          total_numerator: 0,
          total_denominator: 0,
          days_meet: 0,
          days_total: 0,
        };
      }

      const num = Number(r.numerator) || 0;
      const den = Number(r.denominator) || 0;

      const memenuhi = r.is_meet_standard == 1;

      if (den > 0) {
        map[r.indikator_id].days_total++;

        if (memenuhi) {
          map[r.indikator_id].days_meet++;
        }
      }

      map[r.indikator_id].total_numerator += num;
      map[r.indikator_id].total_denominator += den;
    });

    const result = Object.values(map).map((i) => {
      const avg =
        i.total_denominator > 0
          ? (i.total_numerator / i.total_denominator) * 100
          : null;

      const meetPercent =
        i.days_total > 0
          ? (i.days_meet / i.days_total) * 100
          : null;

      return {
        indikator_id: i.indikator_id,
        avg_value: avg ? avg.toFixed(2) : null,
        meet_percent: meetPercent ? meetPercent.toFixed(2) : null,
        days_meet: i.days_meet,
        days_total: i.days_total,
      };
    });

    cb(null, result);
  });
}

function simpanDetail(rekap_id, unit_id, data, done) {
  if (!data.length) return done();

  const values = data.map((d) => [
    rekap_id,
    unit_id,
    d.indikator_id,
    d.avg_value,
    d.meet_percent,
    d.days_meet,
    d.days_total,
  ]);

  const sql = `
    INSERT INTO spm_rekap_detail
    (rekap_id, unit_id, indikator_id, avg_value, meet_percent, days_meet, days_total)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      avg_value=VALUES(avg_value),
      meet_percent=VALUES(meet_percent),
      days_meet=VALUES(days_meet),
      days_total=VALUES(days_total)
  `;

  db_lokal.query(sql, [values], (err) => {
    if (err) console.error("simpanDetail error:", err);
    done();
  });
}

// Rekap RINGKAS (summary) pakai DATE RANGE
exports.getRekapRingkas = (req, res) => {
  const { mode, id, start_date, end_date } = req.query;

  if (!mode || !id || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: "mode, id, start_date, dan end_date wajib diisi",
    });
  }

  let where = "";
  if (mode === "unit") where = "u.id = ?";
  if (mode === "instalasi") where = "u.instalasi_id = ?";
  if (mode === "bidang") where = "u.bidang_id = ?";

  if (!where) {
    return res.status(400).json({
      success: false,
      message: "mode tidak valid",
    });
  }

  const sql = `
    SELECT 
      u.id AS unit_id,
      u.nama_unit,
      DATE_FORMAT(h.tgl_input, '%Y-%m') AS periode,
      COUNT(DISTINCT h.tgl_input) AS hari_isi
    FROM spm_unit u
    LEFT JOIN spm_harian h 
      ON h.unit_id = u.id
      AND h.tgl_input BETWEEN ? AND ?
    WHERE ${where}
    GROUP BY u.id, periode
    ORDER BY u.nama_unit, periode
  `;

  const params = [start_date, end_date, id];

  db_lokal.query(sql, params, (err, rows) => {
    if (err) {
      console.error("getRekapRingkas error:", err);
      return res.status(500).json({ success: false, error: err });
    }

    // transform → per unit
    const map = {};
    rows.forEach((r) => {
      if (!map[r.unit_id]) {
        map[r.unit_id] = {
          unit_id: r.unit_id,
          nama_unit: r.nama_unit,
          periode: {},
        };
      }

      map[r.unit_id].periode[r.periode] = r.hari_isi;
    });

    res.json({
      success: true,
      data: Object.values(map),
    });
  });
};

exports.validasiBulanan = (req, res) => {
  const { instalasi_id, bulan, tahun, status_validasi, catatan } = req.body;
  const user_id = req.user.id; // dari middleware auth

  if (!instalasi_id || !bulan || !tahun)
    return res.status(400).json({ success: false });

  const sql = `
    UPDATE spm_rekap
    SET 
      status_validasi = ?,
      catatan_validasi = ?,
      validated_at = NOW(),
      validated_by = ?,
      is_locked = 1
    WHERE instalasi_id = ?
      AND bulan = ?
      AND tahun = ?
  `;

  db_lokal.query(
    sql,
    [status_validasi, catatan, user_id, instalasi_id, bulan, tahun],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err });

      res.json({ success: true });
    }
  );
};
