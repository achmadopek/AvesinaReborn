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
 * - Mapping NIP -> peg_id
 * - Mapping kolom Excel -> penghasilan_id (via penghasilan_code)
 * - Upsert ke thp_penghasilan_pegawai
 */
// === Mapping field Excel → kode DB ===
const fieldMap = {
  // --- Identitas ---
  nip: null,
  nama_pegawai: null,
  tgl_lahir: null,
  sts_pegawai: null,

  // --- Penghasilan ---
  gaji_pokok: "GAJI-POKOK",
  tunj_istri_smi: "TUNJ-ISTRI-SMI",
  tunj_anak: "TUNJ-ANAK",
  tunj_fungsional: "TUNJ-FUNGSIONAL",
  tunj_fung_umum: "TUNJ-FUNG-UMUM",
  tunj_khusus: "TUNJ-KHUSUS",
  tunj_tkd: "T-K-D",
  tunj_beras: "TUNJ-BERAS",
  tunj_eselon: "TUNJ-ESELON",
  tunj_terpencil: "TUNJ-TERPENCIL",
  tunj_pajak: "TUNJ-PAJAK",
  tunj_jkk: "TUNJ-JKK",
  tunj_jkm: "TUNJ-JKM",
  tunj_bpjs_kes_4: "TUNJ-BPJSKES-4",
  tunj_tapera_pk: "TUNJ-TAPERA-PK",
  pembulatan_gaji: "PEMBULATAN-GAJI",

  // --- Potongan ---
  pot_iwp_1: "POT-IWP-1",
  pot_iwp_8: "POT-IWP-8",
  pot_pajak: "POT-PAJAK",
  pot_bpjs_kes: "POT-BPJS-KES",
  pot_jkk: "POT-JKK",
  pot_jkm: "POT-JKM",
  pot_bulog: "BULOG",
  pot_hutang: "HUTANG-LAIN2",
  pot_taperum: "POT-TAPERUM",
  pot_tapera_peg: "POT-TAPERA-PEG",
  pot_tapera_pk: "POT-TAPERA-PK",
  pot_sewa_rumah: "SEWA-RUMAH",

  // --- Ringkasan (skip dari insert langsung) ---
  jml_penghasilan: null,
  jml_potongan: null,
  jumlah_bersih: null,  
};

