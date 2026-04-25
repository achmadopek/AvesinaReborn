import API from './axiosInstance';

export const searchUnit = async (nama) => {
  const res = await API.get('/api/UnitSearch', {
    params: { nama },
  });
  return res.data || [];
};
