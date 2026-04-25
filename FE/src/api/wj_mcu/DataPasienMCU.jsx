import API from "../axiosInstance";

// GET MCU peserta
export const fetchPesertaMCU = async (tgl) => {
  const res = await API.get("/api/mcu/DataPasienMCU/peserta", {
    params: { tgl },
  });
  return res.data;
};
