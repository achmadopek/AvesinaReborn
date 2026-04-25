import API from '../axiosInstance';

// ===============================
// FUNGSI UNTUK DATA PRESENSI PEGAWAI
// ===============================

// Ambil daftar presensi pegawai (dengan pagination & optional filter pegawai/periode)
export const fetchPaginatedData = async (page = 1, limit = 10, peg_id = '', periode = '') => {
  const res = await API.get('/api/sdm/PresensiPegawai', {
    params: { page, limit, peg_id, periode },
  });
  return res.data;
};

// Ambil seluruh history Take Home Pay milik pegawai
export const getHistoryPresensi = async (peg_id) => { 
  const res = await API.get('/api/sdm/PresensiPegawai/history', {
    params: { peg_id },
  });
  return res.data;
};

// Ambil detail presensi berdasarkan ID
export const fetchPresensiById = async (id) => {
  const res = await API.get(`/api/sdm/PresensiPegawai/${id}`);
  return res.data;
};

// ===============================
// VERIFIKASI & VALIDASI PRESENSI
// ===============================

// Verifikasi presensi oleh petugas yang login
export const verifyPresensi = async (id, verified_by) => {
  const payload = {};

  if (verified_by !== null) {
    payload.verified_by = verified_by;
  } else {
    // Kirim secara eksplisit untuk batal verifikasi
    payload.verified_by = null;
  }
  
  const res = await API.patch(`/api/sdm/PresensiPegawai/verify/${id}`, payload);
  return res.data;
};

// Validasi presensi oleh petugas yang login
export const validityPresensi = async (id, validated_by) => {
  const payload = {
    validated_by: validated_by !== null ? validated_by : null,
  };
  const res = await API.patch(`/api/sdm/PresensiPegawai/validity/${id}`, payload);
  return res.data;
};

// ===============================
// FUNGSI TAMBAH / UPDATE PRESENSI
// ===============================

// Tambah presensi baru
export const createPresensi = async (data) => {
  const res = await API.post('/api/sdm/PresensiPegawai', data);
  return res.data;
};

// Update presensi berdasarkan ID
export const updatePresensi = async (id, data) => {
  const res = await API.put(`/api/sdm/PresensiPegawai/${id}`, data);
  return res.data;
};
