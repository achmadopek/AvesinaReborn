import API from '../axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, search = '') => {
  const res = await API.get('/api/mibers/MasterAnjungan', {
    params: {
      page,
      limit,
      search
    },
  });
  return res.data;
};

export const fetchDaftarPoli = async () => {
  const res = await API.get('/api/mibers/MasterAnjungan/poli');
  return res.data;
};

