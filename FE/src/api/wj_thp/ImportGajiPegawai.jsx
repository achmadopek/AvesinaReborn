import API from "../axiosInstance";

// Ambil data pegawai dengan pagination + filter
export const fetchPaginatedData = async (
  page = 1,
  limit = 10,
  searchPeriode = '',
  searchEmployeeSts = [],
  jenis = ''
) => {
  const res = await API.get('/api/thp/ImportGajiPegawai', {
    params: {
      page,
      limit,
      periode: searchPeriode,
      employee_sts: Array.isArray(searchEmployeeSts) ? searchEmployeeSts.join(',') : searchEmployeeSts,
      jenis: jenis,
    },
  });
  return res.data;
};

// Simpan hasil import Excel ke tabel penghasilan_pegawai
export const saveImportedPenghasilan = async (payload) => {
  const res = await API.post("/api/thp/ImportGajiPegawai/save-imported", payload);
  return res.data;
};

// Simpan hasil import Excel ke tabel penghasilan_pegawai
export const saveImportedPenghasilanNonASN = async (payload) => {
  const res = await API.post("/api/thp/ImportGajiPegawai/save-imported-non-asn", payload);
  return res.data;
};
