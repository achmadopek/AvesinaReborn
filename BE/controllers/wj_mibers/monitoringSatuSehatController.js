const satuSehatService = require("./satuSehatService");

exports.getData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // data utama (avesina)
    const rowsLab = await satuSehatService.getLabByDate(startDate, endDate);

    // mapping SNOMED
    const mapping = await satuSehatService.getSatuSehatMapping();

    // ambil registry_id unik
    const registryIds = [...new Set(rowsLab.map((r) => r.registry_id))];

    // ambil data satusehat
    const satusehatMap =
      await satuSehatService.getSatusehatByRegistryIds(registryIds);

    // merge semua
    const result = rowsLab.map((row) => {
      const m = mapping.get(String(row.lab_srvc_id));
      const s = satusehatMap.get(row.registry_id);

      return {
        ...row,

        // mapping SNOMED
        snomed_code: m?.snomed_code ?? null,
        snomed_display: m?.snomed_display ?? null,

        // DATA SATUSEHAT
        patient_ihs_number: s?.patient_ihs_number ?? null,
        performer_ihs_number: s?.performer_ihs_number ?? null,

        request_service_uuid: s?.request_service_uuid ?? null,
        speciment_uuid: s?.speciment_uuid ?? null,
        observation_uuid: s?.observation_uuid ?? null,

        // STATUS (simple logic)
        status_kirim: s?.observation_uuid
          ? "success"
          : s?.request_service_uuid
            ? "partial"
            : "pending",
      };
    });

    res.json({
      data: result,
      totalPages: 1,
      totalRows: result.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};
