// dashboardMobayController.js
const db = require("../../db/connection-lokal");

const getMonthsInRange = (start, end) => {
  const result = [];
  let cur = new Date(start);
  const last = new Date(end);

  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

  while (cur <= last) {
    result.push(cur.getMonth() + 1);
    cur.setMonth(cur.getMonth() + 1);
  }

  return result;
};

exports.getRekapIndikator = async (req, res) => {
  try {
    const { mode, id, start_date, end_date } = req.query;

    if (!mode || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "parameter tidak lengkap",
      });
    }

    /**
     * ==========================
     * 1. Tentukan JOIN & FILTER
     * ==========================
     */
    let whereUnit = "";
    let joinEntity = "";
    let selectEntity = "";

    if (mode === "unit") {
      whereUnit = "u.id = ?";
      joinEntity = "";
      selectEntity = "u.nama_unit AS nama_entity";
    }
    if (mode === "instalasi") {
      whereUnit = "u.instalasi_id = ?";
      joinEntity = "LEFT JOIN inm_instalasi ins ON ins.id = u.instalasi_id";
      selectEntity = "ins.nama_instalasi AS nama_entity";
    }
    if (mode === "bidang") {
      whereUnit = "u.bidang_id = ?";
      joinEntity = "LEFT JOIN inm_bidang b ON b.id = u.bidang_id";
      selectEntity = "b.nama_bidang AS nama_entity";
    }

    if (!whereUnit) {
      return res.status(400).json({
        success: false,
        message: "mode tidak valid",
      });
    }

    /**
     * ==========================
     * 2. Query utama
     * ==========================
     */
    const sql = `
      SELECT
        i.id AS indikator_id,
        i.judul_indikator,
        i.standart AS target,
        i.measurement AS satuan,
        YEAR(h.tgl_input) AS tahun,
        MONTH(h.tgl_input) AS bulan,
        SUM(sd.numerator_value) AS numerator,
        SUM(sd.denominator_value) AS denominator,
        ${selectEntity}
      FROM inm_indikator i
      JOIN inm_harian_detail sd ON sd.indikator_id = i.id
      JOIN inm_harian h ON h.id = sd.harian_id
      JOIN inm_unit u ON u.id = h.unit_id
      ${joinEntity}
      WHERE h.tgl_input BETWEEN ? AND ?
        AND ${whereUnit}
      GROUP BY
        i.id, tahun, bulan
      ORDER BY i.id, tahun, bulan
    `;

    const params = id
      ? [start_date, end_date, id]
      : [start_date, end_date];

    /**
     * ==========================
     * 3. Eksekusi
     * ==========================
     */
    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("getRekapIndikator error:", err);
        return res.status(500).json({ success: false, error: err });
      }

      /**
       * ======================
       * 4. TRANSFORM DATA
       * ======================
       */
      const bulanRange = getMonthsInRange(start_date, end_date);
      const map = {};
      let namaEntity = null;

      rows.forEach((r) => {
        namaEntity = r.nama_entity;

        if (!map[r.indikator_id]) {
          const bulanInit = {};
          bulanRange.forEach((b) => (bulanInit[b] = null));

          map[r.indikator_id] = {
            indikator_id: r.indikator_id,
            indikator: r.judul_indikator,
            target: r.target,
            satuan: r.satuan,
            tahun: r.tahun,
            bulan: bulanInit,
            total_num: 0,
            total_den: 0,
          };
        }

        const nilai =
          r.denominator > 0
            ? (r.numerator / r.denominator) * 100
            : null;

        map[r.indikator_id].bulan[r.bulan] =
          nilai !== null ? Number(nilai.toFixed(2)) : null;

        map[r.indikator_id].total_num += r.numerator;
        map[r.indikator_id].total_den += r.denominator;
      });

      /**
       * ======================
       * 5. RESPONSE
       * ======================
       */
      const result = Object.values(map).map((i) => ({
        indikator_id: i.indikator_id,
        indikator: i.indikator,
        target: i.target,
        satuan: i.satuan,
        tahun: i.tahun,
        bulan: i.bulan,
        capaian:
          i.total_den > 0
            ? ((i.total_num / i.total_den) * 100).toFixed(2)
            : null,
      }));

      res.json({
        success: true,
        meta: {
          mode,
          id,
          nama: namaEntity,
          periode: {
            start: start_date,
            end: end_date,
            bulan: bulanRange,
          },
        },
        data: result,
      });
      
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
};