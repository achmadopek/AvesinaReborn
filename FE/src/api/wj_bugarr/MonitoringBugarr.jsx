import API from "../axiosInstance";

// ===============================
// GET DATA MONITORING
// ===============================
export const fetchPaginatedDataBugarr = async ({
  page = 1,
  limit = 10,
  tgl = "",
}) => {
  const res = await API.get("/api/bugarr/MonitoringBugarr/data", {
    params: { page, limit, tgl },
  });

  return res.data;
};

// ===============================
// GET DETAIL BUGARR
// ===============================
export const fetchDetailBugarr = async (laporan_id) => {
  const res = await API.get(
    `/api/bugarr/MonitoringBugarr/detail/${laporan_id}`
  );

  return res.data;
};

// ======================
// GET ELEMEN BUGARR
// ======================
export const getElemenBugarr = async () => {

  const res = await API.get(
    "/api/bugarr/monitoringBugarr/elemen"
  );

  return res.data;

};


// ======================
// GET RUANGAN
// ======================
export const getRuangan = async () => {

  const res = await API.get(
    "/api/bugarr/monitoringBugarr/ruangan"
  );

  return res.data;

};

// ===============================
// SAVE + UPLOAD BUGARR
// ===============================
export const saveBugarr = async (payload) => {

  const res = await API.post(
    "/api/bugarr/monitoringBugarr/save",
    payload
  );

  return res.data;
};