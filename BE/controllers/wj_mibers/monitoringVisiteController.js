require("dotenv").config();
const ExcelJS = require("exceljs");
const db = require("../../db/connection-avesina");

// =========================================
// CONSTANT
// =========================================
const ALLOWED_MEDICAL_SERVICE_IDS = [
  "VISRI0010",
  "VISRI0001",
  "AC0053",
  "AC0047",
  "240316706052RSJK"
];

// =========================================
// HELPER
// =========================================
const buildActivityFilter = ({
  dokter,
  startDate,
  endDate,
  search,
  aliasDate,
  aliasMedicalService
}) => {

  let filter = `
    WHERE ${aliasMedicalService} IN (?)
  `;

  const params = [
    ALLOWED_MEDICAL_SERVICE_IDS
  ];

  // ======================================
  // FILTER DOKTER PELAKU VISITE
  // ======================================
  if (dokter) {
    filter += `
      AND e.employee_id = ?
    `;

    params.push(dokter);
  }

  // ======================================
  // FILTER TANGGAL
  // ======================================
  if (startDate && endDate) {
    filter += `
      AND ${aliasDate} BETWEEN ? AND ?
    `;

    params.push(
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`
    );
  }

  // ======================================
  // SEARCH
  // ======================================
  if (search) {
    filter += `
      AND (
        e.employee_nm LIKE ?
        OR p.patient_nm LIKE ?
        OR p.mr_code LIKE ?
        OR su.srvc_unit_nm LIKE ?
      )
    `;

    params.push(
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

const normalize = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const isDPJPActivity = (row) =>
  normalize(row.employee_id) ===
  normalize(row.employee_respon);

const getComplianceSummary = (activities) => {

  const result = {
    spmStandar: 0,
    spmTidakStandar: 0,
    inmStandar: 0,
    inmTidakStandar: 0,
    chartHarian: {}
  };

  activities.forEach((item) => {

    const dt = new Date(item.visite_dt);

    const menit =
      dt.getHours() * 60 +
      dt.getMinutes();

    const tanggal =
      dt.toISOString().split("T")[0];

    const isSPM =
      menit >= 300 && menit <= 840;

    const isINM =
      menit >= 480 && menit <= 840;

    // ==========================
    // INIT DULU
    // ==========================
    if (!result.chartHarian[tanggal]) {

      result.chartHarian[tanggal] = {

        tanggal,

        total: 0,

        dpjp: 0,
        rubber: 0,

        spmStandar: 0,
        spmTidakStandar: 0,

        inmStandar: 0,
        inmTidakStandar: 0
      };
    }

    // ==========================
    // SUMMARY GLOBAL
    // ==========================
    if (isSPM) {
      result.spmStandar++;
      result.chartHarian[tanggal].spmStandar++;
    } else {
      result.spmTidakStandar++;
      result.chartHarian[tanggal].spmTidakStandar++;
    }

    if (isINM) {
      result.inmStandar++;
      result.chartHarian[tanggal].inmStandar++;
    } else {
      result.inmTidakStandar++;
      result.chartHarian[tanggal].inmTidakStandar++;
    }

    // ==========================
    // TOTAL HARIAN
    // ==========================
    result.chartHarian[tanggal].total++;

    if (isDPJPActivity(item)) {
      result.chartHarian[tanggal].dpjp++;
    } else {
      result.chartHarian[tanggal].rubber++;
    }
  });

  return {
    ...result,
    chartHarian: Object.values(
      result.chartHarian
    ).sort(
      (a, b) =>
        new Date(a.tanggal) -
        new Date(b.tanggal)
    )
  };
};

const getRawatInapSummary = (
  activities
) => {

  const pasienMap =
    new Map();

  activities.forEach((item) => {

    if (
      !pasienMap.has(
        item.registry_id
      )
    ) {

      pasienMap.set(
        item.registry_id,
        Boolean(
          item.employee_respon
        )
      );
    }
  });

  let pasienDPJP = 0;
  let pasienBelumDPJP = 0;

  pasienMap.forEach(
    (hasDPJP) => {

      if (hasDPJP) {
        pasienDPJP++;
      } else {
        pasienBelumDPJP++;
      }
    }
  );

  return {

    pasienDPJP,

    pasienBelumDPJP,

    totalPasienRawatInap:
      pasienMap.size
  };
};

// =========================================
// GET SUMMARY
// =========================================
exports.getSummary = async (req, res) => {

  try {

    const {
      dokter = "",
      startDate = "",
      endDate = ""
    } = req.query;

    const visiteFilter =
      buildActivityFilter({
        dokter,
        startDate,
        endDate,
        search: "",
        aliasDate: "v.visite_dt",
        aliasMedicalService:
          "v.medical_service_id"
      });

    const treatmentFilter =
      buildActivityFilter({
        dokter,
        startDate,
        endDate,
        search: "",
        aliasDate: "t.treatment_dt",
        aliasMedicalService:
          "t.medical_service_id"
      });

    const visiteSql = `
      SELECT
        'VISITE' AS sumber,

        r.registry_id,
        r.employee_respon,

        v.visite_id AS row_id,
        v.visite_dt,

        e.employee_id,
        e.employee_nm,

        edpjp.employee_nm AS dpjp_nm,

        p.mr_code,
        p.patient_nm,

        su.srvc_unit_nm,

        ms.medical_service_name

      FROM visite v

      JOIN unit_visit uv
        ON uv.unit_visit_id = v.unit_visit_id

      JOIN registry r
        ON r.registry_id = uv.registry_id

      JOIN patient p
        ON p.mr_id = r.mr_id

      JOIN employee e
        ON e.employee_id = v.employee_id

      LEFT JOIN employee edpjp
        ON edpjp.employee_id = r.employee_respon

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN medical_service ms
        ON ms.medical_service_id =
           v.medical_service_id

      ${visiteFilter.filter}
    `;

    const treatmentSql = `
      SELECT
        'TREATMENT' AS sumber,

        r.registry_id,
        r.employee_respon,

        t.treatment_id AS row_id,
        t.treatment_dt AS visite_dt,

        e.employee_id,
        e.employee_nm,

        edpjp.employee_nm AS dpjp_nm,

        p.mr_code,
        p.patient_nm,

        su.srvc_unit_nm,

        ms.medical_service_name

      FROM treatment t

      JOIN unit_visit uv
        ON uv.unit_visit_id = t.unit_visit_id

      JOIN registry r
        ON r.registry_id = uv.registry_id

      JOIN patient p
        ON p.mr_id = r.mr_id

      JOIN employee e
        ON e.employee_id = t.employee_id

      LEFT JOIN employee edpjp
        ON edpjp.employee_id = r.employee_respon

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN medical_service ms
        ON ms.medical_service_id =
           t.medical_service_id

      ${treatmentFilter.filter}
    `;

    const [
      visiteRows,
      treatmentRows
    ] = await Promise.all([
      db.promise().query(
        visiteSql,
        visiteFilter.params
      ),
      db.promise().query(
        treatmentSql,
        treatmentFilter.params
      )
    ]);

    const activities = [
      ...visiteRows[0],
      ...treatmentRows[0]
    ];

    const compliance =
      getComplianceSummary(
        activities
      );

    const rawatInapSummary =
      getRawatInapSummary(
        activities
      );

    const dpjpActivities =
      activities.filter(
        isDPJPActivity
      );

    const rubberActivities =
      activities.filter(
        (x) => !isDPJPActivity(x)
      );

    const pieAktivitas = [
      {
        name: "DPJP",
        value: dpjpActivities.length
      },
      {
        name: "Rubber",
        value: rubberActivities.length
      }
    ];

    return res.json({
      success: true,

      summary: {

        // =================================
        // AKTIVITAS VISITE
        // =================================
        dpjpVisite:
          dpjpActivities.length,

        rubberVisite:
          rubberActivities.length,

        totalAktivitas:
          activities.length,

        // =================================
        // SPM
        // =================================
        spmStandar:
          compliance.spmStandar,

        spmTidakStandar:
          compliance.spmTidakStandar,

        // =================================
        // INM
        // =================================
        inmStandar:
          compliance.inmStandar,

        inmTidakStandar:
          compliance.inmTidakStandar,

        // =================================
        // PASIEN RAWAT INAP
        // =================================
        pasienDPJP:
          rawatInapSummary.pasienDPJP,

        pasienBelumDPJP:
          rawatInapSummary.pasienBelumDPJP,

        totalPasienRawatInap:
          rawatInapSummary.totalPasienRawatInap
      },

      pieAktivitas,

      chartHarian:
        compliance.chartHarian
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// =========================================
// GET ACTIVITY
// =========================================
exports.getActivity = async (req, res) => {

  try {

    let {
      page = 1,
      limit = 10,
      dokter = "",
      startDate = "",
      endDate = "",
      search = "",
      sortBy = "visite_dt",
      sortOrder = "DESC"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset =
      (page - 1) * limit;

    // ======================================
    // FILTER
    // ======================================
    const visiteFilter =
      buildActivityFilter({
        dokter,
        startDate,
        endDate,
        search,
        aliasDate: "v.visite_dt",
        aliasMedicalService:
          "v.medical_service_id"
      });

    const treatmentFilter =
      buildActivityFilter({
        dokter,
        startDate,
        endDate,
        search,
        aliasDate: "t.treatment_dt",
        aliasMedicalService:
          "t.medical_service_id"
      });

    // ======================================
    // VISITE SQL
    // ======================================
    const visiteSql = `
      SELECT
        'VISITE' AS sumber,

        r.registry_id,
        r.employee_respon,

        v.visite_id AS row_id,
        v.visite_dt AS visite_dt,

        e.employee_id,
        e.employee_nm,

        p.mr_code,
        p.patient_nm,

        su.srvc_unit_nm,

        ms.medical_service_name,

        e2.employee_nm AS dpjp_nm

      FROM visite v

      JOIN unit_visit uv
        ON uv.unit_visit_id = v.unit_visit_id

      JOIN registry r
        ON r.registry_id = uv.registry_id

      JOIN patient p
        ON p.mr_id = r.mr_id

      JOIN employee e
        ON e.employee_id = v.employee_id

      LEFT JOIN employee e2
        ON e2.employee_id = r.employee_respon  

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN medical_service ms
        ON ms.medical_service_id =
           v.medical_service_id

      ${visiteFilter.filter}
    `;

    // ======================================
    // TREATMENT SQL
    // ======================================
    const treatmentSql = `
      SELECT
        'TREATMENT' AS sumber,

        r.registry_id,
        r.employee_respon,

        t.treatment_id AS row_id,
        t.treatment_dt AS visite_dt,

        e.employee_id,
        e.employee_nm,

        p.mr_code,
        p.patient_nm,

        su.srvc_unit_nm,

        ms.medical_service_name,

        e2.employee_nm AS dpjp_nm

      FROM treatment t

      JOIN unit_visit uv
        ON uv.unit_visit_id = t.unit_visit_id

      JOIN registry r
        ON r.registry_id = uv.registry_id

      JOIN patient p
        ON p.mr_id = r.mr_id

      JOIN employee e
        ON e.employee_id = t.employee_id

      JOIN employee e2
        ON e2.employee_id = r.employee_respon

      JOIN service_unit su
        ON su.srvc_unit_id = uv.unit_id_to

      JOIN medical_service ms
        ON ms.medical_service_id =
           t.medical_service_id

      ${treatmentFilter.filter}
    `;

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

    let rows = [
      ...visiteRows,
      ...treatmentRows
    ];

    rows = rows.map((row) => ({

      ...row,

      dpjp_nm:
        row.dpjp_nm || "(belum ada DPJP)",

      isDPJP:
        isDPJPActivity(row),

      jenis:
        isDPJPActivity(row)
          ? "DPJP"
          : "RUBBER"
    }));

    // ======================================
    // SORT
    // ======================================
    rows.sort((a, b) => {

      const timeA =
        new Date(a.visite_dt).getTime();

      const timeB =
        new Date(b.visite_dt).getTime();

      return sortOrder === "ASC"
        ? timeA - timeB
        : timeB - timeA;
    });

    // ======================================
    // PAGINATION
    // ======================================
    const totalRows =
      rows.length;

    rows = rows.slice(
      offset,
      offset + limit
    );

    // ======================================
    // RESPONSE
    // ======================================
    res.json({
      success: true,

      data: rows,

      currentPage: page,

      totalPages: Math.ceil(
        totalRows / limit
      ),

      totalRows
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};