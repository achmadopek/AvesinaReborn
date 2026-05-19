import API from "../axiosInstance";

// ==================== API CALLS ====================
export const fetchPaginatedDataCTScan = async ({ tgl, role, peg_id }) => {
  const res = await API.get("/api/sirad/MonitoringCTScan/data", {
    params: { tgl, role, peg_id }
  });
  return res.data;
};

// WAJIB: Terima 2 parameter
export const fetchDetailCTScan = async (registry_id, ct_scan_dtl_id) => {
  if (!registry_id || !ct_scan_dtl_id) {
    throw new Error("registry_id dan ct_scan_dtl_id diperlukan");
  }
  const res = await API.get(`/api/sirad/MonitoringCTScan/detail/${registry_id}/${ct_scan_dtl_id}`);
  return res.data;
};

export const uploadCTScan = async (formData) => {
  const res = await API.post("/api/sirad/MonitoringCTScan/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const saveHasilCTScan = async (payload) => {
  const res = await API.post("/api/sirad/MonitoringCTScan/save-hasil", payload);
  return res.data;
};
