const dbAvesina = require("../../db/connection-avesina");

const IGD_UNIT_ID = "RJ001";

exports.generate = async (periodeAwal, periodeAkhir) => {
  try {
    const conn = dbAvesina.promise();

    // 1. PASIEN BARU: Masuk ke IGD dalam periode aktif
    const [[pasienBaru]] = await conn.query(
      `
      SELECT COUNT(DISTINCT registry_id) AS total
      FROM unit_visit
      WHERE unit_id_to = ?
        AND unit_visit_dt BETWEEN ? AND ?
      `,
      [IGD_UNIT_ID, periodeAwal, periodeAkhir],
    );

    // 2. PASIEN LAMA (SISA HARI SEBELUMNYA):
    // Masuk IGD sebelum periodeAwal, tapi belum keluar/pindah saat periodeAwal dimulai.
    // Kita batasi scan mundur maksimal 3 hari (72 jam) sebelum periodeAwal agar query sangat cepat.
    const [[pasienLama]] = await conn.query(
      `
      SELECT COUNT(DISTINCT uv.registry_id) AS total
      FROM unit_visit uv
      LEFT JOIN room_mutation rm 
        ON uv.unit_visit_id = rm.unit_visit_id
      WHERE uv.unit_id_to = ?
        -- Batasi scan mundur 3 hari saja untuk mengamankan performa index
        AND uv.unit_visit_dt BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND ?
        -- Kondisi Belum Pulang & Belum Ranap saat periodeAwal dimulai:
        AND (uv.serviced_end IS NULL OR uv.serviced_end >= ?)
        AND (rm.mutation_dt IS NULL OR rm.mutation_dt >= ?)
      `,
      [IGD_UNIT_ID, periodeAwal, periodeAwal, periodeAwal, periodeAwal],
    );

    // 3. PASIEN KELUAR: Keluar dari IGD dalam periode aktif (service_sts = 5)
    const [[pasienKeluar]] = await conn.query(
      `
      SELECT COUNT(DISTINCT uv.registry_id) AS total
      FROM unit_visit uv
      WHERE uv.unit_id_from = ?
        AND uv.service_sts = 5
        AND uv.serviced_end BETWEEN ? AND ?
      `,
      [IGD_UNIT_ID, periodeAwal, periodeAkhir],
    );

    // 4. PASIEN RANAP: Pindah ke Rawat Inap dari IGD dalam periode aktif
    const [[pasienRanap]] = await conn.query(
      `
      SELECT COUNT(DISTINCT uv.registry_id) AS total
      FROM room_mutation rm
      JOIN unit_visit uv
        ON uv.unit_visit_id = rm.unit_visit_id
      WHERE uv.unit_id_from = ?
        AND rm.mutation_dt BETWEEN ? AND ?
      `,
      [IGD_UNIT_ID, periodeAwal, periodeAkhir],
    );

    // 5. MORTALITAS: Meninggal di IGD dalam periode aktif
    const [[mortalitas6Jam]] = await conn.query(
      `
      SELECT COUNT(*) AS total
      FROM registry r
      JOIN unit_visit uv
        ON uv.registry_id = r.registry_id
      WHERE uv.unit_id_to = ?
        AND r.dead_sts = 1
        AND r.dead_dt IS NOT NULL
        AND TIMESTAMPDIFF(HOUR, r.registry_dt, r.dead_dt) <= 6
        AND r.dead_dt BETWEEN ? AND ?
      `,
      [IGD_UNIT_ID, periodeAwal, periodeAkhir],
    );

    // Rumus Total & Sisa Pasien sesuai alur IGD
    const totalPasien =
      Number(pasienLama.total || 0) + Number(pasienBaru.total || 0);

    const pasienSisa =
      totalPasien -
      Number(pasienKeluar.total || 0) -
      Number(pasienRanap.total || 0);

    return {
      pasien_total: totalPasien,
      pasien_igd_lama: Number(pasienLama.total || 0),
      pasien_igd_baru: Number(pasienBaru.total || 0),
      pasien_keluar_igd: Number(pasienKeluar.total || 0),
      pasien_rawat_inap: Number(pasienRanap.total || 0),
      pasien_igd_sisa: pasienSisa < 0 ? 0 : pasienSisa,

      kematian_igd_6_jam: Number(mortalitas6Jam.total || 0),

      kematian_ranap_lt_24_jam: 0,
      kematian_ranap_gt_24_jam: 0,

      catatan: "",
    };
  } catch (err) {
    console.error("Gagal membuat data default IGD:", err);
    return {
      pasien_total: 0,
      pasien_igd_lama: 0,
      pasien_igd_baru: 0,
      pasien_keluar_igd: 0,
      pasien_rawat_inap: 0,
      pasien_igd_sisa: 0,
      kematian_igd_6_jam: 0,
      kematian_ranap_lt_24_jam: 0,
      kematian_ranap_gt_24_jam: 0,
      catatan: "",
    };
  }
};
