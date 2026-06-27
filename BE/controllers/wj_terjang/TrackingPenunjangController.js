const db = require("../../db/connection-avesina");

const normalizeDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

exports.getData = async (req, res) => {
  try {
    const { tgl = "", role = "", employee_id = "" } = req.query;
    const requests = readRequests()
      .filter((item) => {
        const targetDate = normalizeDate(tgl);
        if (!targetDate) return true;
        return normalizeDate(item.request_dt || item.created_at) === targetDate;
      })
      .sort(
        (a, b) =>
          new Date(b.request_dt || b.created_at) -
          new Date(a.request_dt || a.created_at),
      );

    return res.json({
      success: true,
      data: requests,
      currentPage: 1,
      totalPages: 1,
      totalRows: requests.length,
      meta: {
        tgl,
        role,
        employee_id,
        module: "WJ-TERJANG",
      },
    });
  } catch (err) {
    console.error("TrackingPenunjangController.getData", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.requestPenunjang = async (req, res) => {
  try {
    const payload = req.body || {};
    const requestType = (
      payload.request_type ||
      payload.jenis ||
      ""
    ).toLowerCase();
    const patientName = (payload.patient_name || payload.pasien || "").trim();

    if (!requestType || !patientName) {
      return res.status(400).json({
        success: false,
        message: "Jenis permintaan dan nama pasien wajib diisi",
      });
    }

    const request = {
      request_id: `TERJANG-${Date.now()}`,
      request_type: requestType,
      request_dt: new Date().toISOString(),
      patient_name: patientName,
      mr_code: payload.mr_code || "",
      unit_origin: payload.unit_origin || "",
      physician: payload.physician || "",
      diagnosis: payload.diagnosis || "",
      request_note: payload.request_note || "",
      cito_sts: payload.cito_sts || "N",
      status: "requested",
      source: "form",
    };

    const requests = readRequests();
    requests.unshift(request);
    writeRequests(requests);

    return res.json({
      success: true,
      message: "Permintaan penunjang berhasil disimpan",
      data: request,
    });
  } catch (err) {
    console.error("TrackingPenunjangController.requestPenunjang", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const tgl = normalizeDate(
      req.query.tgl || new Date().toISOString().split("T")[0],
    );
    const requests = readRequests().filter((item) => {
      if (!tgl) return true;
      return normalizeDate(item.request_dt || item.created_at) === tgl;
    });

    const totalXRay = requests.filter(
      (item) => item.request_type === "xray",
    ).length;
    const totalLab = requests.filter(
      (item) => item.request_type === "lab",
    ).length;
    const pending = requests.filter(
      (item) => item.status === "requested",
    ).length;

    return res.json({
      success: true,
      summary: {
        totalXRay,
        totalLab,
        pending,
      },
    });
  } catch (err) {
    console.error("TrackingPenunjangController.getSummary", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
