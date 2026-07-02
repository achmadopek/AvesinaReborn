const db2 = require("../../db/connection-aset");
const IgdService = require("../../services/supervisi/IgdService");
const HemodialisaService = require("../../services/supervisi/HemodialisaService");
const BedahService = require("../../services/supervisi/BedahService");
const { generateId } = require("../../utility/generateId");

// ==============================
// GET DATA
// ==============================
exports.getData = async (req, res) => {
  try {
    const [rows] = await db2.promise().query(`
      SELECT
        supervisi_id,
        tanggal_supervisi,
        periode_awal,
        periode_akhir,
        status
      FROM supervisi
      WHERE is_active = 1
      ORDER BY tanggal_supervisi DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data supervisi",
    });
  }
};

// ==============================
// GET DETAIL
// ==============================
exports.getDetail = async (req, res) => {
  try {
    const { supervisi_id } = req.params;

    const [supervisiRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [igdRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_igd
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [hdRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_hd
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [ibsRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_ibs
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [mutuRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_mutu
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [kendalaRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_kendala
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const [kebutuhanDetailRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_kebutuhan_detail
      WHERE supervisi_id = ?
        AND is_active = 1
      ORDER BY urut
    `,
      [supervisi_id],
    );

    const [kendalaDetailRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_kendala_detail
      WHERE supervisi_id = ?
        AND is_active = 1
      ORDER BY urut
    `,
      [supervisi_id],
    );

    const [eksekutifDetailRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_eksekutif_detail
      WHERE supervisi_id = ?
        AND is_active = 1
      ORDER BY urut
    `,
      [supervisi_id],
    );

    const [eksekutifRows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_eksekutif
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    const supervisi = supervisiRows[0] || null;

    let igd = igdRows[0] || null;
    let hd = hdRows[0] || null;
    let ibs = ibsRows[0] || null;

    if (!igd && supervisi) {
      igd = await IgdService.generate(
        supervisi.periode_awal,
        supervisi.periode_akhir,
      );
    }

    if (!hd && supervisi) {
      hd = await HemodialisaService.generate();
    }

    if (!ibs && supervisi) {
      ibs = await BedahService.generate();
    }

    res.json({
      success: true,
      data: {
        ...(supervisi || {}),
        igd,
        hd,
        ibs,
        mutu: mutuRows[0] || null,
        kendala: {
          ...(kendalaRows[0] || {}),
          kebutuhan_detail: kebutuhanDetailRows,
          kendala_detail: kendalaDetailRows,
        },

        eksekutif: {
          ...(eksekutifRows[0] || {}),
          detail: eksekutifDetailRows,
        },
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail supervisi",
    });
  }
};

const generateSupervisiId = () => {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `SUP-${timestamp}-${randomSuffix}`.slice(0, 22);
};

// ==============================
// SAVE DATA
// ==============================
exports.save = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const {
      supervisi_id,
      tanggal_supervisi,
      periode_awal,
      periode_akhir,
      status,
      user_id,
    } = req.body;

    const supervisiId = supervisi_id || generateSupervisiId();

    await conn.beginTransaction();

    const [check] = await conn.query(
      `
      SELECT supervisi_id
      FROM supervisi
      WHERE supervisi_id = ?
      `,
      [supervisiId],
    );

    if (check.length > 0) {
      await conn.query(
        `
        UPDATE supervisi
        SET
          tanggal_supervisi = ?,
          periode_awal = ?,
          periode_akhir = ?,
          status = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE supervisi_id = ?
      `,
        [
          tanggal_supervisi,
          periode_awal,
          periode_akhir,
          status,
          user_id,
          supervisiId,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO supervisi (
          supervisi_id,
          tanggal_supervisi,
          periode_awal,
          periode_akhir,
          status,
          created_by,
          created_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, NOW()
        )
      `,
        [
          supervisiId,
          tanggal_supervisi,
          periode_awal,
          periode_akhir,
          status || "OPEN",
          user_id,
        ],
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Data supervisi berhasil disimpan",
      supervisi_id: supervisiId,
    });
  } catch (err) {
    await conn.rollback();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan supervisi",
    });
  } finally {
    conn.release();
  }
};

// ==============================
// CHANGE STATUS
// ==============================
exports.changeStatus = async (req, res) => {
  try {
    const { supervisi_id } = req.params;
    const { status } = req.body;

    await db2.promise().query(
      `
      UPDATE supervisi
      SET
        status = ?,
        updated_at = NOW()
      WHERE supervisi_id = ?
      `,
      [status, supervisi_id],
    );

    res.json({
      success: true,
      message: "Status berhasil diubah",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengubah status",
    });
  }
};

const saveSubform = async (
  conn,
  table,
  idField,
  uniqueField,
  uniqueValue,
  fields,
  user_id,
) => {
  const [check] = await conn.query(
    `
    SELECT ${idField}
    FROM ${table}
    WHERE ${uniqueField} = ?
  `,
    [uniqueValue],
  );

  if (check.length > 0) {
    const setClause = fields
      .map((field) => `${field} = ?`)
      .join(",\n          ");

    await conn.query(
      `
      UPDATE ${table}
      SET
        ${setClause},
        updated_by = ?,
        updated_at = NOW()
      WHERE ${uniqueField} = ?
    `,
      [...fields.map((field) => field.value), user_id, uniqueValue],
    );
  } else {
    const generatedId = generateId(
      idField.split("_")[1]?.toUpperCase() || "ID",
    );
    const columns = [
      idField,
      uniqueField,
      ...fields.map((field) => field.name),
      "created_by",
    ];
    const values = [
      generatedId,
      uniqueValue,
      ...fields.map((field) => field.value),
      user_id,
    ];

    await conn.query(
      `
      INSERT INTO ${table} (
        ${columns.join(",\n          ")}
      )
      VALUES (
        ${columns.map(() => "?").join(", ")}
      )
    `,
      values,
    );
  }
};

const makeText = (value) =>
  value === undefined || value === null ? "" : value;

exports.getIgdDetail = async (req, res) => {
  try {
    const { supervisi_id } = req.params;

    const [rows] = await db2.promise().query(
      `
      SELECT *
      FROM supervisi_igd
      WHERE supervisi_id = ?
      LIMIT 1
    `,
      [supervisi_id],
    );

    res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail IGD",
    });
  }
};

exports.saveIgd = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const {
      supervisi_id,
      pasien_total,
      pasien_igd_lama,
      pasien_igd_baru,
      pasien_keluar_igd,
      pasien_rawat_inap,
      pasien_igd_sisa,
      kematian_igd_6_jam,
      kematian_ranap_lt_24_jam,
      kematian_ranap_gt_24_jam,
      catatan,
      user_id,
    } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    const [check] = await conn.query(
      `
      SELECT supervisi_igd_id
      FROM supervisi_igd
      WHERE supervisi_id = ?
      `,
      [supervisi_id],
    );

    if (check.length > 0) {
      await conn.query(
        `
        UPDATE supervisi_igd
        SET
          pasien_total = ?,
          pasien_igd_lama = ?,
          pasien_igd_baru = ?,
          pasien_keluar_igd = ?,
          pasien_rawat_inap = ?,
          pasien_igd_sisa = ?,
          kematian_igd_6_jam = ?,
          kematian_ranap_lt_24_jam = ?,
          kematian_ranap_gt_24_jam = ?,
          catatan = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE supervisi_id = ?
      `,
        [
          pasien_total || 0,
          pasien_igd_lama || 0,
          pasien_igd_baru || 0,
          pasien_keluar_igd || 0,
          pasien_rawat_inap || 0,
          pasien_igd_sisa || 0,
          kematian_igd_6_jam || 0,
          kematian_ranap_lt_24_jam || 0,
          kematian_ranap_gt_24_jam || 0,
          makeText(catatan),
          user_id,
          supervisi_id,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO supervisi_igd (
          supervisi_igd_id,
          supervisi_id,
          pasien_total,
          pasien_igd_lama,
          pasien_igd_baru,
          pasien_keluar_igd,
          pasien_rawat_inap,
          pasien_igd_sisa,
          kematian_igd_6_jam,
          kematian_ranap_lt_24_jam,
          kematian_ranap_gt_24_jam,
          catatan,
          created_by,
          created_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )
      `,
        [
          generateId("IGD"),
          supervisi_id,
          pasien_total || 0,
          pasien_igd_lama || 0,
          pasien_igd_baru || 0,
          pasien_keluar_igd || 0,
          pasien_rawat_inap || 0,
          pasien_igd_sisa || 0,
          kematian_igd_6_jam || 0,
          kematian_ranap_lt_24_jam || 0,
          kematian_ranap_gt_24_jam || 0,
          makeText(catatan),
          user_id,
        ],
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Data IGD berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data IGD",
    });
  } finally {
    conn.release();
  }
};

const saveGenericTextRecord = async (
  conn,
  table,
  idField,
  idPrefix,
  uniqueField,
  uniqueValue,
  values,
  user_id,
) => {
  const [check] = await conn.query(
    `
    SELECT ${idField}
    FROM ${table}
    WHERE ${uniqueField} = ?
  `,
    [uniqueValue],
  );

  if (check.length > 0) {
    const setFields = Object.keys(values)
      .map((field) => `${field} = ?`)
      .join(",\n          ");

    await conn.query(
      `
      UPDATE ${table}
      SET
        ${setFields},
        updated_by = ?,
        updated_at = NOW()
      WHERE ${uniqueField} = ?
    `,
      [...Object.values(values), user_id, uniqueValue],
    );
  } else {
    await conn.query(
      `
      INSERT INTO ${table} (
        ${idField},
        ${uniqueField},
        ${Object.keys(values).join(",\n        ")},
        created_by,
        created_at
      )
      VALUES (
        ?, ?, ${Object.keys(values)
          .map(() => "?")
          .join(", ")}, ?, NOW()
      )
    `,
      [
        generateId(idPrefix),
        uniqueValue,
        ...Object.values(values).map(makeText),
        user_id,
      ],
    );
  }
};

const saveNumberRecord = async (
  conn,
  table,
  idField,
  idPrefix,
  uniqueField,
  uniqueValue,
  values,
  user_id,
) => {
  const [check] = await conn.query(
    `
    SELECT ${idField}
    FROM ${table}
    WHERE ${uniqueField} = ?
  `,
    [uniqueValue],
  );

  const recordValues = Object.values(values).map((value) => value || 0);

  if (check.length > 0) {
    const setFields = Object.keys(values)
      .map((field) => `${field} = ?`)
      .join(",\n          ");

    await conn.query(
      `
      UPDATE ${table}
      SET
        ${setFields},
        updated_by = ?,
        updated_at = NOW()
      WHERE ${uniqueField} = ?
    `,
      [...recordValues, user_id, uniqueValue],
    );
  } else {
    await conn.query(
      `
      INSERT INTO ${table} (
        ${idField},
        ${uniqueField},
        ${Object.keys(values).join(",\n        ")},
        created_by,
        created_at
      )
      VALUES (
        ?, ?, ${Object.keys(values)
          .map(() => "?")
          .join(", ")}, ?, NOW()
      )
    `,
      [generateId(idPrefix), uniqueValue, ...recordValues, user_id],
    );
  }
};

const saveHd = async (conn, payload, user_id) => {
  const values = {
    pasien_reguler: payload.pasien_reguler || 0,
    pasien_isolasi: payload.pasien_isolasi || 0,
    capd: payload.capd || 0,
    pembiayaan_bpjs: payload.pembiayaan_bpjs || 0,
    catatan: makeText(payload.catatan),
    pasien_hd_total: payload.pasien_hd_total || 0,
  };

  await saveGenericTextRecord(
    conn,
    "supervisi_hd",
    "supervisi_hd_id",
    "HD",
    "supervisi_id",
    payload.supervisi_id,
    values,
    user_id,
  );
};

const saveIbs = async (conn, payload, user_id) => {
  const values = {
    operasi_khusus: payload.operasi_khusus || 0,
    operasi_besar: payload.operasi_besar || 0,
    operasi_sedang: payload.operasi_sedang || 0,
    operasi_kecil: payload.operasi_kecil || 0,
    emergency: payload.emergency || 0,
    urgency: payload.urgency || 0,
    elektif: payload.elektif || 0,
    operasi_batal_tunda: makeText(payload.operasi_batal_tunda),
    catatan: makeText(payload.catatan),
    pasien_ibs_total: payload.pasien_ibs_total || 0,
  };

  await saveGenericTextRecord(
    conn,
    "supervisi_ibs",
    "supervisi_ibs_id",
    "IBS",
    "supervisi_id",
    payload.supervisi_id,
    values,
    user_id,
  );
};

const saveMutu = async (conn, payload, user_id) => {
  const values = {
    keluhan_pasien: makeText(payload.keluhan_pasien),
    insiden_keselamatan: payload.insiden_keselamatan || 0,
    kejadian_sentinel: payload.kejadian_sentinel || 0,
    infeksi_nosokomial: payload.infeksi_nosokomial || 0,
    mutu_mortalitas_igd_6_jam: payload.mutu_mortalitas_igd_6_jam || 0,
    mutu_mortalitas_ranap_gt_24_jam:
      payload.mutu_mortalitas_ranap_gt_24_jam || 0,
  };

  await saveGenericTextRecord(
    conn,
    "supervisi_mutu",
    "supervisi_mutu_id",
    "MUTU",
    "supervisi_id",
    payload.supervisi_id,
    values,
    user_id,
  );
};

const saveKendala = async (conn, payload, user_id) => {
  const values = {
    kebutuhan_utama: "",
    kendala_utama: "",
  };

  await saveGenericTextRecord(
    conn,
    "supervisi_kendala",
    "supervisi_kendala_id",
    "KENDALA",
    "supervisi_id",
    payload.supervisi_id,
    values,
    user_id,
  );

  await saveDetailItems(
    conn,
    "supervisi_kebutuhan_detail",
    "supervisi_kebutuhan_detail_id",
    "KBT",
    payload.supervisi_id,
    payload.kebutuhan_detail,
  );
};

const saveEksekutif = async (conn, payload, user_id) => {
  const values = {
    ringkasan_eksekutif: "",
  };

  await saveGenericTextRecord(
    conn,
    "supervisi_eksekutif",
    "supervisi_eksekutif_id",
    "EKSEKUTIF",
    "supervisi_id",
    payload.supervisi_id,
    values,
    user_id,
  );
};

// ==============================
// SAVE KEBUTUHAN DETAIL
// ==============================
exports.saveKebutuhanDetail = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_kebutuhan_detail_id, supervisi_id, uraian, user_id } =
      req.body;

    if (!supervisi_id || !uraian?.trim()) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id dan uraian wajib diisi",
      });
    }

    await conn.beginTransaction();

    let resultData;

    if (supervisi_kebutuhan_detail_id) {
      // UPDATE
      await conn.query(
        `
        UPDATE supervisi_kebutuhan_detail
        SET
          uraian = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE supervisi_kebutuhan_detail_id = ?
          AND is_active = 1
        `,
        [uraian.trim(), user_id, supervisi_kebutuhan_detail_id],
      );

      resultData = {
        supervisi_kebutuhan_detail_id,
        supervisi_id,
        uraian: uraian.trim(),
      };
    } else {
      // INSERT
      const [[last]] = await conn.query(
        `
        SELECT IFNULL(MAX(urut), 0) + 1 as urut
        FROM supervisi_kebutuhan_detail
        WHERE supervisi_id = ?
        `,
        [supervisi_id],
      );

      const newId = generateId("KBD");

      await conn.query(
        `
        INSERT INTO supervisi_kebutuhan_detail (
          supervisi_kebutuhan_detail_id,
          supervisi_id,
          urut,
          uraian,
          created_by,
          created_at,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, NOW(), 1)
        `,
        [newId, supervisi_id, last.urut, uraian.trim(), user_id],
      );

      resultData = {
        supervisi_kebutuhan_detail_id: newId,
        supervisi_id,
        uraian: uraian.trim(),
        urut: last.urut,
      };
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Detail kebutuhan berhasil disimpan",
      data: resultData, // Kembalikan data yang baru disimpan
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan detail kebutuhan",
    });
  } finally {
    conn.release();
  }
};

