require("dotenv").config();
const ExcelJS = require("exceljs");
const db = require("../../db/connection-avesina");   // DB1

exports.getData = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      poli = null,
      startDate = "",
      endDate = "",
      search = ""
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let filter = "WHERE uv.unit_id_from = 'T0001'";
    const params = [];

    if (poli && poli !== "ALL") {
      filter += " AND uv.unit_id_to = ?";
      params.push(poli);
    }

    if (startDate) {
      filter += " AND DATE(ta.tanggal_periksa) >= ?";
      params.push(startDate);
    }
    if (endDate) {
      filter += " AND DATE(ta.tanggal_periksa) <= ?";
      params.push(endDate);
    }

    const countSql = `SELECT COUNT(*) AS total FROM temp_antrian ta
                      JOIN unit_visit uv ON uv.registry_id = ta.registry_id
                      JOIN patient p ON p.mr_id = ta.mr_id
                      ${filter}`;
    const [[{ total }]] = await db.promise().query(countSql, params);
    const totalPages = Math.ceil(total / limit);

    const countStatusSql = `
      SELECT 
        SUM(ta.dilayani = '1') AS totalDilayani,
        SUM(ta.dibatalkan = '1') AS totalDibatalkan,
        SUM(ta.check_in = 1) AS totalCheckIn
      FROM temp_antrian ta
      JOIN unit_visit uv ON uv.registry_id = ta.registry_id
      ${filter}
    `;
    const [[statusCount]] = await db.promise().query(countStatusSql, params);

    // GET HIS patients
    let hisPatients = [];
    let totalPatientPoli = 0;

    if (startDate && endDate) {
      let patientSql = `
        SELECT 
          r.registry_id,
          r.registry_dt,
          p.mr_code,
          p.patient_nm,
          su.srvc_unit_id,
          su.srvc_unit_nm,
          r.price_group_id,
          p.debitur_id,
          pg.price_group_code
        FROM registry r
        JOIN unit_visit uv ON uv.registry_id = r.registry_id
        JOIN patient p ON p.mr_id = r.mr_id 
        JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
        join price_group pg on pg.price_group_id = r.price_group_id
        WHERE su.unit_group_id in (8,9)
      `;

      const patientParams = [];

      if (startDate && endDate) {
        patientSql += " AND r.registry_dt BETWEEN ? AND ?";
        patientParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      if (poli && poli !== "ALL") {
        patientSql += " AND uv.unit_id_to = ?";
        patientParams.push(poli);
      }

      const [rows] = await db.promise().query(patientSql, patientParams);
      hisPatients = rows;
      totalPatientPoli = rows.length || 0;
    }

    // GET monitoring data for registry_ids
    let monitoringMap = new Map();

    if (hisPatients.length > 0) {
      const registryIds = hisPatients.map(x => x.registry_id);
      const placeholders = registryIds.map(() => "?").join(",");

      const taSql = `
        SELECT 
          ta.*,
          uv.unit_id_to,
          p.patient_nm AS patient_nm_rill
        FROM temp_antrian ta
        JOIN unit_visit uv ON uv.registry_id = ta.registry_id
        LEFT JOIN patient p ON p.id_number = ta.nik
        WHERE ta.registry_id IN (${placeholders})
      `;
      const [antrianRows] = await db.promise().query(taSql, registryIds);

      monitoringMap = new Map();

      for (const row of antrianRows) {
        const existing = monitoringMap.get(row.registry_id);

        // kalau belum ada → simpan
        if (!existing) {
          monitoringMap.set(row.registry_id, row);
          continue;
        }

        // kalau existing belum punya nama asli, tapi row ini punya → replace
        if (!existing.patient_nm_rill && row.patient_nm_rill) {
          monitoringMap.set(row.registry_id, row);
          continue;
        }

        // optional: prioritaskan yang sudah check-in
        if (!existing.check_in && row.check_in) {
          monitoringMap.set(row.registry_id, row);
        }
      }

    }

    // === STAT ANTRIAN (ONLINE / ONSITE / TOTAL) ===
    let antrian_online = 0;
    let antrian_total = 0;
    let antrian_onsite = 0;

    // TOTAL pasien HIS
    let totalSql = `
      SELECT COUNT(DISTINCT r.registry_id) AS total
      FROM registry r
      JOIN unit_visit uv ON uv.registry_id = r.registry_id
      JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
      WHERE su.unit_group_id IN (8,9)
    `;

    const totalParams = [];

    if (startDate && endDate) {
      totalSql += " AND r.registry_dt BETWEEN ? AND ?";
      totalParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (poli && poli !== "ALL") {
      totalSql += " AND uv.unit_id_to = ?";
      totalParams.push(poli);
    }

    const [[totalResult]] = await db.promise().query(totalSql, totalParams);
    antrian_total = totalResult.total || 0;

    // ONLINE (ada di temp_antrian)
    let onlineSql = `
      SELECT COUNT(DISTINCT ta.registry_id) AS online
      FROM temp_antrian ta
      JOIN unit_visit uv ON uv.registry_id = ta.registry_id
    `;

    const onlineParams = [];

    if (startDate && endDate) {
      onlineSql += " WHERE ta.tanggal_periksa BETWEEN ? AND ?";
      onlineParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (poli && poli !== "ALL") {
      onlineSql += onlineParams.length ? " AND" : " WHERE";
      onlineSql += " uv.unit_id_to = ?";
      onlineParams.push(poli);
    }

    const [[onlineResult]] = await db.promise().query(onlineSql, onlineParams);
    antrian_online = onlineResult.online || 0;

    // ONSITE
    antrian_onsite = antrian_total - antrian_online;
    if (antrian_onsite < 0) antrian_onsite = 0;
    // ============================================

    // Merge final data
    const mergedData = hisPatients.map(p => {
      const antrianData = monitoringMap.get(p.registry_id) || {};

      let patient_nm_display = p.patient_nm;

      if (p.patient_nm === 'BOOKING') {
        patient_nm_display = antrianData.patient_nm_rill || null;
      }

      return {
        registry_id: p.registry_id,
        registry_dt: p.registry_dt,
        mr_code: p.mr_code,

        patient_nm: p.patient_nm,
        patient_nm_rill: antrianData.patient_nm_rill || null,
        patient_nm_display,

        srvc_unit_id: p.srvc_unit_id,
        srvc_unit_nm: p.srvc_unit_nm,
        price_group_id: p.price_group_id,
        debitur_id: p.debitur_id,
        price_group_code: p.price_group_code,

        dilayani: antrianData.dilayani || null,
        dibatalkan: antrianData.dibatalkan || null,
        check_in: antrianData.check_in || null,
        tanggal_periksa: antrianData.tanggal_periksa || null,
        kode_booking: antrianData.kode_booking || null,
        nomor_kartu: antrianData.nomor_kartu || null,
        nik: antrianData.nik || null,
        handphone: antrianData.handphone || null,
      };
    });

    let filteredData = mergedData;

    if (search && search.trim() !== "") {
      const keyword = search.toLowerCase();

      filteredData = mergedData.filter(item =>
        (item.patient_nm || "").toLowerCase().includes(keyword) ||
        (item.mr_code || "").toLowerCase().includes(keyword) ||
        (item.nik || "").toLowerCase().includes(keyword) ||
        (item.kode_booking || "").toLowerCase().includes(keyword) ||
        (item.nomor_kartu || "").toLowerCase().includes(keyword)
      );
    }

    const paginated = filteredData.slice(offset, offset + limit);

    res.json({
      data: paginated,
      currentPage: page,
      totalPages: Math.ceil(filteredData.length / limit),
      totalRows: filteredData.length,

      // STAT ANTRIAN
      antrianStats: {
        totalOnline: antrian_online,
        totalOnsite: antrian_onsite,
        totalAntrian: antrian_total
      },
      
      totalDilayani: statusCount.totalDilayani,
      totalDibatalkan: statusCount.totalDibatalkan,
      totalCheckIn: statusCount.totalCheckIn,
      totalPatientPoli
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAntrianSummary = (req, res) => {
  const { startDate, endDate, poli } = req.query;

  let sql = `
    SELECT
      COUNT(*) AS totalPatient,
      COALESCE(
        SUM(
          CASE
            WHEN taskid_7 = 1
              OR taskid_6 = 1
              OR taskid_5 = 1
              OR taskid_4 = 1
            THEN 1 ELSE 0
          END
        ), 0
      ) AS totalDilayani,
      COALESCE(SUM(CASE WHEN dibatalkan = 1 THEN 1 ELSE 0 END), 0) AS totalDibatalkan,
      COALESCE(SUM(CASE WHEN check_in = 1 THEN 1 ELSE 0 END), 0) AS checkinYes,
      COALESCE(SUM(CASE WHEN check_in = 0 THEN 1 ELSE 0 END), 0) AS checkinNo
    FROM temp_antrian
    WHERE tanggal_periksa BETWEEN ? AND ?
  `;

  const params = [
    `${startDate} 00:00:00`,
    `${endDate} 23:59:59`
  ];

  if (poli && poli !== "ALL") {
    sql += " AND srvc_unit_id = ?";
    params.push(poli);
  }

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("SUMMARY SQL ERROR:", err);
      return res.status(500).json({ message: "Gagal ambil summary" });
    }

    res.json(rows[0]);
  });
};



/*exports.exportIcare = async (req, res) => {
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
};*/
