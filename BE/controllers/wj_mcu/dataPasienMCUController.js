const dbA = require("../../db/connection-avesina");
const dbL = require("../../db/connection-lokal");

// GET data pasien MCU per tanggal + status mirror
exports.getPasienMCU = async (req, res) => {
  const { tgl } = req.query;

  if (!tgl) {
    return res.status(400).json({
      success: false,
      message: "Tanggal Periksa wajib diisi",
    });
  }

  try {
    // =========================
    // 1️⃣ DATA MCU DARI AVESINA
    // =========================
    const [rows] = await dbA.promise().query(
      `
      SELECT 
        p.mr_code AS nrm,
        p.id_number AS nik,
        p.patient_nm AS nama,
        p.birth_dt AS tgl_lahir,
        p.AGE AS umur,
        p.address AS alamat,
        r.registry_id AS no_daftar,
        DATE_FORMAT(r.registry_dt, '%Y-%m-%d %H:%i:%s') AS tgl_periksa,
        uv.unit_id_to AS poli
      FROM registry r
      JOIN patient p ON p.mr_id = r.mr_id
      JOIN unit_visit uv ON r.registry_id = uv.registry_id
      WHERE uv.unit_id_to = 'MCU'
        AND r.registry_dt >= ?
        AND r.registry_dt < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY r.registry_dt ASC
      `,
      [tgl, tgl]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // =========================
    // 2️⃣ DATA MIRROR (DB LOKAL)
    // =========================
    const registryIds = rows.map(r => r.no_daftar);

    const [mirrors] = await dbL.promise().query(
      `
      SELECT
        registry_id,
        status_mcu,
        finalized_at,
        printed_at
      FROM mcu_mirror
      WHERE registry_id IN (?)
      `,
      [registryIds]
    );

    const mirrorMap = new Map();
    mirrors.forEach(m => {
      mirrorMap.set(m.registry_id, m);
    });

    // =========================
    // 3️⃣ MERGE + STATUS LABEL
    // =========================
    const STATUS_MAP = {
      0: "BELUM",
      1: "FINAL",
      2: "CETAK",
      3: "BATAL",
    };

    const result = rows.map(r => {
      const mirror = mirrorMap.get(r.no_daftar);

      // BELUM = tidak ada mirror
      if (!mirror) {
        return {
          ...r,
          status_mcu: null,
          status_label: "BELUM",
          finalized_at: null,
          printed_at: null,
        };
      }

      // ADA mirror
      const statusMap = {
        0: "DRAFT",
        1: "FINAL",
      };

      return {
        ...r,
        status_mcu: mirror.status_mcu,
        status_label: statusMap[mirror.status_mcu] || "UNKNOWN",
        finalized_at: mirror.finalized_at,
        printed_at: mirror.printed_at,
      };
    });

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("getPasienMCU error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
