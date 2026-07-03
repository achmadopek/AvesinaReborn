const db2 = require("../../db/connection-aset");
const dbAvesina = require("../../db/connection-avesina");

exports.getHomeDashboard = async (req, res) => {
  try {
    // =====================================================
    // AMBIL SUPERVISI TERBARU
    // =====================================================

    const [supervisiRows] = await db2.promise().query(`
      SELECT *
      FROM supervisi
      WHERE is_active = 1
      ORDER BY tanggal_supervisi DESC
      LIMIT 1
    `);

    const supervisi = supervisiRows[0];

    if (!supervisi) {
      return res.json({
        success: true,
        data: {
          supervisi: null,
          igd: null,
          hd: null,
          ibs: null,
          mutu: null,
          kendala: null,
          eksekutif: null,
          fokusDireksi: [],
          rencanaAksi: [],
        },
      });
    }

    const supervisiId = supervisi.supervisi_id;

    // =====================================================
    // DATA SUPERVISI
    // =====================================================

    const [igdRows, hdRows, ibsRows, mutuRows, kendalaRows, eksekutifRows] =
      await Promise.all([
        db2.promise().query(
          `
          SELECT *
          FROM supervisi_igd
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT *
          FROM supervisi_hd
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT *
          FROM supervisi_ibs
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT *
          FROM supervisi_mutu
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT *
          FROM supervisi_kendala
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT *
          FROM supervisi_eksekutif
          WHERE supervisi_id = ?
          LIMIT 1
        `,
          [supervisiId],
        ),
      ]);

    // =====================================================
    // FOKUS DIREKSI
    // =====================================================

    const [fokusDireksi] = await db2.promise().query(`
      SELECT
        direksi_issue_id,
        judul,
        deskripsi,
        prioritas,
        status,
        pic,
        target_selesai
      FROM direksi_issue
      WHERE
        is_active = 1
        AND is_fokus_hari_ini = 1
        AND status <> 'DONE'
      ORDER BY
        FIELD(
          prioritas,
          'KRITIS',
          'TINGGI',
          'SEDANG',
          'RENDAH'
        ),
        created_at DESC
    `);

    // =====================================================
    // DETAIL KEBUTUHAN, KENDALA, EKSEKUTIF
    // =====================================================
    const [kebutuhanDetailRows, kendalaDetailRows, eksekutifDetailRows] =
      await Promise.all([
        db2.promise().query(
          `
        SELECT uraian
          FROM supervisi_kebutuhan_detail
          WHERE supervisi_id = ?
            AND is_active = 1
          ORDER BY urut
      `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT uraian
            FROM supervisi_kendala_detail
            WHERE supervisi_id = ?
              AND is_active = 1
            ORDER BY urut
        `,
          [supervisiId],
        ),

        db2.promise().query(
          `
          SELECT uraian
            FROM supervisi_eksekutif_detail
            WHERE supervisi_id = ?
              AND is_active = 1
            ORDER BY urut
        `,
          [supervisiId],
        ),
      ]);

    // =====================================================
    // RENCANA AKSI CEPAT
    // =====================================================

    const [rencanaAksi] = await db2.promise().query(`
      SELECT
        dp.*,
        di.judul AS issue_judul,
        di.prioritas
      FROM direksi_plan dp
      INNER JOIN direksi_issue di
        ON di.direksi_issue_id = dp.direksi_issue_id
      WHERE
        dp.is_active = 1
        AND di.is_active = 1
      ORDER BY
        FIELD(
          dp.status,
          'OPEN',
          'PROGRESS',
          'DONE',
          'CANCEL'
        ),
        dp.target_selesai ASC,
        dp.created_at ASC
    `);

    // =====================================================
    // APPLICARE & BOR SUMMARY
    // =====================================================

    const [applicareSummaryRows] = await dbAvesina.promise().query(`
      SELECT
        IFNULL(SUM(kapasitas), 0) AS total_kapasitas,
        IFNULL(SUM(tersedia), 0) AS total_tersedia,
        IFNULL(SUM(kapasitas - tersedia), 0) AS total_terisi,
        COUNT(*) AS total_unit,
        ROUND(
          IFNULL(SUM(kapasitas - tersedia) / NULLIF(SUM(kapasitas), 0) * 100, 0),
          2
        ) AS bor
      FROM applicare
    `);

    const [applicareRows] = await dbAvesina.promise().query(`
      SELECT
        koderuang,
        namaruang,
        kodekelas,
        kapasitas,
        tersedia,
        (kapasitas - tersedia) AS terisi,
        lastupdate,
        ROUND(
            IFNULL((kapasitas - tersedia) / NULLIF(kapasitas, 0) * 100, 0),
            2
        ) AS bor,
        CASE
            WHEN ((kapasitas - tersedia) / NULLIF(kapasitas, 0) * 100) < 80 THEN 'Aman'
            WHEN ((kapasitas - tersedia) / NULLIF(kapasitas, 0) * 100) <= 90 THEN 'Waspada'
            WHEN ((kapasitas - tersedia) / NULLIF(kapasitas, 0) * 100) <= 100 THEN 'Kritis'
            ELSE 'Overload'
        END AS bor_status
    FROM applicare
    ORDER BY kodekelas, namaruang
    `);

    const applicareSummary = applicareSummaryRows[0] || {
      total_kapasitas: 0,
      total_tersedia: 0,
      total_terisi: 0,
      total_unit: 0,
      bor: 0,
    };

    const [rawatJalanRows] = await dbAvesina.promise().query(`
      SELECT
        COUNT(DISTINCT r.registry_id) AS kunjunganRajal
      FROM registry r
      JOIN unit_visit uv ON uv.registry_id = r.registry_id
      WHERE r.registry_dt BETWEEN CONCAT(CURDATE(), ' 00:00:00')
        AND CONCAT(CURDATE(), ' 23:59:59')
        AND r.in_out_sts = 'O'
        AND uv.unit_id_to = 'RJ012'
    `);

    const [igdRowsCount] = await dbAvesina.promise().query(`
      SELECT
        COUNT(DISTINCT r.registry_id) AS kunjunganIGD
      FROM registry r
      JOIN unit_visit uv ON uv.registry_id = r.registry_id
      WHERE r.registry_dt BETWEEN CONCAT(CURDATE(), ' 00:00:00')
        AND CONCAT(CURDATE(), ' 23:59:59')
        AND uv.unit_id_to = 'RJ001'
    `);

    const rawatJalanSummary = rawatJalanRows[0] || { kunjunganRajal: 0 };
    const igdSummaryCount = igdRowsCount[0] || { kunjunganIGD: 0 };

    const dashboardSummary = {
      kunjunganRajal: Number(rawatJalanSummary.kunjunganRajal || 0),
      kunjunganIGD: Number(igdSummaryCount.kunjunganIGD || 0),
      pasienRawatInap: Number(applicareSummary.total_terisi || 0),
      ttTersedia: Number(applicareSummary.total_tersedia || 0),
      distribusiTT: Number(applicareSummary.total_unit || 0),
      rajalMJKN: 0,
      rajalOnsite: 0,
      igdMRS: 0,
      igdSisa: 0,
      inapAdmisi: 0,
      inapKRS: 0,
    };

    const kebutuhanDetail = kebutuhanDetailRows[0] || [];
    const kendalaDetail = kendalaDetailRows[0] || [];
    const eksekutifDetail = eksekutifDetailRows[0] || [];

    // =====================================================
    // RESPONSE
    // =====================================================

    res.json({
      success: true,
      data: {
        supervisi,

        igd: igdRows[0][0] || null,
        hd: hdRows[0][0] || null,
        ibs: ibsRows[0][0] || null,
        mutu: mutuRows[0][0] || null,
        kendala: {
          kebutuhan_detail: kebutuhanDetail,
          kendala_detail: kendalaDetail,
        },

        eksekutif: {
          detail: eksekutifDetail,
        },

        applicareSummary,
        applicareList: applicareRows || [],

        kunjunganRajal: dashboardSummary.kunjunganRajal,
        kunjunganIGD: dashboardSummary.kunjunganIGD,
        pasienRawatInap: dashboardSummary.pasienRawatInap,
        ttTersedia: dashboardSummary.ttTersedia,
        distribusiTT: dashboardSummary.distribusiTT,
        rajalMJKN: dashboardSummary.rajalMJKN,
        rajalOnsite: dashboardSummary.rajalOnsite,
        igdMRS: dashboardSummary.igdMRS,
        igdSisa: dashboardSummary.igdSisa,
        inapAdmisi: dashboardSummary.inapAdmisi,
        inapKRS: dashboardSummary.inapKRS,

        fokusDireksi,
        rencanaAksi,
      },
    });
  } catch (err) {
    console.error("Dashboard Home Error :", err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard supervisi",
    });
  }
};
