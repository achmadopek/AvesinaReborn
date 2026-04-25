const db = require('../../db/connection-lokal'); // DB lokal
const db2 = require('../../db/connection-avesina'); // DB server

// ================================
// REKAPITULASI THP
// ================================
exports.generateRekapTHP = (req, res) => {
  const { date_range, employee_sts, penghasilan_id, groupUnit, peg_id } = req.query;

  if (!date_range && !employee_sts && !penghasilan_id && !groupUnit && !peg_id) {
    return res.status(400).json({ message: 'Salah satu filter wajib diisi' });
  }

  let wherePegawai = `WHERE 1=1`;
  const paramsPegawai = [];

  if (employee_sts) {
    wherePegawai += ` AND pg.employee_sts IN (?)`;
    paramsPegawai.push(employee_sts.split(','));
  }

  if (peg_id) {
    wherePegawai += ` AND pg.id = ?`;
    paramsPegawai.push(peg_id);
  }

  const pegawaiMutasiQuery = `
    SELECT
      pg.id AS peg_id,
      pg.employee_nm,
      pg.employee_sts,
      mu.unit_id
    FROM sdm_pegawai pg
    JOIN sdm_mutasi mu
      ON mu.peg_id = pg.id
      AND mu.mutation_dt = (
        SELECT MAX(m2.mutation_dt)
        FROM sdm_mutasi m2
        WHERE m2.peg_id = pg.id
      )
    ${wherePegawai}
  `;

  db.query(pegawaiMutasiQuery, paramsPegawai, (err, pegawaiList) => {
    if (err) {
      console.error("Gagal ambil data pegawai:", err);
      return res.status(500).json({ message: "Gagal ambil data pegawai" });
    }

    if (pegawaiList.length === 0) {
      return res.json([]);
    }

    const pegIds = pegawaiList.map((p) => p.peg_id);

    // ================================
    // Ambil semua penghasilan (detail per komponen)
    // ================================
    let wherePh = `WHERE ph.is_locked = 1 AND ph.peg_id IN (?)`;
    const paramsPh = [pegIds];

    if (penghasilan_id) {
      wherePh += ` AND ph.penghasilan_id = ?`;
      paramsPh.push(penghasilan_id);
    }

    if (date_range) {
      const [start, end] = date_range.split(",");
      wherePh += ` AND ph.periode BETWEEN ? AND ?`;
      paramsPh.push(start, end);
    }

    const penghasilanQuery = `
      SELECT ph.id AS penghasilan_pegawai_id, ph.peg_id, ph.penghasilan_id, m.penghasilan_code, ph.nilai
      FROM thp_penghasilan_pegawai ph
      JOIN thp_komponen_penghasilan m ON m.id = ph.penghasilan_id
      ${wherePh}
    `;

    db.query(penghasilanQuery, paramsPh, (err, penghasilanRows) => {
      if (err) {
        console.error("Gagal ambil penghasilan:", err);
        return res.status(500).json({ message: "Gagal ambil penghasilan" });
      }

      const phIdList = penghasilanRows.map(r => r.penghasilan_pegawai_id);

      // ================================
      // Ambil semua potongan (detail per komponen)
      // ================================
      let potonganQuery = `
        SELECT po.peg_id, po.penghasilan_pegawai_id, po.potongan_id, kp.potongan_code, po.nilai
        FROM thp_potongan_pegawai po
        LEFT JOIN thp_komponen_potongan kp ON po.potongan_id = kp.id
        WHERE po.is_locked = 1
      `;
      const paramsPot = [];

      if (phIdList.length > 0) {
        potonganQuery += ` AND po.penghasilan_pegawai_id IN (?)`;
        paramsPot.push(phIdList);
      } else {
        potonganQuery += ` AND 1=0`;
      }

      db.query(potonganQuery, paramsPot, (err, potonganRows) => {
        if (err) {
          console.error("Gagal ambil potongan:", err);
          return res.status(500).json({ message: "Gagal ambil potongan" });
        }

        // Mapping potongan per pegawai
        const potMap = potonganRows.reduce((acc, row) => {
          if (!acc[row.peg_id]) acc[row.peg_id] = [];
          acc[row.peg_id].push({
            penghasilan_pegawai_id: row.penghasilan_pegawai_id,
            potongan_code: row.potongan_code,
            nilai: row.nilai
          });
          return acc;
        }, {});

        // Mapping penghasilan per pegawai
        const phMap = penghasilanRows.reduce((acc, row) => {
          if (!acc[row.peg_id]) acc[row.peg_id] = [];
          acc[row.peg_id].push({
            penghasilan_pegawai_id: row.penghasilan_pegawai_id,
            penghasilan_id: row.penghasilan_id,
            penghasilan_code: row.penghasilan_code,
            nilai: row.nilai
          });
          return acc;
        }, {});

        // ================================
        // Ambil info unit & group
        // ================================
        const unitIds = [...new Set(pegawaiList.map((p) => p.unit_id))];

        db2.query(
          `
          SELECT su.srvc_unit_id, su.srvc_unit_nm, ug.unit_group_id, ug.unit_group_name
          FROM service_unit su
          JOIN unit_group ug ON su.unit_group_id = ug.unit_group_id
          WHERE su.srvc_unit_id IN (?)
        `,
          [unitIds],
          (err, unitInfo) => {
            if (err) {
              console.error("Gagal ambil data unit:", err);
              return res.status(500).json({ message: "Gagal ambil data unit" });
            }

            const unitMap = unitInfo.reduce((acc, row) => {
              acc[row.srvc_unit_id] = row;
              return acc;
            }, {});

            // ================================
            // Gabung hasil per pegawai (detail)
            // ================================
            let hasilGabung = pegawaiList.map((p) => {
              const unitData = unitMap[p.unit_id] || {};
              const penghasilan = phMap[p.peg_id] || [];
              const potongan = potMap[p.peg_id] || [];
              const total_penghasilan = penghasilan.reduce((a, b) => a + b.nilai, 0);
              const total_potongan = potongan.reduce((a, b) => a + b.nilai, 0);

              return {
                peg_id: p.peg_id,
                employee_nm: p.employee_nm,
                employee_sts: p.employee_sts,
                unit_id: p.unit_id,
                unit_nm: unitData.srvc_unit_nm || "",
                unit_group_id: unitData.unit_group_id || "",
                unit_group_name: unitData.unit_group_name || "",
                total_penghasilan,
                total_potongan,
                thp: total_penghasilan - total_potongan,
              };
            });

            if (groupUnit) {
              const [group, unit] = groupUnit.split(",");
              hasilGabung = hasilGabung.filter((item) => {
                const matchGroup = group ? item.unit_group_id === group : true;
                const matchUnit = unit && unit !== "null" ? item.unit_id === unit : true;
                return matchGroup && matchUnit;
              });
            }

            res.json(hasilGabung);
          }
        );
      });
    });
  });
};


