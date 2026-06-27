import API from "../axiosInstance";

export const fetchTrackingPenunjangData = async ({
  tgl,
  role,
  employee_id,
}) => {
  const res = await API.get("/api/terjang/TrackingPenunjang/data", {
    params: { tgl, role, employee_id },
  });
  return res.data;
};

export const requestTrackingPenunjang = async (payload) => {
  const res = await API.post("/api/terjang/TrackingPenunjang/request", payload);
  return res.data;
};

export const fetchTrackingPenunjangSummary = async () => {
  const res = await API.get("/api/terjang/TrackingPenunjang/summary");
  return res.data;
};
