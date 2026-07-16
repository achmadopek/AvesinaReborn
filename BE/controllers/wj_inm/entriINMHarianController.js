const db_lokal = require("../../db/connection-lokal");
const generateINMPDF = require("../../middleware/generateINMPDF");

/* ======================================================
   HELPER
====================================================== */

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip
  );
};

function hitungCapaian(num, den, measurement) {
  if (!den || den === 0) return null;

  switch (measurement) {
    case "%":
      return (num / den) * 100;
    default:
      return num / den;
  }
}

function cekStandar(nilai, operator, standar) {
  if (nilai === null) return null;

  const std = Number(standar);

  switch (operator) {
    case "=":
      return nilai === std;
    case ">=":
      return nilai >= std;
    case "<=":
      return nilai <= std;
    case ">":
      return nilai > std;
    case "<":
      return nilai < std;
    default:
      return null;
  }
}

/* ======================================================
   MASTER DATA
====================================================== */

// GET semua ruangan
exports.getAllRuangan = (req, res) => {
  const sql = `
    SELECT 
      id as ruangan_id,
      nama_unit as nama_ruangan,
      kode_unit as kode_ruangan,
      srvc_unit_id,
      kepala_unit
    FROM inm_unit
    WHERE status = 1
    ORDER BY nama_ruangan ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: rows,
    });
  });
};

// GET instalasi
exports.getAllInstalasi = (req, res) => {
  const sql = `
    SELECT 
      id as instalasi_id,
      nama_instalasi,
      kode_instalasi
    FROM inm_instalasi
    ORDER BY nama_instalasi ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: rows,
    });
  });
};

// GET bidang
exports.getAllBidang = (req, res) => {
  const sql = `
    SELECT 
      id as bidang_id,
      nama_bidang,
      kode_bidang
    FROM inm_bidang
    ORDER BY nama_bidang ASC
  `;

  db_lokal.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: rows,
    });
  });
};

// GET indikator by unit
exports.getIndikatorByUnit = (req, res) => {
  const { unit_id } = req.params;

  const sql = `
    SELECT DISTINCT
      ind.id,
      ind.judul_indikator,
      ind.operator,
      ind.measurement,
      ind.standart,
      ind.satuan_num,
      ind.satuan_den,
      ind.contoh_num,
      ind.contoh_den,
      ind.numerator,
      ind.denominator,
      ind.conversion_factor,
      ind.is_proportion,

      ind.group_pelayanan_id,

      g.nama_group,
      g.kode_group

    FROM inm_indikator ind
    JOIN inm_group_pelayanan g 
      ON g.id = ind.group_pelayanan_id
    INNER JOIN inm_unit_group_pelayanan ug
      ON ug.group_pelayanan_id = ind.group_pelayanan_id
    WHERE ug.unit_id = ?
    ORDER BY g.nama_group, ind.id
  `;

  db_lokal.query(sql, [unit_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: rows,
    });
  });
};

/* ======================================================
   SIMPAN INM HARIAN
====================================================== */
function validateNumeratorDenominator(num, den, isProportion) {
  const n = Number(num) || 0;
  const d = Number(den) || 0;

  if (isProportion === 0 || isProportion === false) {
    return { valid: true }; // Bebas (contoh: jam buka, waktu tunggu, dll)
  }

  // Validasi untuk proporsi (is_proportion = 1)
  if (d === 0 && n > 0) {
    return { valid: false, message: "Denominator tidak boleh 0" };
  }
  if (n > d) {
    return {
      valid: false,
      message: "Numerator tidak boleh lebih besar dari Denominator",
    };
  }
  if (n < 0 || d < 0) {
    return { valid: false, message: "Nilai tidak boleh negatif" };
  }

  return { valid: true };
}

exports.validateNumeratorDenominator = validateNumeratorDenominator;

