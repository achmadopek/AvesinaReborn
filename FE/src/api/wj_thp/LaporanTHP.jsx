import API from '../axiosInstance';

// Laporan data berdasarkan: 
// date_range     ==> harian, mingguan, bulanan, semester, tahunan
// employee_sts   ==> ASN (PNS, PPPK) & NON-ASN (HONORER, BLUD, MOU)
// penghasilan_id ==> tabel Komponen_penghasilan yg berelasi juga dg komponen_Potongan (potongan yg mana dr penghasilan yg mana)
// unit           ==> ini blm bisa (karena hanya ada data unit_nm tempat pegawai bekerja di tbl mutasi, dan blm ada tabel unit_group)

// Get Groups
export const getGroupUnit = async () => {
  const res = await API.get('/api/thp/LaporanTHP/group');
  return res.data;
};

// Get Units by Groups
export const getUnitByGroup = async (group) => {
  const res = await API.get('/api/thp/LaporanTHP/unit', {
    params: { group },
  });
  return res.data;
};

// Generate Rekap THP
export const generateRekapTHP = async (date_range, employee_sts, penghasilan_id, groupUnit, peg_id) => {
  const res = await API.get('/api/thp/LaporanTHP/rekap', {
    params: { date_range, employee_sts, penghasilan_id, groupUnit, peg_id },
  });
  return res.data;
};

// Generate Rinci THP
export const generateRinciTHP = async (date_range, employee_sts, penghasilan_id, groupUnit, peg_id) => {
  const res = await API.get('/api/thp/LaporanTHP/rinci', {
    params: { date_range, employee_sts, penghasilan_id, groupUnit, peg_id },
  });
  return res.data;
};