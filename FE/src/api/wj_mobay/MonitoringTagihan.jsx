import API from "../axiosInstance";

// ===============================
// GET DATA PENGAJUAN PEMBAYARAN
// ===============================
export const fetchPaginatedMonitoringData = async ({
  page = 1,
  limit = 10,
  start = "",
  end = "",
  typeTglFilter = "tgl_po", // DEFAULT AMAN
}) => {
  const res = await API.get("/api/mobay/MonitoringTagihan/data", {
    params: { page, limit, start, end, typeTglFilter },
  });
  return res.data;
};
