import API from '../axiosInstance';

// Ambil hasil generate potongan pegawai berdasarkan status & periode
export const generatePotonganPegawai = async (employee_sts, periode) => {
  const res = await API.get('/api/thp/PotonganPegawai/generate', {
    params: { employee_sts, periode },
  });
  return res.data;
};

// Simpan hasil generate (editable)
export const simpanPotonganPegawai = async (data) => {
  console.log("Data yang dikirim:", data); // <== Tambahkan ini
  
  const res = await API.post('/api/thp/PotonganPegawai/save-generated', data);
  return res.data;
};

// Endroll / kunci hasil potongan pegawai
export const endrollPotonganPegawai = async (data) => {
  const res = await API.post('/api/thp/PotonganPegawai/endroll', data);
  return res.data;
};
