import API from "../axiosInstance";

// ==================== API CALLS ====================
export const fetchPaginatedDataXRay = async ({ tgl, role, peg_id }) => {
  const res = await API.get("/api/sirad/MonitoringXRay/data", {
    params: { tgl, role, peg_id }
  });
  return res.data;
};

// WAJIB: Terima 2 parameter
export const fetchDetailXRay = async (registry_id, x_ray_dtl_id) => {
  if (!registry_id || !x_ray_dtl_id) {
    throw new Error("registry_id dan x_ray_dtl_id diperlukan");
  }
  const res = await API.get(`/api/sirad/MonitoringXRay/detail/${registry_id}/${x_ray_dtl_id}`);
  return res.data;
};

export const requestXRay = async (payload) => {
  const res = await API.post("/api/sirad/MonitoringXRay/proses-xray", payload);
  return res.data;
};

export const uploadXRay = async (formData) => {
  const res = await API.post("/api/sirad/MonitoringXRay/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const saveHasilXRay = async (payload) => {
  const res = await API.post("/api/sirad/MonitoringXRay/save-hasil", payload);
  return res.data;
};

export const sendDiagnostic = async (registry_id, x_ray_id, x_ray_dtl_id) => {
  const res = await API.post("/api/sirad/MonitoringXRay/send-diagnostic", { 
    registry_id, 
    x_ray_id,
    x_ray_dtl_id 
  });
  return res.data;
};