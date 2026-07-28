import API from "../axiosInstance";

export const fetchUnitList = async (units) => {
  const res = await API.post("/api/mobay/PengadaanJasa/unitList", { units });

  return res.data;
};

export const fetchBarangList = async () => {
  const res = await API.get("/api/mobay/PengadaanJasa/barangList");

  return res.data;
};

export const fetchKategoriBarang = async () => {
  const res = await API.get("/api/mobay/PengadaanJasa/kategoriList");
  return res.data;
};

export const saveBarangBaru = async (payload) => {
  const res = await API.post("/api/mobay/PengadaanJasa/saveBarang", payload);

  return res.data;
};

export const savePembelianBarang = async ({
  header,
  details,
  employee_id,
  units,
}) => {
  const res = await API.post("/api/mobay/PengadaanJasa/save", {
    header,
    details,
    employee_id,
    units,
  });

  return res.data;
};

export const submitFinalisasi = async (id) => {
  const res = await API.post("/api/mobay/PengadaanJasa/finalisasi", { id });

  return res.data;
};

export const getPembelianById = async (id) => {
  const res = await API.get(`/api/mobay/PengadaanJasa/${id}`);

  return res.data;
};