// ==============================
// SAVE KENDALA DETAIL (untuk satu item)
// ==============================
exports.saveKendalaDetail = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_kendala_detail_id, supervisi_id, uraian, user_id } =
      req.body;

    if (!supervisi_id || !uraian?.trim()) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id dan uraian wajib diisi",
      });
    }

    await conn.beginTransaction();

    let resultData;

    if (supervisi_kendala_detail_id) {
      // UPDATE
      await conn.query(
        `
        UPDATE supervisi_kendala_detail
        SET
          uraian = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE supervisi_kendala_detail_id = ?
          AND is_active = 1
        `,
        [uraian.trim(), user_id, supervisi_kendala_detail_id],
      );

      resultData = {
        supervisi_kendala_detail_id,
        supervisi_id,
        uraian: uraian.trim(),
      };
    } else {
      // INSERT
      const [[last]] = await conn.query(
        `
        SELECT IFNULL(MAX(urut), 0) + 1 as urut
        FROM supervisi_kendala_detail
        WHERE supervisi_id = ?
        `,
        [supervisi_id],
      );

      const newId = generateId("KDL");

      await conn.query(
        `
        INSERT INTO supervisi_kendala_detail (
          supervisi_kendala_detail_id,
          supervisi_id,
          urut,
          uraian,
          created_by,
          created_at,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, NOW(), 1)
        `,
        [newId, supervisi_id, last.urut, uraian.trim(), user_id],
      );

      resultData = {
        supervisi_kendala_detail_id: newId,
        supervisi_id,
        uraian: uraian.trim(),
        urut: last.urut,
      };
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Detail kendala berhasil disimpan",
      data: resultData,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan detail kendala",
    });
  } finally {
    conn.release();
  }
};

