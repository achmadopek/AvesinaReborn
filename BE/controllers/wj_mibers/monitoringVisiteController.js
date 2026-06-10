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
  "240316706052RSJK",
];

// =========================================
// HELPER FUNCTIONS
// =========================================
const buildActivityFilter = ({
  dokter,
  startDate,
  endDate,
  search = "",
  aliasDate,
  aliasMedicalService,
}) => {
  let filter = `WHERE ${aliasMedicalService} IN (?)`;
  const params = [ALLOWED_MEDICAL_SERVICE_IDS];

  if (dokter) {
    filter += ` AND e.employee_id = ?`;
    params.push(dokter);
  }

  if (startDate && endDate) {
    filter += ` AND ${aliasDate} BETWEEN ? AND ?`;
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  if (search) {
    filter += `
      AND (
        e.employee_nm LIKE ?
        OR p.patient_nm LIKE ?
        OR p.mr_code LIKE ?
        OR su.srvc_unit_nm LIKE ?
      )`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  return { filter, params };
};

const buildActivityQueries = (visiteFilter, treatmentFilter) => {
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
    JOIN unit_visit uv ON uv.unit_visit_id = v.unit_visit_id
    JOIN registry r ON r.registry_id = uv.registry_id
    JOIN patient p ON p.mr_id = r.mr_id
    JOIN employee e ON e.employee_id = v.employee_id
    LEFT JOIN employee edpjp ON edpjp.employee_id = r.employee_respon
    JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
    JOIN medical_service ms ON ms.medical_service_id = v.medical_service_id
    ${visiteFilter.filter}
    AND e.employee_id <> '197601052003122007' -- Exclude dr. Yessy`;

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
    JOIN unit_visit uv ON uv.unit_visit_id = t.unit_visit_id
    JOIN registry r ON r.registry_id = uv.registry_id
    JOIN patient p ON p.mr_id = r.mr_id
    JOIN employee e ON e.employee_id = t.employee_id
    LEFT JOIN employee edpjp ON edpjp.employee_id = r.employee_respon
    JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
    JOIN medical_service ms ON ms.medical_service_id = t.medical_service_id
    ${treatmentFilter.filter}
    AND e.employee_id <> '197601052003122007' -- Exclude dr. Yessy`;

  return { visiteSql, treatmentSql };
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const isDPJPActivity = (row) =>
  normalize(row.employee_id) === normalize(row.employee_respon);

const isSPMCompliant = (visiteDt) => {
  const dt = new Date(visiteDt);
  const minutes = dt.getHours() * 60 + dt.getMinutes();
  return minutes >= 300 && minutes <= 840; // 05:00 - 14:00
};

// =========================================
// SUMMARY HELPERS
// =========================================
const getComplianceSummary = (activities) => {
  const result = {
    spmStandar: 0,
    spmTidakStandar: 0,
    inmStandar: 0,
    inmTidakStandar: 0,
    chartHarian: {},
  };

  activities.forEach((item) => {
    const dt = new Date(item.visite_dt);
    const tanggal = dt.toISOString().split("T")[0];
    const minutes = dt.getHours() * 60 + dt.getMinutes();

    const isSPM = minutes >= 300 && minutes <= 840;
    const isINM = minutes >= 480 && minutes <= 840;

    // Init chart harian
    if (!result.chartHarian[tanggal]) {
      result.chartHarian[tanggal] = {
        tanggal,
        total: 0,
        dpjp: 0,
        rubber: 0,
        spmStandar: 0,
        spmTidakStandar: 0,
        inmStandar: 0,
        inmTidakStandar: 0,
      };
    }

    // Global summary
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

    // Harian
    result.chartHarian[tanggal].total++;
    if (isDPJPActivity(item)) {
      result.chartHarian[tanggal].dpjp++;
    } else {
      result.chartHarian[tanggal].rubber++;
    }
  });

  return {
    ...result,
    chartHarian: Object.values(result.chartHarian).sort(
      (a, b) => new Date(a.tanggal) - new Date(b.tanggal),
    ),
  };
};

const getRawatInapSummary = (activities) => {
  const pasienMap = new Map();

  activities.forEach((item) => {
    if (!pasienMap.has(item.registry_id)) {
      pasienMap.set(item.registry_id, Boolean(item.employee_respon));
    }
  });

  let pasienDPJP = 0;
  let pasienBelumDPJP = 0;

  pasienMap.forEach((hasDPJP) => {
    if (hasDPJP) pasienDPJP++;
    else pasienBelumDPJP++;
  });

  return {
    pasienDPJP,
    pasienBelumDPJP,
    totalPasienRawatInap: pasienMap.size,
  };
};

// Tambahan: Fungsi untuk mendapatkan summary pasien rawat inap saat ini (bukan berdasarkan aktivitas)
const getAllCurrentInpatientSummary = async (startDate, endDate) => {
  const sDate = startDate || new Date().toISOString().split("T")[0];
  const eDate = endDate || sDate;

  const sql = `
    SELECT
        COUNT(DISTINCT r.registry_id) AS totalPasienRawatInap,
        SUM(CASE WHEN r.employee_respon IS NOT NULL THEN 1 ELSE 0 END) AS pasienDPJP,
        SUM(CASE WHEN r.employee_respon IS NULL THEN 1 ELSE 0 END) AS pasienBelumDPJP
    FROM registry r
    JOIN unit_visit uv ON uv.registry_id = r.registry_id
    JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
    JOIN unit_group ug ON ug.unit_group_id = su.unit_group_id
    WHERE r.out_dt IS NULL
      AND r.registry_dt <= ?                     -- Sudah masuk
      AND ug.unit_group_id = '7'                  -- Rawat Inap
      AND (r.registry_sts IS NULL OR r.registry_sts != 'C')
      AND (r.in_out_sts = 'I')
    `;

  const params = [`${eDate} 23:59:59`];

  try {
    const [rows] = await db.promise().query(sql, params);
    const result = rows[0] || {};

    return {
      totalPasienRawatInap: Number(result.totalPasienRawatInap) || 0,
      pasienDPJP: Number(result.pasienDPJP) || 0,
      pasienBelumDPJP: Number(result.pasienBelumDPJP) || 0,
    };
  } catch (err) {
    console.error("Error getAllCurrentInpatientSummary:", err);
    return { totalPasienRawatInap: 0, pasienDPJP: 0, pasienBelumDPJP: 0 };
  }
};

// =========================================
// CONTROLLERS
// =========================================
exports.getSummary = async (req, res) => {
  try {
    const { dokter = "", startDate = "", endDate = "" } = req.query;

    const visiteFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      aliasDate: "v.visite_dt",
      aliasMedicalService: "v.medical_service_id",
    });

    const treatmentFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      aliasDate: "t.treatment_dt",
      aliasMedicalService: "t.medical_service_id",
    });

    const { visiteSql, treatmentSql } = buildActivityQueries(
      visiteFilter,
      treatmentFilter,
    );

    const [visiteRows, treatmentRows] = await Promise.all([
      db.promise().query(visiteSql, visiteFilter.params),
      db.promise().query(treatmentSql, treatmentFilter.params),
    ]);

    const activities = [...visiteRows[0], ...treatmentRows[0]];

    const compliance = getComplianceSummary(activities);
    //const rawatInapSummary = getRawatInapSummary(activities);
    const rawatInapSummary = await getAllCurrentInpatientSummary(
      startDate,
      endDate,
    );

    const dpjpActivities = activities.filter(isDPJPActivity);
    const rubberActivities = activities.filter((x) => !isDPJPActivity(x));

    const pieAktivitas = [
      { name: "DPJP", value: dpjpActivities.length },
      { name: "Rubber", value: rubberActivities.length },
    ];

    return res.json({
      success: true,
      summary: {
        dpjpVisite: dpjpActivities.length,
        rubberVisite: rubberActivities.length,
        totalAktivitas: activities.length,

        spmStandar: compliance.spmStandar,
        spmTidakStandar: compliance.spmTidakStandar,

        inmStandar: compliance.inmStandar,
        inmTidakStandar: compliance.inmTidakStandar,

        pasienDPJP: rawatInapSummary.pasienDPJP,
        pasienBelumDPJP: rawatInapSummary.pasienBelumDPJP,
        totalPasienRawatInap: rawatInapSummary.totalPasienRawatInap,
      },
      pieAktivitas,
      chartHarian: compliance.chartHarian,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

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
      sortOrder = "DESC",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const visiteFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      search,
      aliasDate: "v.visite_dt",
      aliasMedicalService: "v.medical_service_id",
    });

    const treatmentFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      search,
      aliasDate: "t.treatment_dt",
      aliasMedicalService: "t.medical_service_id",
    });

    const { visiteSql, treatmentSql } = buildActivityQueries(
      visiteFilter,
      treatmentFilter,
    );

    const [visiteRows] = await db
      .promise()
      .query(visiteSql, visiteFilter.params);
    const [treatmentRows] = await db
      .promise()
      .query(treatmentSql, treatmentFilter.params);

    let rows = [...visiteRows, ...treatmentRows];

    rows = rows.map((row) => ({
      ...row,
      dpjp_nm: row.dpjp_nm || "(belum ada DPJP)",
      isDPJP: isDPJPActivity(row),
      jenis: isDPJPActivity(row) ? "DPJP" : "RUBBER",
    }));

    // Sort
    rows.sort((a, b) => {
      const timeA = new Date(a.visite_dt).getTime();
      const timeB = new Date(b.visite_dt).getTime();
      return sortOrder === "ASC" ? timeA - timeB : timeB - timeA;
    });

    const totalRows = rows.length;
    rows = rows.slice(offset, offset + limit);

    res.json({
      success: true,
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(totalRows / limit),
      totalRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDoctorPerformance = async (req, res) => {
  try {
    const { dokter = "", startDate = "", endDate = "" } = req.query;

    const visiteFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      aliasDate: "v.visite_dt",
      aliasMedicalService: "v.medical_service_id",
    });

    const treatmentFilter = buildActivityFilter({
      dokter,
      startDate,
      endDate,
      aliasDate: "t.treatment_dt",
      aliasMedicalService: "t.medical_service_id",
    });

    const { visiteSql, treatmentSql } = buildActivityQueries(
      visiteFilter,
      treatmentFilter,
    );

    const [visiteRows] = await db
      .promise()
      .query(visiteSql, visiteFilter.params);
    const [treatmentRows] = await db
      .promise()
      .query(treatmentSql, treatmentFilter.params);

    const activities = [...visiteRows, ...treatmentRows];

    const doctorMap = {};

    activities.forEach((item) => {
      const id = item.employee_id;
      if (!doctorMap[id]) {
        doctorMap[id] = {
          employee_id: item.employee_id,
          employee_nm: item.employee_nm,
          visiteStandar: 0,
          visiteTidakStandar: 0,
        };
      }

      if (isSPMCompliant(item.visite_dt)) {
        doctorMap[id].visiteStandar++;
      } else {
        doctorMap[id].visiteTidakStandar++;
      }
    });

    const result = Object.values(doctorMap)
      .map((x) => {
        const total = x.visiteStandar + x.visiteTidakStandar;
        return {
          ...x,
          total,
          persentase:
            total === 0
              ? 0
              : Number((x.visiteStandar / total) * 100).toFixed(2),
        };
      })
      .sort((a, b) => b.persentase - a.persentase);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
