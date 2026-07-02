const db2 = require("../../db/connection-aset");
const { generateId } = require("../../utility/generateId");

exports.getData = async (req, res) => {
  try {
    const { direksi_issue_id } = req.params;

    const [rows] = await db2.promise().query(
      `
      SELECT *
      FROM direksi_plan
      WHERE direksi_issue_id = ?
        AND is_active = 1
      ORDER BY
        FIELD(
          status,
          'OPEN',
          'PROGRESS',
          'DONE',
          'CANCEL'
        ),
        created_at
      `,
      [direksi_issue_id],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data plan",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { direksi_plan_id } = req.params;

    const [rows] = await db2.promise().query(
      `
      SELECT *
      FROM direksi_plan
      WHERE direksi_plan_id = ?
      LIMIT 1
      `,
      [direksi_plan_id],
    );

    res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail plan",
    });
  }
};

exports.save = async (req, res) => {
  const conn = await db2.promise().getConnection();

  try {
    const {
      direksi_plan_id,
      direksi_issue_id,
      uraian_tindakan,
      pic,
      status,
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

    const planId = direksi_plan_id || generateId("PLAN");
    const normalizedTargetSelesai = normalizeDate(target_selesai);
    let normalizedTanggalSelesai = normalizeDate(tanggal_selesai);

    if (status === "DONE" && !normalizedTanggalSelesai) {
      normalizedTanggalSelesai = new Date().toISOString().slice(0, 10);
    }

    await conn.beginTransaction();

    const [check] = await conn.query(
      `
      SELECT direksi_plan_id
      FROM direksi_plan
      WHERE direksi_plan_id = ?
      `,
      [planId],
    );

    if (check.length > 0) {
      await conn.query(
        `
        UPDATE direksi_plan
        SET
          uraian_tindakan = ?,
          pic = ?,
          status = ?,
          target_selesai = ?,
          tanggal_selesai = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE direksi_plan_id = ?
        `,
        [
          uraian_tindakan,
          pic,
          status,
          normalizedTargetSelesai,
          normalizedTanggalSelesai,
          user_id,
          planId,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO direksi_plan (
          direksi_plan_id,
          direksi_issue_id,
          uraian_tindakan,
          pic,
          status,
          target_selesai,
          tanggal_selesai,
          created_by,
          created_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )
        `,
        [
          planId,
          direksi_issue_id,
          uraian_tindakan,
          pic,
          status || "OPEN",
          normalizedTargetSelesai,
          normalizedTanggalSelesai,
          user_id,
        ],
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Plan berhasil disimpan",
    });
  } catch (err) {
    await conn.rollback();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan plan",
    });
  } finally {
    conn.release();
  }
};

exports.deleteData = async (req, res) => {
  try {
    const { direksi_plan_id } = req.params;

    await db2.promise().query(
      `
      UPDATE direksi_plan
      SET
        is_active = 0,
        updated_at = NOW()
      WHERE direksi_plan_id = ?
      `,
      [direksi_plan_id],
    );

    res.json({
      success: true,
      message: "Plan berhasil dihapus",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus plan",
    });
  }
};
