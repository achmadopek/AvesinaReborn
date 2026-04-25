import API from '../axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, searchCode = '', searchNama = '') => {
  const res = await API.get('/api/thp/KomponenPenghasilan', {
    params: {
      page,
      limit,
      penghasilan_code: searchCode,
      penghasilan_nm: searchNama,
    },
  });
  return res.data;
};

// Ambil semua komponen penghasilan (tanpa pagination)
export const fetchKomponenPenghasilan = async () => {
  const res = await API.get('/api/thp/KomponenPenghasilan/all');
  return res.data; // hasilnya array
};

// Tambah data pegawai baru
export const createKomponen = async (data) => {
  const res = await API.post('/api/thp/KomponenPenghasilan', data);
  return res.data;
};

// Update data pegawai berdasarkan ID
export const updateKomponen = async (id, data) => {
  const res = await API.put(`/api/thp/KomponenPenghasilan/${id}`, data);
  return res.data;
};

// Ambil data pegawai berdasarkan ID (misal untuk tampilan detail)
export const fetchKomponenById = async (id) => {
  const res = await API.get(`/api/thp/KomponenPenghasilan/${id}`);
  return res.data;
};

// Ambil data komponen berdasarkan jenis (query param)
export const fetchPenghasilanByJenis = async (jenis) => {
  const res = await API.get(`/api/thp/KomponenPenghasilan/jenis`, {
    params: { jenis } // <-- query param
  });
  return res.data;
};

