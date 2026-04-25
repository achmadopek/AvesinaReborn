import API from '../axiosInstance';

// ===============================
// FUNGSI UNTUK DATA PEGAWAI
// ===============================

// Ambil daftar pegawai dengan pagination dan pencarian
export const fetchPaginatedData = async (page = 1, limit = 10, searchNama = '') => {
  const res = await API.get('/api/sdm/KegiatanPegawai', {
    params: { page, limit, event_nm: searchNama },
  });
  return res.data;
};

// Ambil seluruh history Take Home Pay milik pegawai
export const getHistoryKegiatan = async (peg_id) => {
  const res = await API.get('/api/sdm/KegiatanPegawai/history', {
    params: { peg_id },
  });
  return res.data;
};

// Ambil detail kegaiatan + daftar peserta hadir berdasarkan ID
export const fetchKegiatanById = async (id) => {
  const res = await API.get(`/api/sdm/KegiatanPegawai/${id}`);
  return res.data;
};

// Verifikasi kegiatan dan daftar hadirnya oleh petugas yang login
export const verifyKegiatan = async (id, verified_by) => {
  const payload = {};

  if (verified_by !== null) {
    payload.verified_by = verified_by;
  } else {
    // Kirim secara eksplisit untuk batal verifikasi
    payload.verified_by = null;
  }

  const res = await API.patch(`/api/sdm/KegiatanPegawai/verify/${id}`, payload);
  return res.data;
};

// Validasi pegawai oleh petugas yang login
export const validityKegiatan = async (id, validated_by) => {
  const payload = {};

  if (validated_by !== null) {
    payload.validated_by = validated_by;
  } else {
    // Kirim secara eksplisit untuk batal validasi
    payload.validated_by = null;
  }

  const res = await API.patch(`/api/sdm/KegiatanPegawai/validity/${id}`, payload);
  return res.data;
};

// ===============================
// FUNGSI TAMBAH / UPDATE KEGIATAN
// ===============================

// Tambah kegiatan baru
export const createKegiatan = async (data) => {
  const res = await API.post('/api/sdm/KegiatanPegawai', data);
  return res.data;
};

// Update kegiatan berdasarkan ID
export const updateKegiatan = async (id, data) => {
  const res = await API.put(`/api/sdm/KegiatanPegawai/${id}`, data);
  return res.data;
};

// ===============================
// FUNGSI UNTUK KELOLA PEGAWAI HADIR
// ===============================

// Cari pegawai berdasarkan nama (live search)
export const searchPegawaiByName = async (nama) => {
  const res = await API.get('/api/sdm/KegiatanPegawai/search-pegawai', {
    params: { nama },
  });
  return res.data;
};

// Tambah Pegawai
export const addPeserta = async (data) => {
  const res = await API.post('/api/sdm/KegiatanPegawai/add-peserta', data);
  return res.data;
};

// Update rekening berdasarkan ID rekening
export const updatePeserta = async (id, data) => {
  const res = await API.put(`/api/sdm/KegiatanPegawai/update-peserta/${id}`, data);
  return res.data;
};

// Delete peserta by ID dafdir
export const deletePeserta = async (id) => {
  const res = await API.delete(`/api/sdm/KegiatanPegawai/delete-peserta/${id}`);
  return res.data;
};
