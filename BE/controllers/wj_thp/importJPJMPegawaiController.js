const db = require('../../db/connection-lokal');

// ==========================
// GET Semua Penghasilan Pegawai (Pagination + Filter)
// Contoh: /api/penghasilan?periode=2025-01-01&employee_sts=BLUD&page=1&limit=10
// ==========================
exports.getData = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Filter dari frontend
  const periode = req.query.periode || "";
  const employee_sts = req.query.employee_sts || "";

  // WHERE clause
  let baseWhere = "";
  const whereValues = [];

  const addWhere = (field, value) => {
    if (value) {
      baseWhere += (baseWhere ? " AND" : " WHERE") + ` ${field} = ?`;
      whereValues.push(value);
    }
  };

  if (periode) addWhere("base.periode", periode);

  if (employee_sts) {
    const stsArray = employee_sts.split(",");
    baseWhere += (baseWhere ? " AND" : " WHERE") + ` base.employee_sts IN (?)`;
    whereValues.push(stsArray);
  }

  // Query total
  const countQuery = `
    SELECT COUNT(*) AS total FROM (
      SELECT DISTINCT base.peg_id, base.periode
      FROM (
        SELECT p.id AS peg_id, p.employee_sts, pp.periode
        FROM pegawai p
        JOIN thp_penghasilan_pegawai pp ON pp.peg_id = p.id
      ) base
      ${baseWhere}
    ) AS sub
  `;

  // Query data
  const dataQuery = `
    SELECT 
      base.periode,
      base.employee_nm,
      base.employee_sts,
      ph.daftar_penghasilan,
      pt.daftar_potongan,
      IFNULL(ph.total_penghasilan, 0) AS total_penghasilan,
      IFNULL(pt.total_potongan, 0) AS total_potongan,
      (IFNULL(ph.total_penghasilan,0) - IFNULL(pt.total_potongan,0)) AS thp
    FROM (
      SELECT DISTINCT p.id AS peg_id, p.employee_nm, p.employee_sts, pp.periode
      FROM pegawai p
      JOIN thp_penghasilan_pegawai pp ON pp.peg_id = p.id
    ) base
    LEFT JOIN (
      SELECT 
        pp.peg_id, pp.periode,
        GROUP_CONCAT(DISTINCT kp.penghasilan_code ORDER BY kp.penghasilan_code SEPARATOR ', ') AS daftar_penghasilan,
        SUM(pp.nilai) AS total_penghasilan
      FROM thp_penghasilan_pegawai pp
      JOIN thp_komponen_penghasilan kp ON pp.penghasilan_id = kp.id
      GROUP BY pp.peg_id, pp.periode
    ) ph ON ph.peg_id = base.peg_id AND ph.periode = base.periode
    LEFT JOIN (
      SELECT 
        pt.peg_id, pt.periode,
        GROUP_CONCAT(DISTINCT kt.potongan_code ORDER BY kt.potongan_code SEPARATOR ', ') AS daftar_potongan,
        SUM(pt.nilai) AS total_potongan
      FROM thp_potongan_pegawai pt
      JOIN thp_komponen_potongan kt ON pt.potongan_id = kt.id
      GROUP BY pt.peg_id, pt.periode
    ) pt ON pt.peg_id = base.peg_id AND pt.periode = base.periode
    ${baseWhere}
    ORDER BY base.periode DESC, base.employee_nm
    LIMIT ? OFFSET ?;
  `;

  const dataValues = [...whereValues, limit, offset];

  db.query(countQuery, whereValues, (err, countResult) => {
    if (err) {
      console.error("Gagal ambil jumlah total:", err);
      return res.status(500).json({ message: "Gagal ambil total data" });
    }

    const total = countResult[0].total;

    db.query(dataQuery, dataValues, (err, results) => {
      if (err) {
        console.error("Gagal ambil data:", err);
        return res.status(500).json({ message: "Gagal ambil data" });
      }

      res.json({
        data: results,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    });
  });
};

/**
 * Simpan data penghasilan hasil import Excel.
 * - Mapping NIK -> peg_id
 * - Mapping kolom Excel -> penghasilan_id (via penghasilan_code)
 * - Upsert ke thp_penghasilan_pegawai
 */
// === Mapping field Excel → kode DB ===
const fieldMapJPJM = {
  // --- Identitas (skip untuk insert langsung) ---
  nik: null,
  nama_pegawai: null,
  tgl_lahir: null,
  sts_pegawai: null,

  // --- Penghasilan ---
  jp_bruto: "JP-BRUTO",

  // --- Potongan ---
  pph_5_persen: "PPH-5-PERSEN",
  pph_15_persen: "PPH-15-PERSEN",
  pot_a: "POT-A",
  pot_b: "POT-B",
  pot_c: "POT-C",

  // --- Ringkasan (skip dari insert langsung) ---
  jml_potongan: null,
  jumlah_bersih: null,
};

exports.saveImportedJPJM = async (req, res) => {
  const connection = db.promise();
  const trx = await connection.getConnection();

  try {
    const { data, periode, entried_by, sheet_type } = req.body;

    if (!data || !periode || !entried_by) {
      return res.status(400).json({ message: "Data, periode, dan entried_by wajib diisi" });
    }

    // ========================
    // Tentukan suffix sheet type
    // ========================
    // Misal: sheet_type = 'JP-JKN' → suffix = '-JKN'
    const suffix = sheet_type?.split("JP-")[1] ? `-${sheet_type.split("JP-")[1]}` : "";
    console.log(`[IMPORT JPJM] Sheet Type: ${sheet_type} → Suffix: ${suffix}`);

    // ========================
    // Field mapping dasar
    // ========================
    const baseFieldMap = {
      nik: null,
      nama_pegawai: null,
      tgl_lahir: null,
      sts_pegawai: null,
      jp_bruto: "JP-BRUTO",
      pph_5_persen: "PPH-5-PERSEN",
      pph_15_persen: "PPH-15-PERSEN",
      pot_a: "POT-A",
      pot_b: "POT-B",
      pot_c: "POT-C",
      jml_potongan: null,
      jumlah_bersih: null,
    };

    // Buat fieldMap dinamis sesuai suffix
    const fieldMapJPJM = {};
    for (const [key, val] of Object.entries(baseFieldMap)) {
      if (!val) fieldMapJPJM[key] = null;
      else fieldMapJPJM[key] = `${val}${suffix}`; // contoh: "JP-BRUTO-JKN"
    }

    console.log("Field map aktif:", fieldMapJPJM);

    await trx.beginTransaction();

    // === Ambil semua pegawai (by NIK) ===
    const niks = data.map((d) => (d.nik || "").toString().trim());
    const [pegawaiList] = await trx.query(
      `SELECT id, nik FROM pegawai WHERE nik IN (?)`,
      [niks]
    );

    const pegMap = new Map();
    for (const p of pegawaiList) {
      if (p.nik) pegMap.set(p.nik.toString().trim(), p.id);
    }

    // === Ambil semua komponen penghasilan & potongan ===
    const [kompList] = await trx.query(`
      SELECT id, penghasilan_code AS code, jenis, 'penghasilan' AS tipe 
      FROM thp_komponen_penghasilan
      UNION ALL
      SELECT id, potongan_code AS code, jenis, 'potongan' AS tipe 
      FROM thp_komponen_potongan
    `);

    const kompMap = new Map();
    kompList.forEach((k) => kompMap.set(k.code, k));

    // === Preload data existing ===
    const [existingRows] = await trx.query(
      `
      SELECT 'penghasilan' AS tipe, penghasilan_id AS komp_id, peg_id, id, is_locked
      FROM thp_penghasilan_pegawai WHERE periode = ? AND event_id IS NULL
      UNION ALL
      SELECT 'potongan' AS tipe, potongan_id AS komp_id, peg_id, id, is_locked
      FROM thp_potongan_pegawai WHERE periode = ?
      `,
      [periode, periode]
    );

    const existingMap = new Map();
    for (const ex of existingRows) {
      existingMap.set(`${ex.peg_id}-${ex.tipe}-${ex.komp_id}`, ex);
    }

    // === Siapkan batch insert ===
    const insertPenghasilan = [];
    const insertPotongan = [];

    for (const row of data) {
      const nikExcel = (row.nik || "").toString().trim();
      const peg_id = pegMap.get(nikExcel);
      if (!peg_id) {
        console.log("Skip row: NIK tidak ditemukan di DB:", nikExcel);
        continue;
      }

      for (const field in row) {
        if (!fieldMapJPJM.hasOwnProperty(field)) continue;

        const kode = fieldMapJPJM[field];
        if (!kode) continue;

        const nilai = parseInt(row[field] || 0, 10);
        const komp = kompMap.get(kode);
        if (!komp) {
          console.log("Komponen tidak ditemukan di DB:", kode);
          continue;
        }

        const key = `${peg_id}-${komp.tipe}-${komp.id}`;
        const existing = existingMap.get(key);

        if (existing && existing.is_locked === 1) continue;

        if (komp.tipe === "penghasilan") {
          insertPenghasilan.push([
            komp.id,
            peg_id,
            periode,
            nilai,
            entried_by,
            komp.jenis,
          ]);
        } else {
          insertPotongan.push([
            komp.id,
            peg_id,
            periode,
            nilai,
            entried_by,
            komp.jenis,
          ]);
        }
      }
    }

    // === Batch Insert/Update Penghasilan ===
    if (insertPenghasilan.length > 0) {
      await trx.query(
        `
        INSERT INTO thp_penghasilan_pegawai 
        (penghasilan_id, peg_id, periode, nilai, entried_by, jenis)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          nilai=VALUES(nilai),
          entried_by=VALUES(entried_by),
          jenis=VALUES(jenis)
      `,
        [insertPenghasilan]
      );
    }

    // === Batch Insert/Update Potongan ===
    if (insertPotongan.length > 0) {
      // ambil id JP-BRUTO-[suffix]
      const brutoCode = `JP-BRUTO${suffix}`;
      const [jpBrutoKom] = await trx.query(
        `SELECT id FROM thp_komponen_penghasilan WHERE penghasilan_code=? LIMIT 1`,
        [brutoCode]
      );
      if (jpBrutoKom.length === 0)
        throw new Error(`Komponen ${brutoCode} tidak ditemukan`);

      const jpBrutoId = jpBrutoKom[0].id;

      // pastikan semua pegawai punya record penghasilan bruto (base link)
      const pegIds = [...new Set(insertPotongan.map((r) => r[1]))];
      const [jpBrutoExist] = await trx.query(
        `SELECT peg_id, id FROM thp_penghasilan_pegawai 
         WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
        [jpBrutoId, periode, pegIds]
      );

      const gajiMap = new Map(jpBrutoExist.map((r) => [r.peg_id, r.id]));

      // buat dummy JP-BRUTO jika belum ada
      const missingPeg = pegIds.filter((id) => !gajiMap.has(id));
      if (missingPeg.length > 0) {
        const dummy = missingPeg.map((id) => [
          jpBrutoId,
          id,
          periode,
          0,
          entried_by,
          "tetap",
        ]);
        await trx.query(
          `INSERT INTO thp_penghasilan_pegawai 
           (penghasilan_id, peg_id, periode, nilai, entried_by, jenis)
           VALUES ?`,
          [dummy]
        );
        const [jpBrutoExist2] = await trx.query(
          `SELECT peg_id, id FROM thp_penghasilan_pegawai 
           WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
          [jpBrutoId, periode, missingPeg]
        );
        jpBrutoExist2.forEach((r) => gajiMap.set(r.peg_id, r.id));
      }

      await trx.query(
        `
        INSERT INTO thp_potongan_pegawai
        (potongan_id, peg_id, periode, nilai, entried_by, jenis, penghasilan_pegawai_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          nilai=VALUES(nilai),
          entried_by=VALUES(entried_by),
          jenis=VALUES(jenis)
      `,
        [insertPotongan.map((v) => [...v, gajiMap.get(v[1]) || null])]
      );
    }

    await trx.commit();
    res.json({ message: `Import ${sheet_type} selesai dengan batch upsert` });
  } catch (err) {
    await trx.rollback();
    console.error("Error saveImported JPJM:", err);
    res.status(500).json({ message: "Gagal menyimpan data import JPJM", error: err.message });
  } finally {
    trx.release();
  }
};