const dbUtama = require("../../db/connection-avesina");
const dbLokal = require("../../db/connection-lokal");

const fs = require("fs");
const path = require("path");

const { parseDicomUID } = require("../../utility/dicomParser");
const { dicomToJpg } = require("../../utility/dicomToJpg");

// ==============================
// GET DATA MONITORING (List) — FINAL VERSION
// ==============================
exports.getData = async (req, res) => {
  try {
    const { peg_id, role, tgl } = req.query;

    let expert_id = null;
    if (role === "radiolog" && peg_id) {
      const [[map]] = await dbLokal.promise().query(
        `SELECT employee_id FROM sdm_pegawai WHERE id = ? LIMIT 1`,
        [peg_id]
      );
      expert_id = map?.employee_id;
    }

    const [utama] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        cth.ct_scan_id,
        ctd.ct_scan_dtl_id,
        r.registry_dt,
        cth.measured_dt,

        p.mr_code,
        p.patient_nm,

        cth.physician AS pengirim_id,
        e.employee_nm AS dr_pengirim,
        e.satusehat_ihs_number AS pengirim_ihs,

        cth.expert AS pemeriksa_id,
        e2.employee_nm AS dr_pemeriksa,
        e2.satusehat_ihs_number AS pemeriksa_ihs,

        ms.medical_service_name AS tindakan,
        ctd.ct_scan_reading

      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON uv.unit_visit_id = cth.unit_visit_id
      JOIN ct_scan_dtl ctd ON cth.ct_scan_id = ctd.ct_scan_id
      JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id

      LEFT JOIN employee e ON cth.physician = e.employee_id
      LEFT JOIN employee e2 ON cth.expert = e2.employee_id

      WHERE 1=1
        ${tgl ? "AND DATE(cth.measured_dt) = ?" : ""}
        ${expert_id ? "AND cth.expert = ?" : ""}
      ORDER BY cth.measured_dt DESC, ctd.ct_scan_dtl_id ASC
      `,
      [...(tgl ? [tgl] : []), ...(expert_id ? [expert_id] : [])]
    );

    if (utama.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const registryDtlIds = utama.map(u => [u.registry_id, u.ct_scan_dtl_id]);

    // Data Lokal
    const [lokal] = await dbLokal.promise().query(
      `SELECT * FROM radar_ctscan 
       WHERE (registry_id, ct_scan_dtl_id) IN (?) AND is_active = 1`,
      [registryDtlIds]
    );

    const mapLokal = new Map(lokal.map(l => [`${l.registry_id}-${l.ct_scan_dtl_id}`, l]));

    // Final Result
    const result = utama.map(u => {
      const key = `${u.registry_id}-${u.ct_scan_dtl_id}`;
      const l = mapLokal.get(key) || {};

      return {
        ...u,
        foto1: l.foto1 ? `/uploads/ctscan/${l.foto1}` : null,
        foto2: l.foto2 ? `/uploads/ctscan/${l.foto2}` : null,
        dicom_path: l.dicom_path ? `/uploads/ctscan/${l.dicom_path}` : null,
        keluhan: l.keluhan || "-",
        hasil_bacaan: u.ct_scan_reading || l.hasil_bacaan || null,
        status: l.status || "none",
        is_final: !!u.ct_scan_reading,
        is_lokal: !!l.hasil_bacaan,

        tindakan_mapping: [{
          nama: u.tindakan,
          snomed_code: mapTindakan[u.tindakan]?.snomed_code || null,
          snomed_display: mapTindakan[u.tindakan]?.snomed_display || null,
          loinc_code: mapTindakan[u.tindakan]?.loinc_code || null,
          loinc_display: mapTindakan[u.tindakan]?.loinc_display || null,
        }],
      };
    });

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("GET DATA ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET DETAIL CT-SCAN (RECOMMENDED)
// ==============================
exports.getDetail = async (req, res) => {
  try {
    const { registry_id, ct_scan_dtl_id } = req.params;

    if (!registry_id || !ct_scan_dtl_id) {
      return res.status(400).json({ 
        success: false, 
        message: "registry_id dan ct_scan_dtl_id wajib diisi" 
      });
    }

    const [[utama]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id,
        cth.ct_scan_id,
        ctd.ct_scan_dtl_id,
        p.patient_nm,
        p.mr_code,
        cth.measured_dt,
        ms.medical_service_name AS tindakan,
        ctd.ct_scan_reading,
        cth.physician AS pengirim_id,
        cth.expert AS pemeriksa_id,
        e.employee_nm AS pengirim,
        e2.employee_nm AS radiolog,
        e.satusehat_ihs_number AS pengirim_ihs,           -- tambahan
        e2.satusehat_ihs_number AS pemeriksa_ihs          -- tambahan
      FROM registry r
      JOIN patient p ON r.mr_id = p.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON uv.unit_visit_id = cth.unit_visit_id
      JOIN ct_scan_dtl ctd ON cth.ct_scan_id = ctd.ct_scan_id
      JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id
      LEFT JOIN employee e ON cth.physician = e.employee_id
      LEFT JOIN employee e2 ON cth.expert = e2.employee_id
      WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, ct_scan_dtl_id]
    );

    if (!utama) {
      return res.status(404).json({ 
        success: false, 
        message: "Data CT-Scan tidak ditemukan" 
      });
    }

    const [[lokal]] = await dbLokal.promise().query(
      `SELECT * FROM radar_ctscan 
       WHERE registry_id = ? 
         AND ct_scan_dtl_id = ? 
         AND is_active = 1 
       LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    res.json({
      success: true,
      data: {
        ...utama,
        dicom_path: lokal?.dicom_path ? `/uploads/ctscan/${lokal.dicom_path}` : null,
        foto1: lokal?.foto1 ? `/uploads/ctscan/${lokal.foto1}` : null,
        foto2: lokal?.foto2 ? `/uploads/ctscan/${lokal.foto2}` : null,
        keluhan: lokal?.keluhan || "-",
        hasil_bacaan: utama.ct_scan_reading || lokal?.hasil_bacaan || null,
        status: !!utama.ct_scan_reading ? "done" : (lokal?.status || "none"),
        is_final: !!utama.ct_scan_reading,
        is_lokal: !!lokal?.hasil_bacaan,

        // Tambahan informasi yang berguna
        pengirim_ihs: utama.pengirim_ihs,
        pemeriksa_ihs: utama.pemeriksa_ihs,
      }
    });
  } catch (err) {
    console.error("GET DETAIL ERROR:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil detail" });
  }
};

