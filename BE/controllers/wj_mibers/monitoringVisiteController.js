require("dotenv").config();
const ExcelJS = require("exceljs");
const db = require("../../db/connection-avesina");

exports.getData = async (req, res) => {
  try {
    // =========================================
    // QUERY PARAM
    // =========================================
    let {
      page = 1,
      limit = 10,
      dokter = null,
      statusFilter = "",
      startDate = "",
      endDate = "",
      search = "",
      sortBy = "visite_dt",
      sortOrder = "DESC"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    // =========================================
    // SORT CONFIG
    // =========================================
    const allowedSort = {
      visite_dt: "visite_dt",
      employee_nm: "employee_nm",
      medical_service_name: "medical_service_name",
      srvc_unit_nm: "srvc_unit_nm",
      patient_nm: "patient_nm",
      mr_code: "mr_code"
    };

    const safeSortBy = allowedSort[sortBy]
      ? sortBy
      : "visite_dt";

    const orderDirection =
      sortOrder === "ASC"
        ? "ASC"
        : "DESC";

    // =========================================
    // MEDICAL SERVICE FILTER
    // =========================================
    const ALLOWED_MEDICAL_SERVICE_IDS = [
      "VISRI0010",
      "VISRI0001",
      "AC0053",
      "AC0047",
      "240316706052RSJK"
    ];

    // =========================================
    // HELPER FILTER
    // =========================================
    const buildFilter = (
      dateField,
      medicalServiceField
    ) => {

      let filter = `
        WHERE ${dateField} >= '2020-01-01'
      `;

      const params = [];

      // ---------------------------------------
      // MEDICAL SERVICE FILTER
      // ---------------------------------------
      filter += `
        AND ${medicalServiceField} IN (?)
      `;

      params.push(ALLOWED_MEDICAL_SERVICE_IDS);

      // ---------------------------------------
      // FILTER DOKTER
      // ---------------------------------------
     if (dokter) {
        filter += ` AND e.employee_id = ? `;
        params.push(dokter);
      }

      // ---------------------------------------
      // FILTER TANGGAL
      // ---------------------------------------
      if (startDate && endDate) {
        filter += `
          AND ${dateField} BETWEEN ? AND ?
        `;

        params.push(
          `${startDate} 00:00:00`,
          `${endDate} 23:59:59`
        );
      }

      // ---------------------------------------
      // SEARCH
      // ---------------------------------------
      if (search) {
        filter += `
          AND (
            e.employee_nm LIKE ?
            OR ms.medical_service_name LIKE ?
            OR su.srvc_unit_nm LIKE ?
            OR p.patient_nm LIKE ?
            OR p.mr_code LIKE ?
          )
        `;

        params.push(
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`
        );
      }

      return {
        filter,
        params
      };
    };

    // =========================================
    // VISITE FILTER
    // =========================================
    const visiteFilter = buildFilter(
      "v.visite_dt",
      "v.medical_service_id"
    );

    // =========================================
    // TREATMENT FILTER
    // =========================================
    const treatmentFilter = buildFilter(
      "t.treatment_dt",
      "t.medical_service_id"
    );

    // =========================================
    // QUERY VISITE
    // =========================================
    const visiteSql = `
      SELECT
        'VISITE' AS sumber,
        v.visite_id AS row_id,
        v.visite_dt AS visite_dt,
        e.employee_id,
        e.employee_nm,
        ms.medical_service_name,
        su.srvc_unit_nm,
        p.mr_code,
        p.patient_nm
      FROM visite v
      JOIN unit_visit uv
        ON uv.unit_visit_id = v.unit_visit_id
      JOIN registry r
        ON r.registry_id = uv.registry_id
      JOIN patient p
        ON p.mr_id = r.mr_id
      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to
      JOIN employee e
        ON e.employee_id = v.employee_id
      JOIN medical_service ms
        ON ms.medical_service_id = v.medical_service_id

      ${visiteFilter.filter}
    `;

    // =========================================
    // QUERY TREATMENT
    // =========================================
    const treatmentSql = `
      SELECT
        'TREATMENT' AS sumber,
        t.treatment_id AS row_id,
        t.treatment_dt AS visite_dt,
        e.employee_id,
        e.employee_nm,
        ms.medical_service_name,
        su.srvc_unit_nm,
        p.mr_code,
        p.patient_nm
      FROM treatment t
      JOIN unit_visit uv
        ON uv.unit_visit_id = t.unit_visit_id
      JOIN registry r
        ON r.registry_id = uv.registry_id
      JOIN patient p
        ON p.mr_id = r.mr_id
      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to
      JOIN employee e
        ON e.employee_id = t.employee_id
      JOIN medical_service ms
        ON ms.medical_service_id = t.medical_service_id

      ${treatmentFilter.filter}
    `;

    // =============================
    // DOKTER MASTER LIST
    // =============================
    const dokterListSql = `
      SELECT employee_id, employee_nm
      FROM employee
      WHERE employee_sts IN ('P','O')
        AND (
          LOWER(employee_nm) LIKE 'dr.%'
          OR LOWER(employee_nm) LIKE 'dr %'
        )
      ORDER BY employee_nm ASC
    `;

    // ================================
    // TOTAL PASIEN DI RENTANG ITU
    // ================================
    const buildTotalPasienQuery = () => {
      let sql = `
        SELECT COUNT(DISTINCT r.registry_id) AS total_pasien
        FROM registry r
        LEFT JOIN unit_visit uv ON uv.registry_id = r.registry_id
        LEFT JOIN visite v ON v.unit_visit_id = uv.unit_visit_id
        WHERE r.registry_dt BETWEEN ? AND ?
      `;

      const params = [
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`
      ];

      if (dokter && dokter !== "ALL" && dokter !== "") {
        sql += ` AND v.employee_id = ?`;
        params.push(dokter);
      }

      return { sql, params };
    };

    // =========================================
    // EXECUTE QUERY
    // =========================================
    const [visiteRows] =
      await db.promise().query(
        visiteSql,
        visiteFilter.params
      );

    const [treatmentRows] =
      await db.promise().query(
        treatmentSql,
        treatmentFilter.params
      );
    
    const [dokterList] =
      await db.promise().query(
        dokterListSql
      );
    
    const [totalPasien] =
      await db.promise().query(
        buildTotalPasienQuery().sql,
        buildTotalPasienQuery().params
      );

    // =========================================
    // MERGE DATA
    // =========================================
    let rows = [
      ...visiteRows,
      ...treatmentRows
    ];

    // =========================================
    // STATUS FILTER
    // =========================================
    if (statusFilter) {
      rows = rows.filter((item) => {
        const jam =
          new Date(item.visite_dt)
            .toTimeString()
            .slice(0, 8);

        // -------------------
        // SPM
        // -------------------
        if (statusFilter === "spm_ok") {
          return (
            jam >= "06:00:00" &&
            jam <= "14:00:00"
          );
        }

        if (statusFilter === "spm_no") {
          return (
            jam < "06:00:00" ||
            jam > "14:00:00"
          );
        }

        // -------------------
        // INM
        // -------------------
        if (statusFilter === "inm_ok") {
          return (
            jam >= "08:00:00" &&
            jam <= "14:00:00"
          );
        }

        if (statusFilter === "inm_no") {
          return (
            jam < "08:00:00" ||
            jam > "14:00:00"
          );
        }

        return true;
      });
    }

    // =========================================
    // SORT
    // =========================================
    rows.sort((a, b) => {
      const field = allowedSort[safeSortBy];

      let valA = a[field];
      let valB = b[field];

      // SORT DATETIME
      if (field === "visite_dt") {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      // ASC
      if (orderDirection === "ASC") {
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      }

      // DESC
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });

    // =========================================
    // CHART HARIAN
    // =========================================
    const chartMap = {};

    rows.forEach((item) => {
      const tanggal = item.visite_dt
        ?.toISOString()
        ?.split("T")[0];

      if (!chartMap[tanggal]) {
        chartMap[tanggal] = {
          tanggal,
          spmStandar: 0,
          spmTidak: 0,
          inmStandar: 0,
          inmTidak: 0
        };
      }

      const dt = new Date(item.visite_dt);

      const menit =
        dt.getHours() * 60 +
        dt.getMinutes();

      // ==============================
      // SPM
      // 06:00 - 14:00
      // ==============================
      if (menit >= 360 && menit <= 840) {
        chartMap[tanggal].spmStandar += 1;
      } else {
        chartMap[tanggal].spmTidak += 1;
      }

      // ==============================
      // INM
      // 08:00 - 14:00
      // ==============================
      if (menit >= 480 && menit <= 840) {
        chartMap[tanggal].inmStandar += 1;
      } else {
        chartMap[tanggal].inmTidak += 1;
      }
    });

    const chartHarian = Object.values(chartMap)
      .sort(
        (a, b) =>
          new Date(a.tanggal) -
          new Date(b.tanggal)
      );

    // =========================================
    // SUMMARY
    // =========================================
    const summary = {
      totalVisite: rows.length,
      totalPasien: totalPasien[0].total_pasien,

      spmStandar: rows.filter((x) => {
        const jam = new Date(x.visite_dt)
          .toTimeString()
          .slice(0, 8);

        return (
          jam >= "06:00:00" &&
          jam <= "14:00:00"
        );
      }).length,

      spmTidakStandar: rows.filter((x) => {
        const jam = new Date(x.visite_dt)
          .toTimeString()
          .slice(0, 8);

        return (
          jam < "06:00:00" ||
          jam > "14:00:00"
        );
      }).length,

      inmStandar: rows.filter((x) => {
        const jam = new Date(x.visite_dt)
          .toTimeString()
          .slice(0, 8);

        return (
          jam >= "08:00:00" &&
          jam <= "14:00:00"
        );
      }).length,

      inmTidakStandar: rows.filter((x) => {
        const jam = new Date(x.visite_dt)
          .toTimeString()
          .slice(0, 8);

        return (
          jam < "08:00:00" ||
          jam > "14:00:00"
        );
      }).length
    };

    // =========================================
    // REKAP DOKTER
    // =========================================
    const dokterMap = {};

    rows.forEach((item) => {
      if (!dokterMap[item.employee_id]) {
        dokterMap[item.employee_id] = {
          employee_id: item.employee_id,
          employee_nm: item.employee_nm,
          total_visite: 0
        };
      }

      dokterMap[item.employee_id]
        .total_visite += 1;
    });

    const rekapDokter =
      Object.values(dokterMap)
        .sort(
          (a, b) =>
            b.total_visite -
            a.total_visite
        );

    // =========================================
    // PAGINATION
    // =========================================
    const total = rows.length;

    const paginatedRows =
      rows.slice(
        offset,
        offset + limit
      );

    // =========================================
    // RESPONSE
    // =========================================
    res.json({
      data: paginatedRows,
      rekapDokter,
      dokterList,
      summary,
      chartHarian,
      currentPage: page,
      totalPages: Math.ceil(
        total / limit
      ),
      totalRows: total
    });

    console.log(totalPasien);

  } catch (err) {
    console.log("ERROR GET DATA:");
    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};