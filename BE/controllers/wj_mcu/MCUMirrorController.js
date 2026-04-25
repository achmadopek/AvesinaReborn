const db2 = require("../../db/connection-lokal");

/**
 * =========================
 * SAVE / MIRROR MCU (DRAFT) — UPSERT
 * =========================
 */
exports.saveMCUMirror = async (req, res) => {
  const { header, visits } = req.body;

  if (!header || !Array.isArray(visits)) {
    return res.status(400).json({
      success: false,
      message: "Payload tidak valid",
    });
  }

  const conn = await db2.promise().getConnection();

  function generateNomorSuratFinal(nomor, format) {
    const tahun = new Date().getFullYear();

    if (!nomor) throw new Error("Nomor surat belum diisi");

    const safeFormat =
      format && typeof format === "string"
        ? format
        : "404/{nomor}/426.102.35/{tahun}";

    if (!safeFormat.includes("{nomor}")) {
      throw new Error("Format nomor wajib mengandung {nomor}");
    }

    return safeFormat
      .replace(/{nomor}/g, nomor)
      .replace(/{tahun}/g, tahun);
  }

  try {
    await conn.beginTransaction();

    /**
     * =====================
     * 1️⃣ UPSERT MASTER PASIEN
     * =====================
     */
    const [patientRes] = await conn.query(
      `
      INSERT INTO mcu_patients
      (nrm, nik, nama, tgl_lahir, alamat, umur, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        nik = VALUES(nik),
        nama = VALUES(nama),
        alamat = VALUES(alamat),
        umur = VALUES(umur),
        updated_at = NOW()
      `,
      [
        header.nrm,
        header.nik ?? null,
        header.nama,
        header.tgl_lahir ?? null,
        header.umur ?? null,
        header.alamat ?? null,
      ]
    );

    let patientId = patientRes.insertId;

    if (!patientId) {
      const [[row]] = await conn.query(
        `SELECT id FROM mcu_patients WHERE nrm = ?`,
        [header.nrm]
      );
      patientId = row.id;
    }

    // Cek apakah sudah finalized
    const [[existing]] = await conn.query(
      `SELECT mcu_id, finalized_at 
      FROM mcu_mirror 
      WHERE registry_id = ?`,
      [header.registry_id]
    );

    if (existing?.finalized_at) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "MCU sudah difinalisasi dan tidak dapat diubah",
      });
    }

    /**
     * =====================
     * 2️⃣ UPSERT HEADER MCU
     * =====================
     */
    const nomorSuratFinal = generateNomorSuratFinal(
      header.nomor_surat,
      header.format_nomor
    );

    const isFinalizing = header.status_mcu === 'FINAL';

    const [headerRes] = await conn.query(
      `
      INSERT INTO mcu_mirror
      (
        registry_id,
        patient_id,
        tgl_periksa,
        kesimpulan,
        rekomendasi,
        status_mcu,
        nomor_surat,
        format_nomor,
        nomor_surat_final,
        finalized_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        tgl_periksa = VALUES(tgl_periksa),
        kesimpulan = VALUES(kesimpulan),
        rekomendasi = VALUES(rekomendasi),
        status_mcu = VALUES(status_mcu),
        nomor_surat = VALUES(nomor_surat),
        format_nomor = VALUES(format_nomor),
        nomor_surat_final = VALUES(nomor_surat_final),
        finalized_at = IF(VALUES(status_mcu) = 'FINAL', NOW(), finalized_at)
      `,
      [
        header.registry_id,
        patientId,
        header.tgl_periksa,
        header.kesimpulan ?? null,
        header.rekomendasi ?? null,
        header.status_mcu ?? 'DRAFT',
        header.nomor_surat,
        header.format_nomor,
        nomorSuratFinal,
        isFinalizing ? new Date() : null
      ]
    );

    let mcuId = headerRes.insertId;

    if (!mcuId) {
      const [[row]] = await conn.query(
        `SELECT mcu_id FROM mcu_mirror WHERE registry_id = ?`,
        [header.registry_id]
      );
      mcuId = row.mcu_id;
    }

    /**
     * =====================
     * 3️⃣ RESET VISITS
     * =====================
     */
    const [visitRows] = await conn.query(
      `SELECT visit_id FROM mcu_visit WHERE mcu_id = ?`,
      [mcuId]
    );

    const visitIds = visitRows.map(v => v.visit_id);

    if (visitIds.length > 0) {
      const inClause = visitIds.map(() => "?").join(",");

      await conn.query(
        `DELETE FROM mcu_general_result WHERE visit_id IN (${inClause})`,
        visitIds
      );

      await conn.query(
        `DELETE FROM mcu_lab_result WHERE visit_id IN (${inClause})`,
        visitIds
      );

      await conn.query(
        `DELETE FROM mcu_radiologi_result WHERE visit_id IN (${inClause})`,
        visitIds
      );

      await conn.query(
        `DELETE FROM mcu_visit WHERE visit_id IN (${inClause})`,
        visitIds
      );
    }

    /**
     * =====================
     * 4️⃣ INSERT VISITS
     * =====================
     */
    for (const v of visits) {
      const [visitRes] = await conn.query(
        `
        INSERT INTO mcu_visit
        (
          mcu_id,
          unit_visit_id,
          unit_code,
          unit_name,
          anamnesa,
          diagnosa,
          kesimpulan,
          saran,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          mcuId,
          v.unit_visit_id,
          v.unit_code,
          v.unit_name,
          v.anamnesa ? JSON.stringify(v.anamnesa) : null,
          v.diagnosa ? JSON.stringify(v.diagnosa) : null,
          v.kesimpulan ?? null,
          v.saran ?? null,
        ]
      );

      const visitId = visitRes.insertId;

      if (v.unit_code === "MCU" && v.hasil) {
        await conn.query(
          `INSERT INTO mcu_general_result
          (visit_id, tb, bb, tda, tdb, nadi, suhu)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            visitId,
            v.hasil.tb ?? null,
            v.hasil.bb ?? null,
            v.hasil.tda ?? null,
            v.hasil.tdb ?? null,
            v.hasil.nadi ?? null,
            v.hasil.suhu ?? null,
          ]
        );
      }

      if (v.unit_code === "LB001" && Array.isArray(v.hasil)) {
        for (const l of v.hasil) {
          await conn.query(
            `INSERT INTO mcu_lab_result
            (visit_id, lab_srvc_nm, lab_result, output_unit, normal_value)
            VALUES (?, ?, ?, ?, ?)`,
            [
              visitId,
              l.lab_srvc_nm,
              l.lab_result,
              l.output_unit,
              l.normal_value,
            ]
          );
        }
      }

      if (v.unit_code === "RA001" && Array.isArray(v.hasil)) {
        for (const r of v.hasil) {
          await conn.query(
            `INSERT INTO mcu_radiologi_result
            (visit_id, medical_service_name, photo_reading, conclution)
            VALUES (?, ?, ?, ?)`,
            [visitId, r.medical_service_name, r.photo_reading, r.conclution]
          );
        }
      }
    }

    await conn.commit();
    res.json({ success: true, mcu_id: mcuId });

  } catch (e) {
    await conn.rollback();
    console.error("saveMCUMirror:", e);
    res.status(500).json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
};

