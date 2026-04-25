import API from '../axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, search = '') => {
  const res = await API.get('/api/antrian/AntrianPasien', {
    params: {
      page,
      limit,
      search
    },
  });
  return res.data;
};

