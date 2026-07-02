import API from "../axiosInstance";

// Ambil dashboard supervisi untuk HomeSupervisi
export const fetchDashboardSupervisi = async () => {
  const res = await API.get("/api/supervisi/HomeSupervisi/grafik");
  return res.data;
};
