import API from '../axiosInstance';

// Ambil hasil generate potongan pegawai berdasarkan status & periode
export const generateTHP = async (employee_sts, periode) => {
  const res = await API.get('/api/thp/EndrollTHP/generate', {
    params: { employee_sts, periode },
  });
  return res.data;
};

// Ambil seluruh history Take Home Pay milik pegawai
export const getHistoryTHP = async (peg_id) => {
  const res = await API.get('/api/thp/EndrollTHP/history', {
    params: { peg_id },
  });
  return res.data;
};

// Ambil hasil generate potongan pegawai berdasarkan status & periode
export const getDetailTHP = async (peg_id, periode) => {
  const res = await API.get('/api/thp/EndrollTHP/detail', {
    params: { peg_id, periode },
  });
  return res.data;
};

// Simpan hasil generate (editable)
export const simpanTHP = async (data) => {
  console.log("Data yang dikirim:", data); // <== Tambahkan ini
  
  const res = await API.post('/api/thp/EndrollTHP/save-generated', data);
  return res.data;
};

// Endroll / kunci hasil potongan pegawai
export const endrollTHP = async (data) => {
  const res = await API.post('/api/thp/EndrollTHP/endroll', data);
  return res.data;
};
