import API from "../axiosInstance";

export const fetchRuangan = async () => {
  const res = await API.get("/api/inm/EntriINMHarian/ruangan");
  return res.data;
};

export const fetchInstalasi = async () => {
  const res = await API.get("/api/inm/EntriINMHarian/instalasi");
  return res.data;
};

export const fetchBidang = async () => {
  const res = await API.get("/api/inm/EntriINMHarian/bidang");
  return res.data;
};

// GET daftar indikator untuk unit tertentu
export const fetchIndikatorByUnit = async (unit_id) => {
  const res = await API.get(`/api/inm/EntriINMHarian/${unit_id}`);
  return res.data;
};

// SIMPAN entri harian (bulk)
export const submitINMHarian = async ({ unit_id, tgl_input, details }) => {
  const res = await API.post(`/api/inm/EntriINMHarian/entri`, {
    unit_id,
    tgl_input,
    details
  });
  return res.data;
};
