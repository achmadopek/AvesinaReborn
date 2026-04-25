import API from "../axiosInstance";

// GET INM harian unit tertentu
export const fetchINMharianByUnit = async (unit_id, tgl_sensus) => {
  const res = await API.get("/api/inm/DataINM/hasil_inm", {
    params: { unit_id, tgl_sensus },
  });
  return res.data;
};

// GET rekap bulanan INM unit tertentu
export const fetchRekapINMBulanan = async (unit_id, bulan) => {
  const res = await API.get("/api/inm/DataINM/rekap_bulanan", {
    params: { unit_id, bulan },
  });
  return res.data;
};

// GET rekap ringkas INM by jenis (unit|instalasi|bidang)
export const fetchRekapINMRingkas = async (mode, id, start_date, end_date) => {
  const res = await API.get("/api/inm/DataINM/rekap_ringkas", {
    params: { mode, id, start_date, end_date },
  });
  return res.data;
};