// ================================
// RINCIAN THP
// ================================
exports.generateRinciTHP = (req, res) => {
  const { date_range, employee_sts, penghasilan_id, groupUnit, peg_id } = req.query;

  if (!date_range && !employee_sts && !penghasilan_id && !groupUnit && !peg_id) {
    return res.status(400).json({ message: 'Salah satu filter wajib diisi' });
  }

  let wherePegawai = `WHERE 1=1`;
  const paramsPegawai = [];

  if (employee_sts) {
    wherePegawai += ` AND pg.employee_sts IN (?)`;
    paramsPegawai.push(employee_sts.split(','));
  }

  if (peg_id) {
    wherePegawai += ` AND pg.id = ?`;
    paramsPegawai.push(peg_id);
  }

  const pegawaiMutasiQuery = `
    SELECT
      pg.id AS peg_id,
      pg.employee_nm,
      pg.employee_sts,
      mu.unit_id
    FROM sdm_pegawai pg
    JOIN sdm_mutasi mu
      ON mu.peg_id = pg.id
      AND mu.mutation_dt = (
        SELECT MAX(m2.mutation_dt)
        FROM sdm_mutasi m2
        WHERE m2.peg_id = pg.id
      )
    ${wherePegawai}
  `;

  db.query(pegawaiMutasiQuery, paramsPegawai, (err, pegawaiList) => {
    if (err) {
      console.error("Gagal ambil data pegawai:", err);
      return res.status(500).json({ message: "Gagal ambil data pegawai" });
    }

    if (pegawaiList.length === 0) {
      return res.json([]);
    }

    const pegIds = pegawaiList.map((p) => p.peg_id);

    // ================================
    // Ambil semua penghasilan (detail per komponen)
    // ================================
    let wherePh = `WHERE ph.is_locked = 1 AND ph.peg_id IN (?)`;
    const paramsPh = [pegIds];

    if (penghasilan_id) {
      wherePh += ` AND ph.penghasilan_id = ?`;
      paramsPh.push(penghasilan_id);
    }

    if (date_range) {
      const [start, end] = date_range.split(",");
      wherePh += ` AND ph.periode BETWEEN ? AND ?`;
      paramsPh.push(start, end);
    }

    const penghasilanQuery = `
      SELECT ph.id AS penghasilan_pegawai_id, ph.peg_id, ph.penghasilan_id, m.penghasilan_code, ph.nilai
      FROM thp_penghasilan_pegawai ph
      JOIN thp_komponen_penghasilan m ON m.id = ph.penghasilan_id
      ${wherePh}
    `;

    db.query(penghasilanQuery, paramsPh, (err, penghasilanRows) => {
      if (err) {
        console.error("Gagal ambil penghasilan:", err);
        return res.status(500).json({ message: "Gagal ambil penghasilan" });
      }

      const phIdList = penghasilanRows.map(r => r.penghasilan_pegawai_id);

      // ================================
      // Ambil semua potongan (detail per komponen)
      // ================================
      let potonganQuery = `
        SELECT po.peg_id, po.penghasilan_pegawai_id, po.potongan_id, kp.potongan_code, po.nilai
        FROM thp_potongan_pegawai po
        LEFT JOIN thp_komponen_potongan kp ON po.potongan_id = kp.id
        WHERE po.is_locked = 1
      `;
      const paramsPot = [];

      if (phIdList.length > 0) {
        potonganQuery += ` AND po.penghasilan_pegawai_id IN (?)`;
        paramsPot.push(phIdList);
      } else {
        potonganQuery += ` AND 1=0`;
      }

      db.query(potonganQuery, paramsPot, (err, potonganRows) => {
        if (err) {
          console.error("Gagal ambil potongan:", err);
          return res.status(500).json({ message: "Gagal ambil potongan" });
        }

        // Mapping potongan per pegawai
        const potMap = potonganRows.reduce((acc, row) => {
          if (!acc[row.peg_id]) acc[row.peg_id] = [];
          acc[row.peg_id].push({
            penghasilan_pegawai_id: row.penghasilan_pegawai_id,
            potongan_code: row.potongan_code,
            nilai: row.nilai
          });
          return acc;
        }, {});

        // Mapping penghasilan per pegawai
        const phMap = penghasilanRows.reduce((acc, row) => {
          if (!acc[row.peg_id]) acc[row.peg_id] = [];
          acc[row.peg_id].push({
            penghasilan_pegawai_id: row.penghasilan_pegawai_id,
            penghasilan_id: row.penghasilan_id,
            penghasilan_code: row.penghasilan_code,
            nilai: row.nilai
          });
          return acc;
        }, {});

        // ================================
        // Ambil info unit & group
        // ================================
        const unitIds = [...new Set(pegawaiList.map((p) => p.unit_id))];

        db2.query(
          `
          SELECT su.srvc_unit_id, su.srvc_unit_nm, ug.unit_group_id, ug.unit_group_name
          FROM service_unit su
          JOIN unit_group ug ON su.unit_group_id = ug.unit_group_id
          WHERE su.srvc_unit_id IN (?)
        `,
          [unitIds],
          (err, unitInfo) => {
            if (err) {
              console.error("Gagal ambil data unit:", err);
              return res.status(500).json({ message: "Gagal ambil data unit" });
            }

            const unitMap = unitInfo.reduce((acc, row) => {
              acc[row.srvc_unit_id] = row;
              return acc;
            }, {});

            // ================================
            // Gabung hasil per pegawai (detail)
            // ================================
            let hasilGabung = pegawaiList.map((p) => {
              const unitData = unitMap[p.unit_id] || {};
              const penghasilan = phMap[p.peg_id] || [];
              const potongan = potMap[p.peg_id] || [];
              const total_penghasilan = penghasilan.reduce((a, b) => a + b.nilai, 0);
              const total_potongan = potongan.reduce((a, b) => a + b.nilai, 0);

              return {
                peg_id: p.peg_id,
                employee_nm: p.employee_nm,
                employee_sts: p.employee_sts,
                unit_id: p.unit_id,
                unit_nm: unitData.srvc_unit_nm || "",
                unit_group_id: unitData.unit_group_id || "",
                unit_group_name: unitData.unit_group_name || "",
                rincian_penghasilan: penghasilan,
                rincian_potongan: potongan,
                total_penghasilan,
                total_potongan,
                thp: total_penghasilan - total_potongan,
              };
            });

            if (groupUnit) {
              const [group, unit] = groupUnit.split(",");
              hasilGabung = hasilGabung.filter((item) => {
                const matchGroup = group ? item.unit_group_id === group : true;
                const matchUnit = unit && unit !== "null" ? item.unit_id === unit : true;
                return matchGroup && matchUnit;
              });
            }

            res.json(hasilGabung);
          }
        );
      });
    });
  });
};

/* ============================================= */
// Ambil semua Group
/* ============================================= */
exports.getGroup = (req, res) => {
  const query = `
    SELECT unit_group_id, unit_group_code, unit_group_name
    FROM unit_group
    ORDER BY unit_group_code
  `;

  db2.query(query, (err, results) => {
    if (err) {
      console.error('Gagal ambil group:', err);
      return res.status(500).json({ message: 'Gagal ambil group' });
    }

    res.json(results); // langsung kirim array group
  });
};

// Ambil semua Unit berdasarkan Group
exports.getUnitByGroup = (req, res) => {
  const { group } = req.query;

  if (!group) {
    return res.status(400).json({ message: 'group wajib diisi' });
  }

  const query = `
    SELECT srvc_unit_id, service_unit_code, srvc_unit_nm
    FROM service_unit
    WHERE unit_group_id = ? AND srvc_unit_id IS NOT NULL
    ORDER BY service_unit_code
  `;

  db2.query(query, [group], (err, results) => {
    if (err) {
      console.error('Gagal ambil unit:', err);
      return res.status(500).json({ message: 'Gagal ambil unit' });
    }

    res.json(results); // langsung kirim array unit
  });
};