// ==============================
// SAVE EKSEKUTIF DETAIL (untuk satu item)
// ==============================
exports.saveEksekutifDetail = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_eksekutif_detail_id, supervisi_id, uraian, user_id } =
      req.body;

    if (!supervisi_id || !uraian?.trim()) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id dan uraian wajib diisi",
      });
    }

    await conn.beginTransaction();

    let resultData;

    if (supervisi_eksekutif_detail_id) {
      // UPDATE
      await conn.query(
        `
        UPDATE supervisi_eksekutif_detail
        SET
          uraian = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE supervisi_eksekutif_detail_id = ?
          AND is_active = 1
        `,
        [uraian.trim(), user_id, supervisi_eksekutif_detail_id],
      );

      resultData = {
        supervisi_eksekutif_detail_id,
        supervisi_id,
        uraian: uraian.trim(),
      };
    } else {
      // INSERT
      const [[last]] = await conn.query(
        `
        SELECT IFNULL(MAX(urut), 0) + 1 as urut
        FROM supervisi_eksekutif_detail
        WHERE supervisi_id = ?
        `,
        [supervisi_id],
      );

      const newId = generateId("EKD");

      await conn.query(
        `
        INSERT INTO supervisi_eksekutif_detail (
          supervisi_eksekutif_detail_id,
          supervisi_id,
          urut,
          uraian,
          created_by,
          created_at,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, NOW(), 1)
        `,
        [newId, supervisi_id, last.urut, uraian.trim(), user_id],
      );

      resultData = {
        supervisi_eksekutif_detail_id: newId,
        supervisi_id,
        uraian: uraian.trim(),
        urut: last.urut,
      };
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Detail eksekutif berhasil disimpan",
      data: resultData,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan detail eksekutif",
    });
  } finally {
    conn.release();
  }
};

