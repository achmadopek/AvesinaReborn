const ExcelJS = require("exceljs");
const db = require("../../db/connection-lokal");

const UMR = 3174500; // TODO: bisa dari tabel / config

exports.getMonitoringTHP = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      startDate = "",
      endDate = "",
      peg_id = "",
      employee_sts = "",
      pegawai_name = ""
    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let filter = "WHERE 1=1";
    const params = [];

    // =======================
    // FILTER
    // =======================
    if (peg_id) {
      filter += " AND thp.peg_id = ?";
      params.push(peg_id);
    }

    if (employee_sts) {
      filter += " AND p.employee_sts = ?";
      params.push(employee_sts);
    }

    if (pegawai_name) {
      filter += " AND p.nama LIKE ?";
      params.push(`%${pegawai_name}%`);
    }

    if (startDate) {
      filter += " AND thp.periode >= ?";
      params.push(`${startDate}-01`);
    }

    if (endDate) {
      filter += " AND thp.periode <= ?";
      params.push(`${endDate}-01`);
    }

    // =======================
    // TOTAL PERIODE (PAGINATION)
    // =======================
    const [[{ total }]] = await db.promise().query(
      `
      SELECT COUNT(DISTINCT thp.periode) AS total
      FROM thp_take_home_pay thp
      JOIN sdm_pegawai p ON p.id = thp.peg_id
      ${filter}
      `,
      params
    );

    const totalPages = Math.ceil(total / limit);

    // =======================
    // DATA UTAMA (PER PERIODE)
    // =======================
    const [rows] = await db.promise().query(
      `
      SELECT
        DATE_FORMAT(thp.periode,'%Y-%m') AS periode,
        SUM(thp.total_penghasilan) AS total_penghasilan,
        SUM(thp.total_potongan) AS total_potongan,
        SUM(thp.thp) AS thp
      FROM thp_take_home_pay thp
      JOIN sdm_pegawai p ON p.id = thp.peg_id
      ${filter}
      GROUP BY thp.periode
      ORDER BY thp.periode DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    // =======================
    // SUMMARY RUPIAH
    // =======================
    const [[summaryAmount]] = await db.promise().query(
      `
      SELECT
        SUM(thp.total_penghasilan) AS total_penghasilan,
        SUM(thp.total_potongan) AS total_potongan,
        SUM(thp.thp) AS total_thp
      FROM thp_take_home_pay thp
      JOIN sdm_pegawai p ON p.id = thp.peg_id
      ${filter}
      `,
      params
    );

    // =======================
    // STATISTIK PEGAWAI vs UMR
    // =======================
    const [[stats]] = await db.promise().query(
      `
      SELECT
        COUNT(*) AS total_pegawai,
        SUM(CASE WHEN x.thp < ? THEN 1 ELSE 0 END) AS below_umr,
        SUM(CASE WHEN x.thp >= ? THEN 1 ELSE 0 END) AS above_umr
      FROM (
        SELECT
          thp.peg_id,
          thp.thp
        FROM thp_take_home_pay thp
        JOIN sdm_pegawai p ON p.id = thp.peg_id
        ${filter}
        AND thp.periode = (
          SELECT MAX(t2.periode)
          FROM thp_take_home_pay t2
          WHERE t2.peg_id = thp.peg_id
        )
        GROUP BY thp.peg_id
      ) x
      `,
      [UMR, UMR, ...params]
    );

    // =======================
    // RESPONSE
    // =======================
    res.json({
      data: rows,
      currentPage: page,
      totalPages,
      summary: {
        ...summaryAmount,
        total_pegawai: stats.total_pegawai,
        below_umr: stats.below_umr,
        above_umr: stats.above_umr,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil monitoring THP" });
  }
};


exports.exportMonitoringTHP = async (req, res) => {
  try {
    const {
      startDate = "",
      endDate = "",
      peg_id = "",
      employee_sts = "",
      pegawai_name = ""
    } = req.query;

    let filter = "WHERE 1=1";
    const params = [];

    if (peg_id) {
      filter += " AND thp.peg_id = ?";
      params.push(peg_id);
    }

    if (employee_sts) {
      filter += " AND p.employee_sts = ?";
      params.push(employee_sts);
    }

    if (pegawai_name) {
      filter += " AND p.nama LIKE ?";
      params.push(`%${pegawai_name}%`);
    }

    if (startDate) {
      filter += " AND thp.periode >= ?";
      params.push(`${startDate}-01`);
    }

    if (endDate) {
      filter += " AND thp.periode <= ?";
      params.push(`${endDate}-01`);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        p.nama AS nama_pegawai,
        DATE_FORMAT(thp.periode,'%Y-%m') AS periode,
        thp.total_penghasilan,
        thp.total_potongan,
        thp.thp
      FROM thp_take_home_pay thp
      JOIN sdm_pegawai p ON p.id = thp.peg_id
      ${filter}
      ORDER BY thp.periode DESC
      `,
      params
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Monitoring THP");

    ws.addRow([
      "Nama Pegawai",
      "Periode",
      "Penghasilan",
      "Potongan",
      "Take Home Pay"
    ]);

    rows.forEach(r => {
      ws.addRow([
        r.nama_pegawai,
        r.periode,
        r.total_penghasilan,
        r.total_potongan,
        r.thp
      ]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=monitoring-thp.xlsx"
    );

    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal export THP" });
  }
};
