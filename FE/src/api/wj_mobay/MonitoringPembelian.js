import API from "../axiosInstance";

export const fetchMonitoringPembelian = async (params, units) => {
  const res = await API.post("/api/mobay/MonitoringPembelian", {
    ...params,
    units,
  });

  return res.data;
};

export const fetchMonitoringDetail = async (id) => {
  const res = await API.get(`/api/mobay/MonitoringPembelian/${id}`);

  return res.data;
};
