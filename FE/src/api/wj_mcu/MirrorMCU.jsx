import API from "../axiosInstance";

export const saveMirrorMCU = async (payload) => {
  const res = await API.post("/api/mcu/SaveMirrorMCU/mirror", payload);
  return res.data;
};

export const fetchMirrorMCUById = async (mcu_id) => {
  const res = await API.get(`/api/mcu/HasilAkhirMCU/cetak/${mcu_id}`);
  return res.data;
};

export const markPrintedMCU = async (mcu_id) => {
  const res = await API.post(`/api/mcu/HasilAkhirMCU/mark/${mcu_id}`);
  return res.data;
};