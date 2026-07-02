const db2 = require("../../db/connection-aset");
const { generateId } = require("../../utility/generateId");

exports.getData = async (req, res) => {
  try {
    const [rows] = await db2.promise().query(`
      SELECT
        di.*,
        COUNT(dp.direksi_plan_id) AS total_plan
      FROM direksi_issue di
      LEFT JOIN direksi_plan dp
        ON di.direksi_issue_id = dp.direksi_issue_id
        AND dp.is_active = 1
      WHERE di.is_active = 1
      GROUP BY di.direksi_issue_id
      ORDER BY
        FIELD(
          di.prioritas,
          'KRITIS',
          'TINGGI',
          'SEDANG',
          'RENDAH'
        ),
        di.created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data issue",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { direksi_issue_id } = req.params;

    const [issue] = await db2.promise().query(
      `
      SELECT *
      FROM direksi_issue
      WHERE direksi_issue_id = ?
      LIMIT 1
      `,
      [direksi_issue_id],
    );

    const [plans] = await db2.promise().query(
      `
      SELECT *
      FROM direksi_plan
      WHERE direksi_issue_id = ?
        AND is_active = 1
      ORDER BY created_at
      `,
      [direksi_issue_id],
    );

    res.json({
      success: true,
      data: {
        issue: issue[0] || null,
        plans,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail issue",
    });
  }
};

exports.save = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const {
      direksi_issue_id,
      judul,
      deskripsi,
      prioritas,
      status,
      is_fokus_hari_ini,
      pic,
      tanggal_mulai,
      target_selesai,
      tanggal_selesai,
      user_id,
    } = req.body;

    const normalizeDate = (value) => {
      if (!value) return null;

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;

      return parsed.toISOString().slice(0, 10);
    };

    const issueId = direksi_issue_id || generateId("ISSUE");

    const normalizedTanggalMulai = normalizeDate(tanggal_mulai);
    const normalizedTargetSelesai = normalizeDate(target_selesai);
    let normalizedTanggalSelesai = normalizeDate(tanggal_selesai);

    if (status === "DONE" && !normalizedTanggalSelesai) {
      normalizedTanggalSelesai = new Date().toISOString().slice(0, 10);
    }

    await conn.beginTransaction();

    const [check] = await conn.query(
      `
      SELECT direksi_issue_id
      FROM direksi_issue
      WHERE direksi_issue_id = ?
      `,
      [issueId],
    );

    if (check.length > 0) {
      await conn.query(
        `
        UPDATE direksi_issue
        SET
          judul = ?,
          deskripsi = ?,
          prioritas = ?,
          status = ?,
          is_fokus_hari_ini = ?,
          pic = ?,
          tanggal_mulai = ?,
          target_selesai = ?,
          tanggal_selesai = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE direksi_issue_id = ?
        `,
        [
          judul,
          deskripsi,
          prioritas,
          status,
          is_fokus_hari_ini,
          pic,
          normalizedTanggalMulai,
          normalizedTargetSelesai,
          normalizedTanggalSelesai,
          user_id,
          issueId,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO direksi_issue (
          direksi_issue_id,
          judul,
          deskripsi,
          prioritas,
          status,
          is_fokus_hari_ini,
          pic,
          tanggal_mulai,
          target_selesai,
          tanggal_selesai,
          created_by,
          created_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )
        `,
        [
          issueId,
          judul,
          deskripsi,
          prioritas || "SEDANG",
          status || "OPEN",
          is_fokus_hari_ini || 0,
          pic,
          normalizedTanggalMulai,
          normalizedTargetSelesai,
          normalizedTanggalSelesai,
          user_id,
        ],
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Issue berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan issue",
    });
  } finally {
    conn.release();
  }
};

exports.deleteData = async (req, res) => {
  try {
    const { direksi_issue_id } = req.params;

    await db2.promise().query(
      `
      UPDATE direksi_issue
      SET
        is_active = 0,
        updated_at = NOW()
      WHERE direksi_issue_id = ?
      `,
      [direksi_issue_id],
    );

    res.json({
      success: true,
      message: "Issue berhasil dihapus",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus issue",
    });
  }
};
