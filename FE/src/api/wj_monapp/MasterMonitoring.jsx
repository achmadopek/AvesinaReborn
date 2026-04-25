import API from "../axiosInstance";

// Ambil Aplicares dengan pagination (server-side)
export const fetchPaginatedDataMonitoringAplicares = async (
  page = 1,
  limit = 10
) => {
  const res = await API.get("/api/mibers/MonitoringAplicares", {
    params: {
      page,
      limit,
    },
  });
  return res.data;
};

// Ambil Icare dengan pagination (server-side)
export const fetchPaginatedDataMonitoringIcare = async ({
  page = 1,
  limit = 10,
  startDate = "",
  endDate = "",
  poli = "",
  search = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringIcare", {
    params: { page, limit, startDate, endDate, poli, search },
  });
  return res.data;
};

export const fetchIcareDailySummary = async ({
  startDate,
  endDate,
  poli
}) => {
  const res = await API.get("/api/mibers/MonitoringIcare/summary", {
    params: { startDate, endDate, poli }
  });
  return res.data;
};

export const exportMonitoringIcareToExcel = async ({
  startDate = "",
  endDate = "",
  poli = "",
  search = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringIcare/export", {
    params: { startDate, endDate, poli, search },
    responseType: "blob", // penting!
  });
  return res;
};

// Ambil Icare dengan pagination (server-side)
export const fetchPaginatedDataMonitoringTHP = async ({
  page = 1,
  limit = 10,
  startDate = "",
  endDate = "",
  peg_id,          // optional
  employee_sts     // optional
}) => {
  const res = await API.get("/api/mibers/MonitoringTHP", {
    params: { page, limit, startDate, endDate, peg_id, employee_sts },
  });
  return res.data;
};

export const exportMonitoringTHP = async ({
  startDate = "",
  endDate = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringIcare/export", {
    params: { startDate, endDate },
    responseType: "blob", // penting!
  });
  return res;
};

// Ambil Antrian dengan pagination (server-side)
export const fetchPaginatedDataMonitoringAntrian = async ({
  page = 1,
  limit = 10,
  startDate = "",
  endDate = "",
  poli = "",
  search = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringAntrian", {
    params: { page, limit, startDate, endDate, poli, search },
  });
  return res.data;
};

export const fetchMonitoringAntrianSummary = async ({
  startDate = "",
  endDate = "",
  poli = "",
  search = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringAntrian/summary", {
    params: { startDate, endDate, poli, search },
  });
  return res.data;
};

export const fetchMonitoringDisplaySummary = async ({
  date = "",
  offlineThreshold = 20,
} = {}) => {
  const res = await API.get("/api/mibers/MonitoringDisplay/summary", {
    params: {
      date,
      offlineThreshold,
    },
  });

  return res.data;
};

export const fetchMonitoringDisplayMonthly = async ({
  year,
  month,
  offlineThreshold
}) => {
  const res = await API.get(
    "/api/mibers/MonitoringDisplay/monthly",
    { params: { year, month, offlineThreshold } }
  );
  return res.data;
};


// Ambil SatuSehat Specimen dengan pagination (server-side)
export const fetchPaginatedDataMonitoringSatuSehat = async ({
  page = 1,
  limit = 10,
  startDate = "",
  endDate = "",
}) => {
  const res = await API.get("/api/mibers/MonitoringSatuSehat", {
    params: { page, limit, startDate, endDate },
  });
  return res.data;
};

// Kirim simulasi (server-side)
export const kirimSpecimenSatuSehat = async (lab_srvc_id) => {
  const res = await API.post(`/api/mibers/MonitoringSatuSehat/${lab_srvc_id}`);
  return res.data;
};