exports.saveImported = async (req, res) => {
  const connection = db.promise();
  const trx = await connection.getConnection();
  try {
    const { data, periode, entried_by } = req.body;
    if (!data || !periode || !entried_by) {
      return res.status(400).json({ message: "Data, periode, dan entried_by wajib diisi" });
    }

    await trx.beginTransaction();

    // === Ambil semua pegawai (nip & nik) ===
    const nips = data.map(d => (d.nip || "").toString().trim());
    const [pegawaiList] = await trx.query(
      `SELECT id, nip, nik FROM pegawai WHERE nip IN (?) OR nik IN (?)`,
      [nips, nips]
    );

    const pegMap = new Map();
    for (const p of pegawaiList) {
      if (p.nip) pegMap.set(p.nip.toString().trim(), p.id);
      if (p.nik) pegMap.set(p.nik.toString().trim(), p.id);
    }

    // === Ambil semua komponen (penghasilan + potongan) ===
    const [kompList] = await trx.query(`
      SELECT id, penghasilan_code as code, jenis, 'penghasilan' as tipe 
      FROM thp_komponen_penghasilan WHERE jenis = 'gaji'
      UNION ALL
      SELECT id, potongan_code as code, jenis, 'potongan' as tipe 
      FROM thp_komponen_potongan WHERE jenis = 'gaji'
    `);

    const kompMap = new Map();
    kompList.forEach(k => kompMap.set(k.code, k));

    // === Preload data existing (supaya bisa deteksi locked/skip) ===
    const [existingRows] = await trx.query(`
      SELECT 'penghasilan' as tipe, penghasilan_id as komp_id, peg_id, id, is_locked
      FROM thp_penghasilan_pegawai WHERE periode = ? AND event_id IS NULL
      UNION ALL
      SELECT 'potongan' as tipe, potongan_id as komp_id, peg_id, id, is_locked
      FROM thp_potongan_pegawai WHERE periode = ?
    `, [periode, periode]);

    const existingMap = new Map();
    for (const ex of existingRows) {
      existingMap.set(`${ex.peg_id}-${ex.tipe}-${ex.komp_id}`, ex);
    }

    // === Siapkan batch insert untuk penghasilan & potongan ===
    const insertPenghasilan = [];
    const insertPotongan = [];

    for (const row of data) {
      const nipExcel = (row.nip || "").toString().trim();
      const peg_id = pegMap.get(nipExcel);
      if (!peg_id) continue;

      for (const field in row) {
        if (!fieldMap.hasOwnProperty(field)) continue;
        const kode = fieldMap[field];
        if (!kode) continue;

        const nilai = parseInt(row[field] || 0, 10);
        const komp = kompMap.get(kode);
        if (!komp) continue;

        const key = `${peg_id}-${komp.tipe}-${komp.id}`;
        const existing = existingMap.get(key);

        if (existing && existing.is_locked === 1) continue;

        if (komp.tipe === "penghasilan") {
          insertPenghasilan.push([
            komp.id, peg_id, periode, nilai, entried_by, komp.jenis
          ]);
        } else {
          insertPotongan.push([
            komp.id, peg_id, periode, nilai, entried_by, komp.jenis
          ]);
        }
      }
    }

    // === Batch Insert/Update Penghasilan ===
    if (insertPenghasilan.length > 0) {
      await trx.query(`
        INSERT INTO thp_penghasilan_pegawai 
        (penghasilan_id, peg_id, periode, nilai, entried_by, jenis)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          nilai=VALUES(nilai),
          entried_by=VALUES(entried_by),
          jenis=VALUES(jenis)
      `, [insertPenghasilan]);
    }

    // === Batch Insert/Update Potongan (linked ke GAJI-POKOK) ===
    if (insertPotongan.length > 0) {
      // ambil id komponen gaji pokok
      const [gajiPokokKom] = await trx.query(
        `SELECT id FROM thp_komponen_penghasilan WHERE penghasilan_code='GAJI-POKOK' LIMIT 1`
      );
      if (gajiPokokKom.length === 0) throw new Error("Komponen GAJI-POKOK tidak ditemukan");

      const gajiPokokId = gajiPokokKom[0].id;

      // pastikan semua pegawai punya record gaji_pokok
      const pegIds = [...new Set(insertPotongan.map(r => r[1]))];
      const [gajiPokokExist] = await trx.query(
        `SELECT peg_id, id FROM thp_penghasilan_pegawai 
         WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
        [gajiPokokId, periode, pegIds]
      );
      const gajiMap = new Map(gajiPokokExist.map(r => [r.peg_id, r.id]));

      // tambahkan dummy kalau belum ada
      const missingPeg = pegIds.filter(id => !gajiMap.has(id));
      if (missingPeg.length > 0) {
        const dummy = missingPeg.map(id => [
          gajiPokokId, id, periode, 0, entried_by, "gaji"
        ]);
        await trx.query(`
          INSERT INTO thp_penghasilan_pegawai 
          (penghasilan_id, peg_id, periode, nilai, entried_by, jenis)
          VALUES ?`, [dummy]);

        // ambil ulang untuk id baru
        const [gajiPokokExist2] = await trx.query(
          `SELECT peg_id, id FROM thp_penghasilan_pegawai 
           WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
          [gajiPokokId, periode, missingPeg]
        );
        gajiPokokExist2.forEach(r => gajiMap.set(r.peg_id, r.id));
      }

      // insert potongan dengan penghasilan_pegawai_id
      await trx.query(`
        INSERT INTO thp_potongan_pegawai
        (potongan_id, peg_id, periode, nilai, entried_by, jenis, penghasilan_pegawai_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          nilai=VALUES(nilai),
          entried_by=VALUES(entried_by),
          jenis=VALUES(jenis)
      `, [insertPotongan.map(v => [...v, gajiMap.get(v[1]) || null])]);
    }

    await trx.commit();
    res.json({ message: "Import ASN selesai dengan batch upsert" });

  } catch (err) {
    await trx.rollback();
    console.error("Error saveImported ASN:", err);
    res.status(500).json({ message: "Gagal menyimpan data import ASN" });
  } finally {
    trx.release();
  }
};


/**
 * Simpan data penghasilan hasil import Excel.
 * - Mapping NIK -> peg_id
 * - Mapping kolom Excel -> penghasilan_id (via penghasilan_code)
 * - Upsert ke thp_penghasilan_pegawai
 */
