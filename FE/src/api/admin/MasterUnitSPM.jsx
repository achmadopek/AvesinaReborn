import API from '../axiosInstance';

// =============================
// GET DATA UNIT SPM (PAGINATION)
// =============================
export const fetchPaginatedData = async (
  page = 1,
  limit = 10,
  searchKode = '',
  searchNama = ''
) => {

  const res = await API.get('/api/admin/MasterUnitSPM', {
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
// SEARCH MASTER UNIT
// =============================
export const searchMasterUnit = async (nama = '') => {

  const res = await API.get('/api/admin/MasterUnitSPM/unit-search', {
    params: {
      nama
    }
  });

  return res.data;

};

// =============================
// SEARCH SELECT MULTI
// =============================
export const searchBidang = async (nama = "") => {

  const res = await API.get("/api/admin/MasterUnitSPM/bidang-search", {
    params: { nama }
  });

  return res.data || [];

};

export const searchInstalasi = async (nama = "", bidang_id = null) => {

  const res = await API.get("/api/admin/MasterUnitSPM/instalasi-search", {
    params: {
      nama,
      bidang_id
    }
  });

  return res.data || [];

};

export const searchGroupPelayanan = async (nama = "") => {

  const res = await API.get("/api/admin/MasterUnitSPM/group-pelayanan-search", {
    params: { nama }
  });

  return res.data || [];

};

// =============================
// CREATE UNIT
// =============================
export const createUnit = async (data) => {

  const res = await API.post('/api/admin/MasterUnitSPM', data);

  return res.data;

};

// =============================
// UPDATE UNIT
// =============================
export const updateUnit = async (id, data) => {

  const res = await API.put(`/api/admin/MasterUnitSPM/${id}`, data);

  return res.data;

};

// =============================
// DELETE / NONAKTIFKAN UNIT
// =============================
export const deleteUnit = async (id) => {

  const res = await API.delete(`/api/admin/MasterUnitSPM/${id}`);

  return res.data;

};