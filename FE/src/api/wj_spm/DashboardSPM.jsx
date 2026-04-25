import API from "../axiosInstance";

// GET rekap indikator SPM by jenis (unit|instalasi|bidang)
export const fetchRekapSPMIndikator = async (mode, id, start_date, end_date) => {
  const res = await API.get("/api/spm/DashboardSPM/rekap_indikator", {
    params: { mode, id, start_date, end_date },
  });
  return res.data;
};