const saveDetailItems = async (
  conn,
  table,
  idField,
  idPrefix,
  supervisi_id,
  items = [],
) => {
  await conn.query(
    `
      UPDATE ${table}
      SET
        is_active = 0
      WHERE supervisi_id = ?
    `,
    [supervisi_id],
  );

  if (!Array.isArray(items)) return;

  for (let i = 0; i < items.length; i++) {
    const uraian =
      typeof items[i] === "string" ? items[i] : items[i]?.uraian || "";

    if (!uraian?.trim()) continue;

    await conn.query(
      `
      INSERT INTO ${table} (
        ${idField},
        supervisi_id,
        urut,
        uraian,
        is_active
      )
      VALUES (
        ?, ?, ?, ?, 1
      )
      `,
      [generateId(idPrefix), supervisi_id, i + 1, uraian.trim()],
    );
  }
};

exports.saveHd = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_id, user_id } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await saveHd(conn, req.body, user_id);

    await conn.commit();

    res.json({
      success: true,
      message: "Data HD berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data HD",
    });
  } finally {
    conn.release();
  }
};

exports.saveIbs = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_id, user_id } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await saveIbs(conn, req.body, user_id);

    await conn.commit();

    res.json({
      success: true,
      message: "Data IBS berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data IBS",
    });
  } finally {
    conn.release();
  }
};

