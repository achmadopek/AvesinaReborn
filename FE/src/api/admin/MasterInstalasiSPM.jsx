import API from '../axiosInstance';

// =============================
// GET DATA INSTALASI
// =============================
export const fetchPaginatedData = async (
  page = 1,
  limit = 10,
  searchKode = '',
  searchNama = ''
) => {

  const res = await API.get('/api/admin/MasterInstalasiSPM', {
    params: {
      page,
      limit,
      kode: searchKode,
      nama: searchNama,
    },
  });

  return res.data;

};

// =============================
// SEARCH BIDANG
// =============================
export const searchBidang = async (nama = "") => {

  const res = await API.get("/api/admin/MasterInstalasiSPM/bidang-search", {
    params: { nama }
  });

  return res.data || [];

};

// =============================
// SEARCH PEGAWAI
// =============================
export const searchPegawai = async (nama = "") => {

  const res = await API.get("/api/admin/MasterInstalasiSPM/pegawai-search", {
    params: { nama }
  });

  return res.data || [];

};

// =============================
// CREATE
// =============================
export const createInstalasi = async (data) => {

  const res = await API.post('/api/admin/MasterInstalasiSPM', data);

  return res.data;

};

// =============================
// UPDATE
// =============================
export const updateInstalasi = async (id, data) => {

  const res = await API.put(`/api/admin/MasterInstalasiSPM/${id}`, data);

  return res.data;

};

// =============================
// DELETE
// =============================
export const deleteInstalasi = async (id) => {

  const res = await API.delete(`/api/admin/MasterInstalasiSPM/${id}`);

  return res.data;

};