/**
 * =========================
 * PRINT MCU
 * =========================
 */
exports.getMirrorMCUById = async (req, res) => {
  const { mcu_id } = req.params;

  try {
    const header = await getHeaderMirror(mcu_id);
    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Data MCU tidak ditemukan"
      });
    }

    const visits = await getMirrorVisits(mcu_id);

    for (const v of visits) {
      // ===== HASIL RINGKAS =====
      switch (v.unit_code) {
        case "MCU":
          v.hasil = await getRingkasMCU(v.visit_id);
          break;

        case "LB001":
          v.hasil = await getRingkasLab(v.visit_id);
          break;

        case "RA001":
          v.hasil = await getRingkasRadiologi(v.visit_id);
          break;

        default:
          v.hasil = [];
      }
    }

    res.json({
      success: true,
      data: { header, visits }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// QUERY HEADER (mcu_mirror)
const getHeaderMirror = async (mcu_id) => {
  const [rows] = await db2.promise().query(`
    SELECT
      m.mcu_id,
      m.registry_id,
      p.nrm,
      p.nik,
      p.nama,
      p.umur,
      p.alamat,
      m.nomor_surat,
      m.format_nomor,
      m.nomor_surat_final,
      m.kesimpulan,
      m.rekomendasi,
      DATE_FORMAT(m.tgl_periksa, '%Y-%m-%d %H:%i:%s') AS tgl_periksa,
      m.status_mcu,
      m.created_at,
      m.created_by,
      fb.face_image
    FROM mcu_mirror m
    JOIN mcu_patients p ON p.id = m.patient_id
    LEFT JOIN mcu_face_biometrik fb
      ON fb.patient_id = m.patient_id
    WHERE m.mcu_id = ?
  `, [mcu_id]);

  return rows[0] || null;
};

// QUERY VISIT (mcu_visit)
const getMirrorVisits = async (mcu_id) => {
  const [rows] = await db2.promise().query(`
    SELECT
      visit_id,
      unit_visit_id,
      unit_code,
      unit_name,
      anamnesa,
      diagnosa,
      kesimpulan,
      saran
    FROM mcu_visit
    WHERE mcu_id = ?
  `, [mcu_id]);

  return rows.map(r => ({
    ...r,
    anamnesa: r.anamnesa ? JSON.parse(r.anamnesa) : [],
    diagnosa: r.diagnosa ? JSON.parse(r.diagnosa) : [],
  }));
};

const getRingkasMCU = async (visit_id) => {
  const [rows] = await db2.promise().query(`
    SELECT tb, bb, tda, tdb, nadi, suhu
    FROM mcu_general_result
    WHERE visit_id = ?
    LIMIT 1
  `, [visit_id]);

  if (!rows.length) return [];

  const r = rows[0];
  return [
    `TB ${r.tb} cm, BB ${r.bb} kg, TD ${r.tda}/${r.tdb} mmHg, Nadi ${r.nadi} x/menit, Suhu ${r.suhu} °C`
  ];
};

const getRingkasLab = async (visit_id) => {
  const [rows] = await db2.promise().query(`
    SELECT DISTINCT lab_srvc_nm
    FROM mcu_lab_result
    WHERE visit_id = ?
  `, [visit_id]);

  return rows.map(r =>
    `${r.lab_srvc_nm} telah dilakukan`
  );
};

const getRingkasRadiologi = async (visit_id) => {
  const [rows] = await db2.promise().query(`
    SELECT medical_service_name, conclution
    FROM mcu_radiologi_result
    WHERE visit_id = ?
  `, [visit_id]);

  return rows.map(r =>
    `${r.medical_service_name}: ${r.conclution || "Tidak tampak kelainan signifikan"}`
  );
};

// MARK PRINTED MCU
exports.markPrintedMCU = async (req, res) => {

  const { mcu_id } = req.params;

  const [result] = await db2.promise().query(`
    UPDATE mcu_mirror
    SET status_mcu = 'CETAK',
        printed_at = NOW()
    WHERE mcu_id = ?
  `, [mcu_id]);

  console.log("AFFECTED ROWS:", result.affectedRows);

  res.json({ success: true });
};

/**
 * =========================
 * FINALIZE MCU
 * =========================
 */
exports.finalizeMCUMirror = async (req, res) => {
  const { mcu_id } = req.params;

  try {
    const [result] = await db2.promise().query(
      `
      UPDATE mcu_mirror
      SET status_mcu = 'FINAL',
          finalized_at = NOW()
      WHERE mcu_id = ?
        AND status_mcu = 'DRAFT'
      `,
      [mcu_id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "MCU tidak ditemukan atau sudah final",
      });
    }

    res.json({ success: true });

  } catch (e) {
    console.error("finalizeMCUMirror:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};
