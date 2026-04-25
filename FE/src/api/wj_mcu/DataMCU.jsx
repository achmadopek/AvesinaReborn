import API from "../axiosInstance";

// GET MCU hasil pemeriksaan
export const fetchHasilPemeriksaan = async (nrm, tgl) => {
  const res = await API.get("/api/mcu/DataMCU/hasil", {
    params: { nrm, tgl },
  });
  return res.data;
};