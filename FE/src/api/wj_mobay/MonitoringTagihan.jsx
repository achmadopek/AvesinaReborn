import API from "../axiosInstance";

// ===============================
// GET DATA MONITORING
// ===============================
export const fetchPaginatedMonitoringData = async ({
  page = 1,
  limit = 10,
  start = "",
  end = "",
  typeTglFilter = "tgl_po",
}) => {
  const res = await API.get("/api/mobay/MonitoringTagihan/data", {
    params: {
      page,
      limit,
      start,
      end,
      typeTglFilter,
    },
  });

  return res.data;
};

export const fetchMobayMonitoringSummary = async ({
  start = "",
  end = "",
  typeTglFilter = "tgl_po",
}) => {
  const res = await API.get("/api/mobay/MonitoringTagihan/summary", {
    params: { start, end, typeTglFilter },
  });
  return res.data;
};

// ===============================
// CETAK PDF MONITORING
// ===============================
export const cetakMonitoringPDF = async (payload) => {
  const res = await API.post("/api/mobay/MonitoringTagihan/cetak", payload, {
    responseType: "blob",
  });

  return res;
};
