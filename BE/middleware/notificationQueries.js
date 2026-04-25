const notificationQueries = {
  kepegawaian: [
    `
    select p.id as pegID, 'Belum Verifikasi Master Pegawai' as status, 'MasterPegawai' as route, 
           p.employee_nm as object, 'Data Pegawai belum diverifikasi' as judul, 'kepegawaian' as role
    from sdm_pegawai p  
    where p.verified_by IS null
    `,
    `
    select p.id as pegID, 'Belum Verifikasi Presensi Pegawai' as status, 'PresensiPegawai' as route, p3.employee_nm as object,
           'Presensi Pegawai belum diverifikasi' as judul, 'kepegawaian' as role
    from sdm_presensi p 
    left join sdm_pegawai p3 on p.peg_id = p3.id
    where p.verified_by IS null
    `,
    `
    select p.id as pegID, 'Belum Verifikasi Mutasi Pegawai' as status, 'MutasiPegawai' as route, p3.employee_nm as object,
           'Mutasi Pegawai belum diverifikasi' as judul, 'kepegawaian' as role
    from sdm_mutasi p 
    left join sdm_pegawai p3 on p.peg_id = p3.id
    where p.verified_by IS null
    `,
    `
    select p.id as pegID, 'Belum Verifikasi Kegiatan Pegawai' as status, 'KegiatanPegawai' as route, p.event_nm as object,
           'Kegiatan Pegawai belum diverifikasi' as judul, 'kepegawaian' as role
    from sdm_kegiatan p 
    where p.verified_by IS null
    `,
  ],

  keuangan: [
    `
    select p.id as pegID, 'Belum Verifikasi Rekening Pegawai' as status, 'MasterKeuangan' as route, p.rek_name as object,
           'Rekening Pegawai belum diverifikasi' as judul, 'keuangan' as role
    from thp_rekening p 
    where p.verified_by IS null
    `,
    `
    select p.id as pegID, CONCAT('Terverifikasi oleh ', p2.employee_nm, CHAR(10), 
           '(', DATE_FORMAT(p.verified_at, '%Y-%m-%d %H:%i:%s'), ')') as status, 
           'MasterPegawai' as route, p.employee_nm as object, 'Data Pegawai belum divalidasi' as judul, 'keuangan' as role
    from sdm_pegawai p 
    left join sdm_pegawai p2 on p.verified_by = p2.id 
    where p.validated_by IS null
    `,
    `
    select p.id as pegID, CONCAT('Terverifikasi oleh ', p2.employee_nm, CHAR(10), 
           '(', DATE_FORMAT(p.verified_at, '%Y-%m-%d %H:%i:%s'), ')') as status,
           'PresensiPegawai' as route, p3.employee_nm as object, 'Presensi Pegawai belum divalidasi' as judul, 'keuangan' as role
    from sdm_presensi p 
    left join sdm_pegawai p2 on p.verified_by = p2.id 
    left join sdm_pegawai p3 on p.peg_id = p3.id
    where p.validated_by IS null
    `,
    `
    select p.id as pegID, CONCAT('Terverifikasi oleh ', p2.employee_nm, CHAR(10), 
           '(', DATE_FORMAT(p.verified_at, '%Y-%m-%d %H:%i:%s'), ')') as status,
           'MutasiPegawai' as route, p3.employee_nm as object, 'Mutasi Pegawai belum divalidasi' as judul, 'keuangan' as role
    from sdm_mutasi p 
    left join sdm_pegawai p2 on p.verified_by = p2.id 
    left join sdm_pegawai p3 on p.peg_id = p3.id
    where p.validated_by IS null
    `,
    `
    select p.id as pegID, CONCAT('Terverifikasi oleh ', p2.employee_nm, CHAR(10), 
           '(', DATE_FORMAT(p.verified_at, '%Y-%m-%d %H:%i:%s'), ')') as status,
           'KegiatanPegawai' as route, p.event_nm as object, 'Kegiatan Pegawai belum divalidasi' as judul, 'keuangan' as role
    from sdm_kegiatan p 
    left join sdm_pegawai p2 on p.verified_by = p2.id 
    where p.validated_by IS null
    `,
    `
    select p.id as pegID, CONCAT('Terverifikasi oleh ', p2.employee_nm, CHAR(10), 
           '(', DATE_FORMAT(p.verified_at, '%Y-%m-%d %H:%i:%s'), ')') as status,
           'MasterKeuangan' as route, p.rek_name as object, 'Rekening Pegawai belum divalidasi' as judul, 'keuangan' as role
    from thp_rekening p 
    left join sdm_pegawai p2 on p.verified_by = p2.id 
    where p.validated_by IS null
    `,
  ],

  // contoh role tambahan
  pejabat_teknis: [
    `
    select p.id as pegID, 'Kegiatan Pegawai belum verifikasi' as status, 'KegiatanPegawai' as route, p.event_nm as object,
           'Kegiatan Pegawai belum diverifikasi' as judul, 'pejabat_teknis' as role
    from sdm_kegiatan p 
    where p.verified_by IS null
    `
  ],

  // role pegawai: pakai function agar bisa pakai peg_id
  pegawai: (peg_id) => [
       `
       select p.id as pegID, 'Data anda sedang menunggu verifikasi' as status, 'ProfilPegawai' as route, p.employee_nm as object,
              'Status verifikasi data pegawai' as judul, 'pegawai' as role
       from sdm_pegawai p
       where p.verified_by IS null
       and p.id = '${peg_id}'
       `
       ]
};

module.exports = notificationQueries;
