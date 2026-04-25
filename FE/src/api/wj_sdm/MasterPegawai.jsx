import API from '../axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, searchNik = '', searchNama = '', searchSts = '') => {
  const res = await API.get('/api/sdm/MasterPegawai', {
    params: {
      page,
      limit,
      nik: searchNik,
      nama: searchNama,
      status: searchSts,
    },
  });
  return res.data;
};

// cari pegawai by name untuk search-select
export const searchPegawai = async (nama) => {
  const res = await API.get('/api/sdm/PegawaiSearch/pegawai-search', {
    params: { nama },
  });
  return res.data || []; // Ambil array di dalam "data"
};

// cek NIK exist
export const checkNikExists = async (nik) => {
  const response = await API.get(`/api/sdm/MasterPegawai/check-nik/${nik}`);
  return response.data.exists;
};

// Tambah data pegawai baru
export const createPegawai = async (data) => {
  const res = await API.post('/api/sdm/MasterPegawai', data);
  return res.data;
};

// Update data pegawai berdasarkan ID
export const updatePegawai = async (id, data) => {
  const res = await API.put(`/api/sdm/MasterPegawai/${id}`, data);
  return res.data;
};

// Verifikasi pegawai oleh petugas yang login
export const verifyPegawai = async (id, verified_by) => {
  const payload = {};

  if (verified_by !== null) {
    payload.verified_by = verified_by;
  } else {
    // Kirim secara eksplisit untuk batal verifikasi
    payload.verified_by = null;
  }

  const res = await API.patch(`/api/sdm/MasterPegawai/verify/${id}`, payload);
  return res.data;
};

// Validasi pegawai oleh petugas yang login
export const validityPegawai = async (id, validated_by) => {
  const payload = {};

  if (validated_by !== null) {
    payload.validated_by = validated_by;
  } else {
    // Kirim secara eksplisit untuk batal validasi
    payload.validated_by = null;
  }

  const res = await API.patch(`/api/sdm/MasterPegawai/validity/${id}`, payload);
  return res.data;
};

// Ambil data pegawai berdasarkan ID (misal untuk tampilan detail)
export const fetchPegawaiById = async (id) => {
  const res = await API.get(`/api/sdm/MasterPegawai/${id}`);
  return res.data;
};