// === Mapping field Excel → kode DB ===
const fieldMapNonASNs = {
  // --- Identitas (skip untuk insert langsung) ---
  nik: null,
  nama_pegawai: null,
  tgl_lahir: null,
  sts_pegawai: null,

  // --- Penghasilan ---
  gaji_kotor: "GAJI-KOTOR",

  // --- Potongan ---
  siwa_kpri: "SIWA-KPRI",
  angs_kpri: "ANGS-KPRI",
  angs_ibi: "ANGS-IBI",
  pot_bpjs: "POT-BPJS",
  pot_idi: "POT-IDI",
  pot_ibi: "POT-IBI",

  // --- Ringkasan (skip dari insert langsung) ---
  jml_potongan: null,
  jumlah_bersih: null,
};

exports.saveImportedNonASN = async (req, res) => {
  const connection = db.promise();
  const trx = await connection.getConnection();
  try {
    const { data, periode, entried_by } = req.body;
    if (!data || !periode || !entried_by) {
      return res
        .status(400)
        .json({ message: "Data, periode, dan entried_by wajib diisi" });
    }

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

    // === Ambil semua komponen Non ASN ===
    const [kompList] = await trx.query(`
      SELECT id, penghasilan_code as code, jenis, 'penghasilan' as tipe 
      FROM thp_komponen_penghasilan WHERE jenis = 'gaji'
      UNION ALL
      SELECT id, potongan_code as code, jenis, 'potongan' as tipe 
      FROM thp_komponen_potongan WHERE jenis = 'gaji'
    `);

    const kompMap = new Map();
    kompList.forEach((k) => kompMap.set(k.code, k));

    // === Preload data existing ===
    const [existingRows] = await trx.query(
      `
      SELECT 'penghasilan' as tipe, penghasilan_id as komp_id, peg_id, id, is_locked
      FROM thp_penghasilan_pegawai WHERE periode = ? AND event_id IS NULL
      UNION ALL
      SELECT 'potongan' as tipe, potongan_id as komp_id, peg_id, id, is_locked
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
        if (!fieldMapNonASNs.hasOwnProperty(field)) {
          console.log("Field tidak dikenal:", field);
          continue;
        }

        const kode = fieldMapNonASNs[field];
        if (!kode) continue;

        const nilai = parseInt(row[field] || 0, 10);
        const komp = kompMap.get(kode);
        if (!komp) continue;

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

    // === Batch Insert/Update Potongan (linked ke GAJI-KOTOR) ===
    if (insertPotongan.length > 0) {
      // ambil id komponen gaji kotor
      const [gajiKotorKom] = await trx.query(
        `SELECT id FROM thp_komponen_penghasilan WHERE penghasilan_code='GAJI-KOTOR' AND jenis='gaji' LIMIT 1`
      );
      if (gajiKotorKom.length === 0)
        throw new Error("Komponen GAJI-KOTOR tidak ditemukan");

      const gajiKotorId = gajiKotorKom[0].id;

      // pastikan semua pegawai punya record gaji_kotor
      const pegIds = [...new Set(insertPotongan.map((r) => r[1]))];
      const [gajiKotorExist] = await trx.query(
        `SELECT peg_id, id FROM thp_penghasilan_pegawai 
         WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
        [gajiKotorId, periode, pegIds]
      );
      const gajiMap = new Map(gajiKotorExist.map((r) => [r.peg_id, r.id]));

      // tambahkan dummy kalau belum ada
      const missingPeg = pegIds.filter((id) => !gajiMap.has(id));
      if (missingPeg.length > 0) {
        const dummy = missingPeg.map((id) => [
          gajiKotorId,
          id,
          periode,
          0,
          entried_by,
          "gaji",
        ]);
        const [ins] = await trx.query(
          `
          INSERT INTO thp_penghasilan_pegawai 
          (penghasilan_id, peg_id, periode, nilai, entried_by, jenis)
          VALUES ?`,
          [dummy]
        );
        // ambil ulang supaya dapat id baru
        const [gajiKotorExist2] = await trx.query(
          `SELECT peg_id, id FROM thp_penghasilan_pegawai 
           WHERE penghasilan_id=? AND periode=? AND peg_id IN (?)`,
          [gajiKotorId, periode, missingPeg]
        );
        gajiKotorExist2.forEach((r) => gajiMap.set(r.peg_id, r.id));
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
    res.json({ message: "Import Non ASN selesai dengan batch upsert" });
  } catch (err) {
    await trx.rollback();
    console.error("Error saveImported Non ASN:", err);
    res.status(500).json({ message: "Gagal menyimpan data import Non ASN" });
  } finally {
    trx.release();
  }
};