exports.saveMutu = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_id, user_id } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await saveMutu(conn, req.body, user_id);

    await conn.commit();

    res.json({
      success: true,
      message: "Data Mutu berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data Mutu",
    });
  } finally {
    conn.release();
  }
};

exports.saveKendala = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_id, user_id } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await saveKendala(conn, req.body, user_id);

    await conn.commit();

    res.json({
      success: true,
      message: "Data Kendala berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data Kendala",
    });
  } finally {
    conn.release();
  }
};

exports.saveEksekutif = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const { supervisi_id, user_id } = req.body;

    if (!supervisi_id) {
      return res.status(400).json({
        success: false,
        message: "supervisi_id wajib diisi",
      });
    }

    await conn.beginTransaction();

    await saveEksekutif(conn, req.body, user_id);

    await conn.commit();

    res.json({
      success: true,
      message: "Data Eksekutif berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data Eksekutif",
    });
  } finally {
    conn.release();
  }
};

// ==============================
// DELETE KEBUTUHAN DETAIL
// ==============================
exports.deleteKebutuhanDetail = async (req, res) => {
  try {
    const { detail_id } = req.params;

    await db2.promise().query(
      `
      UPDATE supervisi_kebutuhan_detail
      SET
        is_active = 0,
        updated_at = NOW()
      WHERE supervisi_kebutuhan_detail_id = ?
      `,
      [detail_id],
    );

    res.json({
      success: true,
      message: "Detail kebutuhan berhasil dihapus",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus detail kebutuhan",
    });
  }
};

// ==============================
// DELETE KENDALA DETAIL
// ==============================
exports.deleteKendalaDetail = async (req, res) => {
  try {
    const { detail_id } = req.params;

    await db2.promise().query(
      `
      UPDATE supervisi_kendala_detail
      SET
        is_active = 0,
        updated_at = NOW()
      WHERE supervisi_kendala_detail_id = ?
      `,
      [detail_id],
    );

    res.json({
      success: true,
      message: "Detail kendala berhasil dihapus",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus detail kendala",
    });
  }
};

// ==============================
// DELETE EKSEKUTIF DETAIL
// ==============================
exports.deleteEksekutifDetail = async (req, res) => {
  try {
    const { detail_id } = req.params;

    await db2.promise().query(
      `
      UPDATE supervisi_eksekutif_detail
      SET
        is_active = 0,
        updated_at = NOW()
      WHERE supervisi_eksekutif_detail_id = ?
      `,
      [detail_id],
    );

    res.json({
      success: true,
      message: "Detail eksekutif berhasil dihapus",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus detail eksekutif",
    });
  }
};
