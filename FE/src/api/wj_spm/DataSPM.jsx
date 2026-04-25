import API from "../axiosInstance";

// GET SPM harian unit tertentu
export const fetchSPMharianByUnit = async (unit_id, tgl_sensus) => {
  const res = await API.get("/api/spm/DataSPM/hasil_spm", {
    params: { unit_id, tgl_sensus },
  });
  return res.data;
};

// GET rekap bulanan SPM unit tertentu
export const fetchRekapSPMBulanan = async (unit_id, bulan) => {
  const res = await API.get("/api/spm/DataSPM/rekap_bulanan", {
    params: { unit_id, bulan },
  });
  return res.data;
};

// GET rekap ringkas SPM by jenis (unit|instalasi|bidang)
export const fetchRekapSPMRingkas = async (mode, id, start_date, end_date) => {
  const res = await API.get("/api/spm/DataSPM/rekap_ringkas", {
    params: { mode, id, start_date, end_date },
  });
  return res.data;
};
