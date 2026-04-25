import API from '../axiosInstance';

// Ambil hasil generate penghasilan pegawai berdasarkan status & periode
export const generatePenghasilanPegawai = async (employee_sts, periode) => {
  const res = await API.get('/api/thp/PenghasilanPegawai/generate', {
    params: { employee_sts, periode },
  });
  return res.data;
};

// Simpan hasil generate (editable)
export const simpanPenghasilanPegawai = async (data) => {
  console.log("Data yang dikirim:", data); // <== Tambahkan ini
  
  const res = await API.post('/api/thp/PenghasilanPegawai/save-generated', data);
  return res.data;
};

// Endroll / kunci hasil penghasilan pegawai
export const endrollPenghasilanPegawai = async (data) => {
  const res = await API.post('/api/thp/PenghasilanPegawai/endroll', data);
  return res.data;
};