/* ======================================================
   SIMPAN INM HARIAN - VERSI PERBAIKAN
====================================================== */
exports.simpanHarianBulk = async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const {
      unit_id,
      tgl_input,
      created_by,
      hostname,
      username,
      unitName,
      details,
    } = req.body;

    if (!unit_id || !tgl_input || !details?.length) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap",
      });
    }

    /* ===============================
       INSERT HEADER
    =============================== */
    const sqlHarian = `
      INSERT INTO inm_harian (unit_id, tgl_input, created_by, created_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        updated_at = NOW(),
        id = LAST_INSERT_ID(id)
    `;

    const [result] = await db_lokal
      .promise()
      .query(sqlHarian, [unit_id, tgl_input, created_by]);

    const harian_id = result.insertId;

    /* ===============================
       AMBIL MASTER INDIKATOR
    =============================== */
    const indikatorIds = details.map((d) => d.indikator_id);

    const sqlIndikator = `
      SELECT
        id,
        measurement,
        operator,
        standart,
        conversion_factor,
        is_proportion,
        judul_indikator
      FROM inm_indikator
      WHERE id IN (?)
    `;

    const [indikatorRows] = await db_lokal
      .promise()
      .query(sqlIndikator, [indikatorIds]);

    const indikatorMap = {};
    indikatorRows.forEach((i) => {
      indikatorMap[i.id] = i;
    });

    /* ===============================
       VALIDASI + HITUNG NILAI
    =============================== */
    const values = [];
    const errors = [];

    for (const d of details) {
      const ind = indikatorMap[d.indikator_id];
      if (!ind) continue;

      const num = Number(d.numerator_value) || 0;
      const den = Number(d.denominator_value) || 0;

      // === VALIDASI NUMERATOR & DENOMINATOR ===
      const propValidation = validateNumeratorDenominator(
        num,
        den,
        ind.is_proportion,
      );

      if (!propValidation.valid) {
        errors.push(
          `Indikator ID ${d.indikator_id} - ${ind.judul_indikator || ""}: ${propValidation.message}`,
        );
        continue;
      }

      // === HITUNG NILAI ===
      let nilai = hitungCapaian(num, den, ind.measurement);
      nilai =
        nilai === null ? null : nilai * Number(ind.conversion_factor || 1);

      const memenuhi = cekStandar(nilai, ind.operator, ind.standart);

      values.push([
        harian_id,
        d.indikator_id,
        num,
        den,
        nilai,
        memenuhi,
        new Date(),
        new Date(),
      ]);
    }

    // Jika ada error validasi
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validasi data gagal",
        errors: errors,
      });
    }

    /* ===============================
       INSERT DETAIL
    =============================== */
    const sqlDetail = `
      INSERT INTO inm_harian_detail
      (
        harian_id,
        indikator_id,
        numerator_value,
        denominator_value,
        final_value,
        is_meet_standard,
        created_at,
        updated_at
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        numerator_value = VALUES(numerator_value),
        denominator_value = VALUES(denominator_value),
        final_value = VALUES(final_value),
        is_meet_standard = VALUES(is_meet_standard),
        updated_at = NOW()
    `;

    await db_lokal.promise().query(sqlDetail, [values]);

    /* ===============================
       GENERATE PDF
    =============================== */
    const pdfFile = await generateINMPDF(
      { id: harian_id, tgl_input },
      details,
      unit_id,
      created_by,
      unitName,
      username,
      clientIP,
      hostname,
      userAgent,
    );

    /* ===============================
       UPDATE PATH PDF
    =============================== */
    await db_lokal
      .promise()
      .query("UPDATE inm_harian SET pdf_path = ? WHERE id = ?", [
        pdfFile,
        harian_id,
      ]);

    /* ===============================
       RESPONSE
    =============================== */
    res.json({
      success: true,
      harian_id,
      message: "Data INM berhasil disimpan",
    });
  } catch (err) {
    console.error("INM ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan INM",
      error: err.message,
    });
  }
};

/* ======================================================
   DOWNLOAD PDF
====================================================== */
const path = require("path");
const fs = require("fs");

exports.downloadINM = async (req, res) => {
  try {
    const { id } = req.params;

    // ambil path file dari database
    const sql = `
      SELECT pdf_path 
      FROM inm_harian
      WHERE id = ?
    `;

    const [rows] = await db_lokal.promise().query(sql, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "File tidak ditemukan" });
    }

    const filePath = path.join(
      __dirname,
      "../../uploads/inm",
      rows[0].pdf_path,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File tidak ada di server" });
    }

    res.download(filePath, `INM_Harian_${id}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal download file" });
  }
};