// ==================================
// UPLOAD CT-SCAN + SEND IMAGING STUDY
// ==================================
exports.uploadCTScan = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();

  let inTransaction = false;

  try {
    const { registry_id, ct_scan_id, ct_scan_dtl_id, created_by } = req.body;

    if (!registry_id || !ct_scan_dtl_id) {
      throw new Error("registry_id dan ct_scan_dtl_id wajib");
    }

    console.log("UPLOAD CT-SCAN BODY:", req.body);
    console.log("FILES:", req.files);

    // Cek apakah sudah final di Avesina
    const [[cekFinal]] = await dbUtama.promise().query(
      `SELECT ct_scan_reading FROM ct_scan_dtl WHERE ct_scan_id = ? LIMIT 1`,
      [ct_scan_id]
    );

    const isFinal = !!cekFinal?.ct_scan_reading;

    // Ambil data lokal
    const [[existing]] = await connLokal.query(
      `SELECT * FROM radar_ctscan 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? AND is_active = 1 LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!existing) throw new Error("Data belum di-request");

    // Cek ServiceRequest
    const [[sr]] = await connERM.query(
      `SELECT service_request_uuid FROM satusehat_service_request 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!sr?.service_request_uuid) {
      return res.status(400).json({ success: false, message: "ServiceRequest belum dibuat" });
    }

    // Ambil data lengkap untuk ImagingStudy
    const [[detail]] = await dbUtama.promise().query(
      `
      SELECT 
        r.registry_id, cth.ct_scan_id, ctd.ct_scan_dtl_id, cth.measured_dt,
        ss.patient_ihs_number AS patient_ihs,
        ss.encounter_uuid,
        e.satusehat_ihs_number AS practitioner_ihs
      FROM registry r
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      JOIN ct_scan_hdr cth ON cth.unit_visit_id = uv.unit_visit_id
      JOIN ct_scan_dtl ctd ON ctd.ct_scan_id = cth.ct_scan_id
      LEFT JOIN employee e ON e.employee_id = cth.expert
      LEFT JOIN erm_rswj.satusehat ss ON ss.registry_id = r.registry_id
      WHERE r.registry_id = ? AND ctd.ct_scan_dtl_id = ?
      LIMIT 1
      `,
      [registry_id, ct_scan_dtl_id]
    );

    if (!detail?.patient_ihs || !detail?.encounter_uuid || !detail?.practitioner_ihs) {
      throw new Error("Data SatuSehat belum lengkap");
    }

    // ==================== UPLOAD FILE ====================
    await connLokal.beginTransaction();
    inTransaction = true;

    const dicom = req.files?.dicom?.[0];
    if (!dicom) throw new Error("File DICOM tidak diterima");

    const dicomMeta = parseDicomUID(dicom.path);
    if (!dicomMeta?.studyUID) throw new Error("File bukan DICOM valid");

    // Generate Thumbnail
    const thumbName = `thumb_${Date.now()}.jpg`;
    const thumbPath = path.join(__dirname, "../../uploads/ctscan", thumbName);
    const thumb = dicomToJpg(dicom.path, thumbPath);

    // Update Database
    await connLokal.query(
      `
      UPDATE radar_ctscan
      SET dicom_path = ?, 
          foto1 = ?,
          created_by = ?,
          status = 'uploaded',
          updated_at = NOW()
      WHERE registry_id = ? AND ct_scan_dtl_id = ?
      `,
      [dicom.filename, thumb.success ? thumbName : null, created_by, registry_id, ct_scan_dtl_id]
    );

    await connLokal.commit();
    inTransaction = false;

    // ==================== SIMPAN UID & KIRIM IMAGING STUDY ====================
    const uid = {
      study: dicomMeta.studyUID,
      series: dicomMeta.seriesUID,
      instance: dicomMeta.sopUID,
    };

    await connLokal.query(
      `UPDATE radar_ctscan SET uid_study = ?, uid_series = ?, uid_instance1 = ? 
       WHERE registry_id = ? AND ct_scan_dtl_id = ?`,
      [uid.study, uid.series, uid.instance, registry_id, ct_scan_dtl_id]
    );

    // Ambil modality dari mapping
    let modality = "CR";
    const [[tindakan]] = await dbUtama.promise().query(
      `SELECT medical_service_name FROM ct_scan_dtl ctd 
       JOIN medical_service ms ON ms.medical_service_id = ctd.medical_service_id 
       WHERE ctd.ct_scan_id = ? LIMIT 1`,
      [ct_scan_id]
    );

    if (tindakan?.medical_service_name) {
      const [[map]] = await dbERM.promise().query(
        `SELECT modality FROM satusehat_mapping WHERE local_display = ? LIMIT 1`,
        [tindakan.medical_service_name]
      );
      if (map?.modality) modality = map.modality;
    }

    const normalized = {
      patient_id: detail.patient_ihs,
      encounter_id: detail.encounter_uuid,
      doctor_id: detail.practitioner_ihs,
      service_request_id: sr.service_request_uuid,
      measured_dt: detail.measured_dt,
      no_reg: registry_id,
      modality: modality,
    };

    const imagingPayload = buildImagingStudy(normalized, uid, process.env.ORGANIZATION_ID);

    let imagingId = `DEBUG-${Date.now()}`;
    let imagingStatus = "available";

    if (process.env.DEBUG_SATUSEHAT !== "true") {
      const resImg = await satusehatClient.post("/ImagingStudy", imagingPayload);
      imagingId = resImg.data.id;
      imagingStatus = resImg.data.status || "available";
    }

    res.json({
      success: true,
      is_final: isFinal,
      message: isFinal 
        ? "Data sudah final. ImagingStudy tetap dikirim." 
        : "Upload DICOM & ImagingStudy berhasil",
    });

  } catch (err) {
    if (inTransaction) await connLokal.rollback().catch(() => {});
    console.error("UPLOAD CT-SCAN ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.response?.data?.issue?.[0]?.diagnostics || err.message,
    });
  } finally {
    connLokal.release();
  }
};

