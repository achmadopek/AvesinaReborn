import API from '../axiosInstance';

// ===============================
// FUNGSI UNTUK DATA PEGAWAI
// ===============================

// Ambil daftar pegawai dengan pagination dan pencarian
export const fetchPaginatedData = async (page = 1, limit = 10, searchNik = '', searchNama = '') => {
  const res = await API.get('/api/sdm/MasterPegawai', {
    params: { page, limit, nik: searchNik, nama: searchNama },
  });
  return res.data;
};

// Cek apakah NIK sudah digunakan
export const checkNikExists = async (nik) => {
  const res = await API.get(`/api/sdm/MasterPegawai/check-nik/${nik}`);
  return res.data.exists;
};

// Ambil detail pegawai + rekening berdasarkan ID
export const fetchPegawaiById = async (id) => {
  const res = await API.get(`/api/thp/MasterKeuangan/${id}`);
  return res.data;
};

// ===============================
// FUNGSI UNTUK DATA REKENING
// ===============================

// Buat rekening baru untuk pegawai
export const createRekening = async (data) => {
  const res = await API.post('/api/thp/MasterKeuangan/create-rekening', data);
  return res.data;
};

// Update rekening berdasarkan ID rekening
export const updateRekening = async (id, data) => {
  const res = await API.put(`/api/thp/MasterKeuangan/update-rekening/${id}`, data);
  return res.data;
};

// Validasi rekening oleh petugas yang login
export const validityRekening = async (id, validated_by) => {
  const payload = {};

  if (validated_by !== null) {
    payload.validated_by = validated_by;
  } else {
    // Kirim secara eksplisit untuk batal validasi
    payload.validated_by = null;
  }

  const res = await API.patch(`/api/thp/MasterKeuangan/validity/${id}`, payload);
  return res.data;
};