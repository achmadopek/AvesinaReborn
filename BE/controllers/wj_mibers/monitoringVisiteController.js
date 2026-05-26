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
        r.registry_id,
        r.employee_respon,
        p.mr_id,
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
        r.registry_id,
        r.employee_respon,
        p.mr_id,
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
    const buildActivePatientQuery = () => {

    let sql = `
      SELECT
        r.registry_id,
        r.registry_dt,
        r.out_dt,
        r.employee_respon,
        p.mr_id,
        p.mr_code,
        p.patient_nm,
        su.srvc_unit_nm
      FROM registry r
      JOIN patient p
        ON p.mr_id = r.mr_id
      LEFT JOIN unit_visit uv
        ON uv.registry_id = r.registry_id
      JOIN service_unit su
        ON uv.unit_id_to = su.srvc_unit_id
      JOIN unit_group ug
        ON su.unit_group_id = ug.unit_group_id
      JOIN room_mutation rm
        ON uv.unit_visit_id = rm.unit_visit_id
      WHERE r.in_out_sts = 'I'
        AND ug.unit_group_id = '7'
        AND r.registry_dt <= ?
        AND (
          r.out_dt IS NULL
          OR r.out_dt >= ?
        )
        AND rm.until_dt IS NULL
    `;

    const params = [
      `${endDate} 23:59:59`,
      `${startDate} 00:00:00`
    ];

    // FILTER DPJP
    if (
      dokter &&
      dokter !== "ALL"
    ) {
      sql += `
        AND r.employee_respon = ?
      `;

      params.push(dokter);
    }

    sql += `
      GROUP BY r.registry_id
      ORDER BY r.registry_dt ASC
    `;

    return {
      sql,
      params
    };
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
    
    const [activePatients] =
      await db.promise().query(
        buildActivePatientQuery().sql,
        buildActivePatientQuery().params
      );

    // =========================================
    // MERGE DATA
    // =========================================
    let rows = [
      ...visiteRows,
      ...treatmentRows
    ];

    // =========================================
    // TOTAL PASIEN
    // =========================================
    const visitedRegistrySet = new Set();

    rows.forEach((item) => {

      // FILTER DOKTER
      if (
        dokter &&
        dokter !== "ALL"
      ) {

        // hanya visite dokter itu
        if (item.employee_id !== dokter) {
          return;
        }
      }

      visitedRegistrySet.add(
        item.registry_id
      );
    });

    // =========================================
    // PASIEN YANG BELUM DIVISITE
    // =========================================
    const belumDivisite =
    activePatients.filter((patient) => {

      return !visitedRegistrySet.has(
        patient.registry_id
      );
    });

    // =========================================
    // PASIEN YANG SUDAH DIVISITE
    // =========================================
    const sudahDivisite =
    activePatients.filter((patient) => {

      return visitedRegistrySet.has(
        patient.registry_id
      );
    });

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
            jam >= "05:00:00" &&
            jam <= "14:00:00"
          );
        }

        if (statusFilter === "spm_no") {
          return (
            jam < "05:00:00" ||
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
    // RUBBER VISITE
    // =========================================
    const rubberVisite = rows.filter((x) => {
      return (
          x.employee_id !==
          x.employee_respon
      );
    }).length;

    // =========================================
    // DPJP VISITE
    // =========================================
    const dpjpVisite = rows.filter((x) => {
      return (
          x.employee_id ===
          x.employee_respon
      );
    }).length;

    // =========================================
    // SUMMARY
    // =========================================
    const summary = {
      totalVisite: rows.length,

      totalPasienAktif:
          activePatients.length,

      sudahDivisite:
          sudahDivisite.length,

      belumDivisite:
          belumDivisite.length,

      totalAktivitas:
          rows.length,

      rubberVisite,
      dpjpVisite,

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
    // DAFTAR PASIEN DI TOTAL PASIEN
    // =========================================
    const pasienList =
      activePatients.map((x) => ({
        registry_id: x.registry_id,
        mr_id: x.mr_id,
        mr_code: x.mr_code,
        patient_nm: x.patient_nm,
        employee_respon:
          x.employee_respon
      }));

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
      pasienList,
      summary,
      chartHarian,
      currentPage: page,
      totalPages: Math.ceil(
        total / limit
      ),
      totalRows: total
    });

    /*console.log("TOTAL ROWS:");
    console.log(total);
    console.log("SUMMARY:");
    console.log(summary);*/

  } catch (err) {
    console.log("ERROR GET DATA:");
    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};