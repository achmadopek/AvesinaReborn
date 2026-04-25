import API from '../axiosInstance';

// Ambil Icare dengan pagination (server-side)
export const fetchDaftarPoli = async () => {
  const res = await API.get('/api/mibers/DaftarPoli');
  return res.data;
};