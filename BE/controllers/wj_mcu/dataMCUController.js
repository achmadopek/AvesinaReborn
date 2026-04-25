const db = require("../../db/connection-avesina");
const db2 = require("../../db/connection-lokal");

exports.getHasilPemeriksaan = async (req, res) => {
  const { nrm, tgl } = req.query;

  if (!nrm || !tgl) {
    return res.status(400).json({
      success: false,
      message: "NRM dan Tanggal Periksa wajib diisi",
    });
  }

  try {
    const header = await getHeader(nrm, tgl);
    if (!header) {
      return res.json({ success: true, data: null });
    }

    // ambil status dari mirror
    const mirror = await getMCUMirror(nrm, tgl);

    header.status_mcu = mirror?.status_mcu ?? null;
    header.mcu_id = mirror?.mcu_id ?? null;
    header.printed_at = mirror?.printed_at ?? null;
    header.finalized_at = mirror?.finalized_at ?? null;
    header.kesimpulan = mirror?.kesimpulan ?? null;
    header.rekomendasi = mirror?.rekomendasi ?? null

    const visits = await getUnitVisits(header.registry_id);

    for (const v of visits) {
      v.anamnesa = await getAnamnesis(v.unit_visit_id);
      v.diagnosa = await getDiagnosa(v.unit_visit_id);

      // === ambil kesimpulan & saran dari MCU_VISIT
      const visitNote = await getMCUVisitNote(v.unit_visit_id);
      v.kesimpulan = visitNote.kesimpulan;
      v.saran = visitNote.saran;

      // ================= MCU
      if (v.unit_code === "MCU") {
        v.hasil = await getPoliResult(v.unit_visit_id);
      }

      // ================= LAB
      else if (v.unit_code === "LB001") {
        v.hasil = await getLabResult(v.unit_visit_id);
      }

      // ================= RADIOLOGI
      else if (v.unit_code === "RA001") {
        v.hasil = await getRadiologiResult(v.unit_visit_id);
      }

      // ================= UNIT LAIN
      else {
        v.hasil = null;
      }
    }

    res.json({
      success: true,
      data: { header, visits },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getMCUMirror = (nrm, tgl) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        m.mcu_id,
        p.nik,
        m.status_mcu,
        m.printed_at,
        m.finalized_at,
        m.created_at,
        m.kesimpulan,
        m.rekomendasi
      FROM mcu_mirror m
      JOIN mcu_patients p ON p.id = m.patient_id
      WHERE p.nrm = ?
      AND m.tgl_periksa BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      LIMIT 1
    `;
    db2.query(sql, [nrm, tgl, tgl], (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0] || null);
    });
  });
};

const getHeader = (nrm, tgl) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        r.registry_id,
        p.mr_code AS nrm,
        p.id_number AS nik,
        p.patient_nm AS nama,
        p.age AS umur,
        p.address AS alamat,
        DATE_FORMAT(r.registry_dt, '%Y-%m-%d %H:%i:%s') AS tgl_periksa
      FROM registry r
      JOIN patient p ON p.mr_id = r.mr_id
      WHERE p.mr_code = ?
      AND r.registry_dt >= ?
      AND r.registry_dt < DATE_ADD(?, INTERVAL 1 DAY)
      LIMIT 1
    `;

    db.query(sql, [nrm, tgl, tgl], (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0]);
    });
  });
};

const getUnitVisits = (registryId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        uv.unit_visit_id,
        uv.unit_id_to AS unit_code,
        su.srvc_unit_nm AS unit_name
      FROM unit_visit uv
      JOIN service_unit su ON su.srvc_unit_id = uv.unit_id_to
      WHERE uv.registry_id = ?
      #AND uv.unit_id_to IN ('MCU','RJ008','RJ009','RJ010','131210919634RSJK','LB001','RA001')
    `;

    db.query(sql, [registryId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getMCUVisitNote = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        kesimpulan,
        saran
      FROM mcu_visit
      WHERE unit_visit_id = ?
      LIMIT 1
    `;
    db2.query(sql, [unitVisitId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0] || { kesimpulan: null, saran: null });
    });
  });
};

const getPoliResult = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        r.registry_id,
        r.height as tb,
        r.weight as bb,
        r.systole as tda,
        r.diastole as tdb,
        r.pulse as nadi,
        r.temperature as suhu
      FROM registry r
      JOIN patient p ON p.mr_id = r.mr_id
      JOIN unit_visit uv ON uv.registry_id = r.registry_id
      WHERE uv.unit_visit_id = ?
      LIMIT 1
    `;

    db.query(sql, [unitVisitId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0]);
    });
  });
};

const getAnamnesis = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        a.anamnesa AS master,
        ad.a_desc AS detail
      FROM visite v
      JOIN anamnesis a ON a.visite_id = v.visite_id
      LEFT JOIN anamnesis_dtl ad ON ad.a_master_id = a.anamnesis_id
      WHERE v.unit_visit_id = ?
    `;

    db.query(sql, [unitVisitId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getDiagnosa = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        d.description AS master,
        dd.description AS detail
      FROM visite v
      JOIN diagnosa d ON d.visite_id = v.visite_id
      LEFT JOIN diagnosa_dtl dd ON dd.diagnosa_id = d.diagnosa_id
      WHERE v.unit_visit_id = ?
    `;

    db.query(sql, [unitVisitId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getLabResult = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ms.medical_service_id,
        ms.medical_service_name,
        ms.group_report,
        ms.desc_ms,

        ls.lab_srvc_id,
        ls.lab_srvc_nm,
        ls.output_unit,
        ls.normal_value,
        ls.sequence_no,
        ls.methode,

        lr.lab_result,
        lr.analisis

      FROM lab_diagnostic ld
      JOIN lab_result lr 
        ON lr.laboratory_id = ld.laboratory_id
      JOIN laboratory_service ls 
        ON ls.lab_srvc_id = lr.lab_srvc_id
      JOIN medical_service ms
        ON ms.medical_service_id = ls.medical_service_id
      WHERE ld.unit_visit_id = ?
      ORDER BY
        ms.medical_service_id,
        ls.sequence_no
    `;

    db.query(sql, [unitVisitId], (err, rows) => {
      if (err) return reject(err);

      const grouped = {};

      for (const r of rows) {
        if (!grouped[r.medical_service_id]) {
          grouped[r.medical_service_id] = {
            medical_service_id: r.medical_service_id,
            medical_service_name: r.medical_service_name,
            group_report: r.group_report, // contoh: CBC 5 DIFF
            desc_ms: r.desc_ms,
            items: []
          };
        }

        grouped[r.medical_service_id].items.push({
          lab_srvc_id: r.lab_srvc_id,
          lab_srvc_nm: r.lab_srvc_nm,
          result: r.lab_result,
          unit: r.output_unit,
          normal: r.normal_value,
          methode: r.methode,
          analisis: r.analisis
        });
      }

      resolve(Object.values(grouped));
    });
  });
};

const getRadiologiResult = (unitVisitId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ms.medical_service_name,
        xrd.photo_reading,
        xrd.description
      FROM x_ray_hdr xrh
      JOIN x_ray_dtl xrd ON xrd.x_ray_id = xrh.x_ray_id
      JOIN medical_service ms 
        ON ms.medical_service_id = xrd.medical_service_id
      WHERE xrh.unit_visit_id = ?
    `;
    db.query(sql, [unitVisitId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

