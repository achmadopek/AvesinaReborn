import API from '../axiosInstance';

// ===============================
// FUNGSI UNTUK DATA PRESENSI PEGAWAI
// ===============================

// Ambil daftar mutasi pegawai (dengan pagination & optional filter pegawai/periode)
export const fetchPaginatedData = async (page = 1, limit = 10, peg_id = '', periode = '') => {
  const res = await API.get('/api/sdm/MutasiPegawai', {
    params: { page, limit, peg_id, periode },
  });
  return res.data;
};

// cari pegawai by name untuk search-select
export const searchUnit = async (nama) => {
  const res = await API.get('/api/sdm/UnitSearch', {
    params: { nama },
  });
  return res.data.data || []; // Ambil array di dalam "data"
};

// Ambil seluruh history Take Home Pay milik pegawai
export const getHistoryMutasi = async (peg_id) => {
  const res = await API.get('/api/sdm/MutasiPegawai/history', {
    params: { peg_id },
  });
  return res.data;
};

// Ambil detail mutasi berdasarkan ID
export const fetchMutasiById = async (id) => {
  const res = await API.get(`/api/sdm/MutasiPegawai/${id}`);
  return res.data;
};

// ===============================
// VERIFIKASI & VALIDASI PRESENSI
// ===============================

// Verifikasi mutasi oleh petugas yang login
export const verifyMutasi = async (id, verified_by) => {
  const payload = {
    verified_by: verified_by !== null ? verified_by : null,
  };
  const res = await API.patch(`/api/sdm/MutasiPegawai/verify/${id}`, payload);
  return res.data;
};

// Validasi mutasi oleh petugas yang login
export const validityMutasi = async (id, validated_by) => {
  const payload = {
    validated_by: validated_by !== null ? validated_by : null,
  };
  const res = await API.patch(`/api/MutasiPegawai/validity/${id}`, payload);
  return res.data;
};

// ===============================
// FUNGSI TAMBAH / UPDATE PRESENSI
// ===============================

// Tambah mutasi baru
export const createMutasi = async (data) => {
  const res = await API.post('/api/sdm/MutasiPegawai', data);
  return res.data;
};

// Update mutasi berdasarkan ID
export const updateMutasi = async (id, data) => {
  const res = await API.put(`/api/sdm/MutasiPegawai/${id}`, data);
  return res.data;
};
