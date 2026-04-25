require("dotenv").config();
const ExcelJS = require("exceljs");
const db = require("../../db/connection-lokal");   // DB1
const db2 = require("../../db/connection-avesina"); // DB2

exports.getData = async (req, res) => {
  try {
    let { page = 1, limit = 10, poli = null, startDate = "", endDate = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let filter = "WHERE 1=1";
    const params = [];

    if (poli && poli !== "ALL") {
      filter += " AND srvc_unit_id = ?";
      params.push(poli);
    }

    if (startDate) {
      filter += " AND DATE(created_at) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      filter += " AND DATE(created_at) <= ?";
      params.push(endDate);
    }

    const countSql = `SELECT COUNT(*) AS total FROM monitoring_icare ${filter}`;
    const [[{ total }]] = await db.promise().query(countSql, params);
    const totalPages = Math.ceil(total / limit);

    const countStatusSql = `
      SELECT 
        SUM(final.status = 'SUCCESS') AS totalSuccess,
        SUM(final.status = 'ERROR') AS totalError
      FROM (
        SELECT m1.registry_id, m1.status
        FROM monitoring_icare m1
        INNER JOIN (
          SELECT registry_id, MAX(created_at) AS latest
          FROM monitoring_icare
          ${filter}
          GROUP BY registry_id
        ) m2 ON m1.registry_id = m2.registry_id AND m1.created_at = m2.latest
      ) AS final
    `;
    const [[statusCount]] = await db.promise().query(countStatusSql, params);

    // GET patients HIS
    let hisPatients = [];
    let totalPatientPoli = 0;

    if (startDate && endDate) {
      let start = `${startDate} 00:00:00`;
      let end = `${endDate} 23:59:59`;

      let patientSql = `
        SELECT 
          r.registry_id,
          p.mr_code,
          p.patient_nm,
          su.srvc_unit_id,
          su.srvc_unit_nm,
          v.employee_id as dr_visite_id,
          e.employee_nm as dr_visite_nm,
          CONCAT('http://192.168.0.245/rswj-app/icare/get/', r.registry_id, '/', v.employee_id) AS link_icare
        FROM registry r
        JOIN unit_visit uv ON uv.registry_id = r.registry_id
        JOIN patient p ON p.mr_id = r.mr_id 
        JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
        JOIN visite v ON uv.unit_visit_id = v.unit_visit_id
        JOIN employee e ON e.employee_id = v.employee_id
        WHERE r.registry_dt BETWEEN ? AND ?
        AND r.price_group_id = '000000000006'
        AND su.unit_group_id in (7,8,9)
      `;
      const patientParams = [start, end];

      if (poli && poli !== "ALL") {
        patientSql += " AND uv.unit_id_to = ?";
        patientParams.push(poli);
      }

      const [rows] = await db2.promise().query(patientSql, patientParams);
      hisPatients = rows;
      totalPatientPoli = rows.length || 0;
    }

    // GET monitoring log
    let monitoringMap = new Map();
    let employeeIds = [];

    if (hisPatients.length > 0) {
      const registryIds = hisPatients.map(x => x.registry_id);
      const placeholders = registryIds.map(() => "?").join(",");

      const icSql = `
        SELECT registry_id, status, message, employee_id, created_at, ip_address
        FROM monitoring_icare
        WHERE registry_id IN (${placeholders})
      `;
      const [icareRows] = await db.promise().query(icSql, registryIds);

      monitoringMap = new Map();
      icareRows.forEach(r => {
        if (!monitoringMap.has(r.registry_id)) {
          monitoringMap.set(r.registry_id, []);
        }
        monitoringMap.get(r.registry_id).push(r);
      });

      employeeIds = [...new Set(icareRows.map(r => r.employee_id).filter(Boolean))];
    }

    // GET employee names
    let employeeMap = new Map();
    if (employeeIds.length > 0) {
      const placeholders = employeeIds.map(() => "?").join(",");
      const empSql = `
        SELECT employee_id, employee_nm
        FROM employee
        WHERE employee_id IN (${placeholders})
      `;
      const [empRows] = await db2.promise().query(empSql, employeeIds);
      employeeMap = new Map(empRows.map(e => [e.employee_id, e.employee_nm]));
    }

    // Merge data
    const mergedData = [];
    hisPatients.forEach(p => {
      const logs = monitoringMap.get(p.registry_id) || [];

      if (logs.length > 0) {
        logs.forEach(ic => {
          mergedData.push({
            registry_id: p.registry_id,
            mr_code: p.mr_code,
            patient_nm: p.patient_nm,
            srvc_unit_id: p.srvc_unit_id,
            srvc_unit_nm: p.srvc_unit_nm,
            status: ic.status || null,
            message: ic.message || null,
            employee_id: ic.employee_id || null,
            employee_nm: employeeMap.get(ic.employee_id) || null,
            dr_visite_id: p.dr_visite_id,
            dr_visite_nm: p.dr_visite_nm,
            link_icare: p.link_icare,
            created_at: ic.created_at || null,
            ip_address: ic.ip_address
          });
        });
      } else {
        mergedData.push({
          registry_id: p.registry_id,
          mr_code: p.mr_code,
          patient_nm: p.patient_nm,
          srvc_unit_id: p.srvc_unit_id,
          srvc_unit_nm: p.srvc_unit_nm,
          status: null,
          message: null,
          employee_id: null,
          employee_nm: null,
          dr_visite_id: p.dr_visite_id,
          dr_visite_nm: p.dr_visite_nm,
          link_icare: p.link_icare,
          created_at: null,
          ip_address: null
        });
      }
    });

    const paginated = mergedData.slice(offset, offset + limit);

    // ==========================
    // WEBSOCKET BROADCAST
    // ==========================
    if (global.broadcastToClients) {
      global.broadcastToClients({
        type: "icare_status",
        timestamp: new Date(),
        totalRows: mergedData.length,
        totalPatientPoli,
        totalSuccess: statusCount.totalSuccess,
        totalError: statusCount.totalError,
        currentPage: page,
        totalPages: Math.ceil(mergedData.length / limit)
      });
    }

    // RESPONSE API
    res.json({
      data: paginated,
      currentPage: page,
      totalPages: Math.ceil(mergedData.length / limit),
      totalRows: mergedData.length,
      totalSuccess: statusCount.totalSuccess,
      totalError: statusCount.totalError,
      totalPatientPoli
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getIcareDailySummary = async (req, res) => {
  try {
    const { startDate = "", endDate = "", poli = null } = req.query;

    if (!startDate || !endDate) {
      return res.json({ data: [] });
    }

    // ==================================================
    // 1️⃣ AMBIL SEMUA PASIEN HIS (1 BARIS = 1 REGISTRY)
    // ==================================================
    let hisSql = `
      SELECT
        r.registry_id,
        DATE(r.registry_dt) AS visit_date
      FROM registry r
      JOIN unit_visit uv ON uv.registry_id = r.registry_id
      JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
      WHERE r.registry_dt BETWEEN ? AND ?
        AND r.price_group_id = '000000000006'
        AND su.unit_group_id IN (7,8,9)
    `;

    const hisParams = [
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`
    ];

    if (poli && poli !== "ALL") {
      hisSql += " AND uv.unit_id_to = ?";
      hisParams.push(poli);
    }

    const [hisRows] = await db2.promise().query(hisSql, hisParams);

    if (hisRows.length === 0) {
      return res.json({ data: [] });
    }

    // ==================================================
    // 2️⃣ AMBIL STATUS TERAKHIR iCare (DB1)
    // ==================================================
    const registryIds = [...new Set(hisRows.map(r => r.registry_id))];
    const placeholders = registryIds.map(() => "?").join(",");

    const icareSql = `
      SELECT m1.registry_id, m1.status
      FROM monitoring_icare m1
      INNER JOIN (
        SELECT registry_id, MAX(created_at) AS latest
        FROM monitoring_icare
        WHERE registry_id IN (${placeholders})
        GROUP BY registry_id
      ) m2
        ON m1.registry_id = m2.registry_id
       AND m1.created_at = m2.latest
    `;

    const [icareRows] = await db.promise().query(icareSql, registryIds);

    const statusMap = new Map();
    icareRows.forEach(r => {
      statusMap.set(r.registry_id, r.status);
    });

    // ==================================================
    // 3️⃣ GROUPING PER HARI (INI KUNCI ANTI MENTOK 1)
    // ==================================================
    const dailyMap = new Map();

    hisRows.forEach(row => {
      const date = row.visit_date.toISOString().slice(0, 10); // STRING ✅
      const status = statusMap.get(row.registry_id) || null;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          success: 0,
          error: 0,
          pending: 0,
          total: 0
        });
      }

      const daily = dailyMap.get(date);
      daily.total++;

      if (status === "SUCCESS") daily.success++;
      else if (status === "ERROR") daily.error++;
      else daily.pending++;
    });

    // ==================================================
    // 4️⃣ SORT & RESPONSE
    // ==================================================
    const result = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({ data: result });

  } catch (err) {
    console.error("getIcareDailySummary error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.exportIcare = async (req, res) => {
  try {
    const { startDate = "", endDate = "", poli = "" } = req.query;

    let filter = "WHERE 1=1";
    const params = [];

    if (poli && poli !== "ALL") {
      filter += " AND srvc_unit_id = ?";
      params.push(poli);
    }
    if (startDate) {
      filter += " AND DATE(created_at) >= ?";
      params.push(startDate);
    }
    if (endDate) {
      filter += " AND DATE(created_at) <= ?";
      params.push(endDate);
    }

    const sql = `
      SELECT * FROM monitoring_icare
      ${filter}
      ORDER BY created_at DESC
    `;
    const [rows] = await db.promise().query(sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Monitoring iCare");

    sheet.addRow(["Laporan Monitoring iCare"]);
    sheet.addRow([`Periode: ${startDate} s/d ${endDate}`]);
    sheet.addRow([`Poli: ${poli}`]);
    sheet.addRow([]);

    sheet.addRow([
      "No","Registry ID","MR","Nama Pasien","Poli","Status","Message","Petugas","Waktu"
    ]);

    let no = 1;
    rows.forEach(r => {
      sheet.addRow([
        no++,
        r.registry_id,
        r.mr_code ?? "-",
        r.patient_nm ?? "-",
        r.srvc_unit_nm ?? "-",
        r.status ?? "-",
        r.message ?? "-",
        r.employee_nm ?? "-",
        r.created_at
      ]);
    });

    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition","attachment; filename=monitoring-icare.xlsx");

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
