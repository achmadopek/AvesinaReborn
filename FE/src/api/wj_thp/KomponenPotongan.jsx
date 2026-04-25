import API from '../axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, searchCode = '', searchNama = '') => {
  const res = await API.get('/api/thp/KomponenPotongan', {
    params: {
      page,
      limit,
      potongan_code: searchCode,
      potongan_nm: searchNama,
    },
  });
  return res.data;
};

// Ambil semua komponen potongan (tanpa pagination)
export const fetchKomponenPotongan = async () => {
  const res = await API.get('/api/thp/KomponenPotongan/all');
  return res.data;
};

// Tambah data pegawai baru
export const createKomponen = async (data) => {
  const res = await API.post('/api/thp/KomponenPotongan', data);
  return res.data;
};

// Update data pegawai berdasarkan ID
export const updateKomponen = async (id, data) => {
  const res = await API.put(`/api/thp/KomponenPotongan/${id}`, data);
  return res.data;
};

// Ambil data pegawai berdasarkan ID (misal untuk tampilan detail)
export const fetchKomponenById = async (id) => {
  const res = await API.get(`/api/thp/KomponenPotongan/${id}`);
  return res.data;
};
