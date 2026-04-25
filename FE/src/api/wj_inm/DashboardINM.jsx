import API from "../axiosInstance";

// GET rekap indikator INM by jenis (unit|instalasi|bidang)
export const fetchRekapINMIndikator = async (mode, id, start_date, end_date) => {
  const res = await API.get("/api/inm/DashboardINM/rekap_indikator", {
    params: { mode, id, start_date, end_date },
  });
  return res.data;
};
