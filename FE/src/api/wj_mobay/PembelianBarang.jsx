import API from "../axiosInstance";

export const fetchUnitList = async () => {
  const res = await API.get("/api/mobay/PembelianBarang/unitList");

  return res.data;
};

export const fetchBarangList = async () => {
  const res = await API.get("/api/mobay/PembelianBarang/barangList");

  return res.data;
};

export const fetchKategoriBarang = async () => {
  const res = await API.get("/api/mobay/PembelianBarang/kategoriList");
  return res.data;
};

export const saveBarangBaru = async (payload) => {
  const res = await API.post("/api/mobay/PembelianBarang/saveBarang", payload);

  return res.data;
};

export const savePembelianBarang = async ({
  header,
  details,
  employee_id,
  units,
}) => {
  const res = await API.post("/api/mobay/PembelianBarang/save", {
    header,
    details,
    employee_id,
    units,
  });

  return res.data;
};
