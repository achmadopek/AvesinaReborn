import API from './axiosInstance';

// Ambil data pegawai dengan pagination (server-side) + Seacrh
export const fetchPaginatedData = async (page = 1, limit = 10, role, peg_id) => {
  const res = await API.get('/api/Notification', {
    params: {
      page,
      limit,
      role,
      peg_id,
    },
  });
  return res.data;
};