// =========================================================
// SAVE HASIL BACAN (RADIOLOG) + SEND OBSERVATION SATUSEHAT
// =========================================================
exports.saveHasil = async (req, res) => {
  const connLokal = await dbLokal.promise().getConnection();
  const connUtama = await dbUtama.promise().getConnection();
  

  try {
    const { registry_id, ct_scan_id, ct_scan_dtl_id, hasil_bacaan, read_by } = req.body;

    if (!registry_id || !ct_scan_dtl_id) throw new Error("registry_id dan ct_scan_dtl_id wajib");
    if (!hasil_bacaan?.trim()) throw new Error("Hasil bacaan wajib diisi");

    await connLokal.beginTransaction();
    await connUtama.beginTransaction();

    // Ambil data lokal
    const [[lokalData]] = await connLokal.query(
      `SELECT ct_scan_id, ct_scan_dtl_id, status 
       FROM radar_ctscan 
       WHERE registry_id = ? AND ct_scan_dtl_id = ? AND is_active = 1 
       LIMIT 1`,
      [registry_id, ct_scan_dtl_id]
    );

    if (!lokalData) throw new Error("Data lokal tidak ditemukan");
    if (lokalData.status === "none") throw new Error("Foto belum diupload");

    // Update ke tabel utama Avesina (jika belum ada hasil)
    await connUtama.query(
      `UPDATE ct_scan_dtl 
       SET ct_scan_reading = ? 
       WHERE ct_scan_id = ? AND ct_scan_dtl_id = ?`,
      [hasil_bacaan, lokalData.ct_scan_id, ct_scan_dtl_id]
    );

    // Update tabel lokal
    await connLokal.query(
      `
      UPDATE radar_ctscan
      SET 
        hasil_bacaan = ?,
        status = 'read',
        read_by = ?,
        read_at = NOW(),
        updated_at = NOW()
      WHERE registry_id = ? AND ct_scan_dtl_id = ?
      `,
      [hasil_bacaan, read_by, registry_id, ct_scan_dtl_id]
    );

    await connLokal.commit();
    await connUtama.commit();

    return res.json({
      success: true,
      message: "Hasil bacaan berhasil disimpan",
      observation_sent: !existingObs?.observation_uuid,
    });

  } catch (err) {
    await connLokal.rollback().catch(() => {});
    await connUtama.rollback().catch(() => {});

    console.error("SAVE HASIL ERROR:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });

  } finally {
    connLokal.release();
    connUtama.release();
  }
};