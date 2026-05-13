require("dotenv").config();
const ExcelJS = require("exceljs");
const db = require("../../db/connection-avesina");   // DB1

require("dotenv").config();

exports.getData = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      dokter = null,
      statusFilter = "",
      startDate = "",
      endDate = "",
      search = "",
      sortBy = "v.visite_dt",
      sortOrder = "DESC"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    let filter = `WHERE 1=1`;
    const params = [];

    if (statusFilter === "spm_ok") {
      filter += `
        AND TIME(v.visite_dt)
          BETWEEN '06:00:00' AND '14:00:00'
      `;
    }
    
    if (statusFilter === "spm_no") {
      filter += `
        AND (
          TIME(v.visite_dt) < '06:00:00'
          OR TIME(v.visite_dt) > '14:00:00'
        )
      `;
    }
    
    if (statusFilter === "inm_ok") {
      filter += `
        AND TIME(v.visite_dt)
          BETWEEN '08:00:00' AND '14:00:00'
      `;
    }
    
    if (statusFilter === "inm_no") {
      filter += `
        AND (
          TIME(v.visite_dt) < '08:00:00'
          OR TIME(v.visite_dt) > '14:00:00'
        )
      `;
    }

    const allowedSort = {
      visite_dt: "v.visite_dt",
      employee_nm: "e.employee_nm",
      medical_service_name: "ms.medical_service_name",
      srvc_unit_nm: "su.srvc_unit_nm",
      patient_nm: "p.patient_nm",
      mr_code: "p.mr_code",
      spm_status: `
        CASE
          WHEN TIME(v.visite_dt)
            BETWEEN '06:00:00' AND '14:00:00'
          THEN 1
          ELSE 0
        END
      `,

      inm_status: `
        CASE
          WHEN TIME(v.visite_dt)
            BETWEEN '08:00:00' AND '14:00:00'
          THEN 1
          ELSE 0
        END
      `
    };
    
    const orderBy =
      allowedSort[sortBy] || "v.visite_dt";
    
    const orderDirection =
      sortOrder === "ASC" ? "ASC" : "DESC";

    // FILTER DOKTER
    if (dokter && dokter !== "ALL") {
      filter += ` AND e.employee_id = ?`;
      params.push(dokter);
    }

    // FILTER TANGGAL
    if (startDate && endDate) {
      filter += ` 
        AND v.visite_dt BETWEEN ? AND ?
      `;

      params.push(
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`
      );
    }

    // SEARCH DOKTER / TINDAKAN
    if (search) {
      filter += `
        AND (
          e.employee_nm LIKE ?
          OR ms.medical_service_name LIKE ?
          OR su.srvc_unit_nm LIKE ?
        )
      `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    // =========================
    // TOTAL ROW
    // =========================
    const countSql = `
      SELECT COUNT(*) AS total
      FROM visite v
      JOIN unit_visit uv ON uv.unit_visit_id = v.unit_visit_id
      JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
      JOIN employee e ON e.employee_id = v.employee_id
      JOIN medical_service ms ON ms.medical_service_id = v.medical_service_id
      ${filter}
    `;

    const [[{ total }]] = await db.promise().query(countSql, params);

    // =========================
    // DATA
    // =========================
    const dataSql = `
      SELECT
        v.visite_id,
        v.visite_dt,
        e.employee_id,
        e.employee_nm,
        ms.medical_service_name,
        su.srvc_unit_nm,
        p.mr_code,
        p.patient_nm
      FROM visite v
      JOIN unit_visit uv ON uv.unit_visit_id = v.unit_visit_id
      JOIN registry r ON r.registry_id = uv.registry_id
      JOIN patient p ON p.mr_id = r.mr_id
      JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
      JOIN employee e ON e.employee_id = v.employee_id
      JOIN medical_service ms ON ms.medical_service_id = v.medical_service_id
      ${filter}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.promise().query(dataSql, [
      ...params,
      limit,
      offset
    ]);

    // =========================
    // REKAP DOKTER
    // =========================
    const recapSql = `
      SELECT
        e.employee_nm,
        COUNT(v.visite_id) AS total_visite
      FROM visite v

      JOIN unit_visit uv
        ON uv.unit_visit_id = v.unit_visit_id

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN employee e
        ON e.employee_id = v.employee_id

      JOIN medical_service ms
        ON ms.medical_service_id = v.medical_service_id

      ${filter}

      GROUP BY e.employee_id
      ORDER BY total_visite DESC
    `;

    const [rekapDokter] = await db.promise().query(recapSql, params);

    // =========================
    // SUMMARY
    // =========================
    const summarySql = `
      SELECT

        COUNT(v.visite_id) AS totalVisite,

        -- ======================
        -- SPM 06:00 - 14:00
        -- ======================
        SUM(
          CASE
            WHEN TIME(v.visite_dt)
              BETWEEN '06:00:00' AND '14:00:00'
            THEN 1 ELSE 0
          END
        ) AS spmStandar,

        SUM(
          CASE
            WHEN TIME(v.visite_dt) < '06:00:00'
              OR TIME(v.visite_dt) > '14:00:00'
            THEN 1 ELSE 0
          END
        ) AS spmTidakStandar,

        -- ======================
        -- INM 08:00 - 14:00
        -- ======================
        SUM(
          CASE
            WHEN TIME(v.visite_dt)
              BETWEEN '08:00:00' AND '14:00:00'
            THEN 1 ELSE 0
          END
        ) AS inmStandar,

        SUM(
          CASE
            WHEN TIME(v.visite_dt) < '08:00:00'
              OR TIME(v.visite_dt) > '14:00:00'
            THEN 1 ELSE 0
          END
        ) AS inmTidakStandar

      FROM visite v

      JOIN unit_visit uv
        ON uv.unit_visit_id = v.unit_visit_id

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN employee e
        ON e.employee_id = v.employee_id

      JOIN medical_service ms
        ON ms.medical_service_id = v.medical_service_id

      ${filter}
    `;

    const [[summary]] = await db.promise().query(summarySql, params);

    const dokterSql = `
      SELECT DISTINCT
        e.employee_id,
        e.employee_nm
      FROM visite v
      JOIN employee e ON e.employee_id = v.employee_id
      WHERE employee_sts IN ('PM')
      ORDER BY e.employee_nm ASC
    `;

    const [dokterList] = await db.promise().query(dokterSql);

    res.json({
      data: rows,
      rekapDokter,
      dokterList,
      summary,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRows: total
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message
    });
  }
};
