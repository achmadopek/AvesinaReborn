import API from "../axiosInstance";

// Ambil data pegawai dengan pagination + filter
export const fetchPaginatedData = async (
  page = 1,
  limit = 10,
  searchPeriode = '',
  searchEmployeeSts = [],
  jenis = ''
) => {
  const res = await API.get('/api/thp/ImportJPJMPegawai', {
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
export const saveImportedPenghasilanJPJM = async (payload) => {
  const res = await API.post("/api/thp/ImportJPJMPegawai/save-imported-jpjm", payload);
  return res.data;
};
