import API from "../axiosInstance";

export const fetchRuangan = async () => {
  const res = await API.get("/api/spm/EntriSPMHarian/ruangan");
  return res.data;
};

export const fetchInstalasi = async () => {
  const res = await API.get("/api/spm/EntriSPMHarian/instalasi");
  return res.data;
};

export const fetchBidang = async () => {
  const res = await API.get("/api/spm/EntriSPMHarian/bidang");
  return res.data;
};

// GET daftar indikator untuk unit tertentu
export const fetchIndikatorByUnit = async (unit_id) => {
  const res = await API.get(`/api/spm/EntriSPMHarian/${unit_id}`);
  return res.data;
};

// SIMPAN entri harian (bulk)
export const submitSPMHarian = async ({
  unit_id,
  tgl_input,
  created_by,
  hostname,
  username,
  unitName,
  details,
}) => {
  const res = await API.post(`/api/spm/EntriSPMHarian/entri`, {
    unit_id,
    tgl_input,
    created_by,
    hostname,
    username,
    unitName,
    details,
  });

  return res.data;
};

export const downloadSPMHarianPDF = async (id) => {
  const res = await API.get(`/api/spm/EntriSPMHarian/download/${id}`, {
    responseType: "blob",
  });

  return res.data;
};
