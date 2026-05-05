// Daftar akses menu berdasarkan role pengguna
export const roleAccess = {
  // Role 'admin' bisa mengakses semua menu
  admin: ['ALL'],

  // Role 'pegawai' hanya bisa mengakses menu Beranda
  pegawai: ['Beranda'],

  // Role 'kepegawaian' bisa mengakses menu Beranda dan Master (misal: data pegawai, jabatan, dll)
  kepegawaian: ['Beranda', 'Master', 'HumanResources'],

  // Role 'pejabat_teknis' hanya bisa mengakses Beranda
  pejabat_teknis: ['Beranda', 'Kegiatan'],

  // Role 'keuangan' hanya bisa mengakses Beranda
  keuangan: ['Beranda', 'Keuangan', 'Laporan'],

  // Role 'direksi' bisa mengakses menu Monitoring
  direksi: ['Beranda', 'MonitoringBPJS'],

  // Role 'penjunjang' bisa akses menu Penunjang
  penunjang: ['Beranda', 'Penunjang', 'LaporanMobay'],

  // Role 'akuntansi' bisa akses menu Akuntansi
  akuntansi: ['Beranda', 'Akuntansi', 'LaporanMobay'],

  // Role 'user_MCU' bisa akses menu MCU
  user_mcu: ['Beranda', 'PelayananMedis', 'Poli'],
  dokter_mcu: ['Beranda', 'PelayananMedis'],
  approver_mcu: ['Beranda', 'PelayananMedis'],

  // Role 'user_SPM' bisa akses menu SPM
  user_spm: ['Beranda', 'RenBang'],
  verifikator_spm: ['Beranda', 'RenBang', 'LaporanRenbang'],

  // Role 'user_INM' bisa akses menu INM
  komite_mutu: ['Beranda', 'KomiteMutu', 'LaporanMutu'],

  // Role 'user_bugarr' akses menu BUGARR
  user_bugarr: ['Beranda', 'Bugarr'],

  // Role 'radiografer' akses menu SIRAD
  radiografer: ['Beranda', 'Sirad'],
  radiolog: ['Beranda', 'Sirad'],
};
