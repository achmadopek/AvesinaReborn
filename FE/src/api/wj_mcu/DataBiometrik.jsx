import API from "../axiosInstance";

// GET MCU peserta
export const fetchPesertaBiometrik = async (tgl) => {
  const res = await API.get("/api/mcu/DataBiometrik/peserta", {
    params: { tgl },
  });
  return res.data;
};

export const saveBiometrik = async (payload) => {
  const res = await API.post("/api/mcu/DataBiometrik/save", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
