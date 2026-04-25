import { Link } from 'react-router-dom';
import { useState } from 'react';

export const LaporanMobay = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Laporan: true,        // Main dropdown "Services"
    });

    // Toggle a specific dropdown (menu, submenu, or sub-submenu)
    const toggleDropdown = (menu) => {
        setOpenMenus((prevState) => ({
            ...prevState,
            [menu]: !prevState[menu],  // Toggle the specific menu/submenu/sub-submenu
        }));
    };

    return (

        <div>

            {/* First-level Dropdown */}
            <li className="sidebar-item-x">
                <Link to="#" onClick={() => toggleDropdown('Laporan')} className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-chart-bar fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Laporan</span>
                    </div>
                    <i className={`fa ${openMenus.Laporan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.Laporan && (
                    <ul className="submenu">

                        <li className="submenu-item-x">
                            <Link to={`/mobay/RekapPembayaranBahanMedis`} onClick={() => { if (isMobile) setShowSidebar(false); setShowRightContent(false); }} className="submenu-link">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-file-export fa-md me-2"></i>
                                    <span>Rekap Pembayaran Bahan Medis</span>
                                </div>
                            </Link>
                        </li>

                        {/*<li className="submenu-item-x">
                    <Link to="#" onClick={() => toggleDropdown('LaporanPendaftaran')} className="submenu-link d-flex justify-content-between">
                        Laporan Pendaftaran
                        <i className={`fa ${openMenus.LaporanPendaftaran ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanPendaftaran && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pendaftaran Pasien
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Rujukan Masuk
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Pasien Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Batal
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keuangan Karcis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Biaya Konsul
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pelayanan Poli Jiwa
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pelayanan UGD
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pelayanan Poli Spesialis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pelayanan KRS
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Register Pendaftaran
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Statistik (Jenis pasien)
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Statistik (Pelayanan)
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Statistik (Rujukan)
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Grafik Pasien Per Kabupat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Grafik Pasien Per Kecamat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Grafik Pasien Per Kelurah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Grafik Pendapatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Sjp RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Sjp RI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Pasien Kunjungan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Kegiatan IGD
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Pertemuan Dok
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Statistik Perawatan
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>
                    
                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanRawatJalan')} className="submenu-link d-flex justify-content-between">
                        Laporan Rawat Jalan
                        <i className={`fa ${openMenus.LaporanRawatJalan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanRawatJalan && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Diagnosa Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Morbiditas Jenis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Pasien Rujukan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Rujukan Keluar
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Statistik Diagnosa
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jumlah Pasien Per ICD
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Data Kecelakaan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Data Darurat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Data Harian RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Bulanan RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Kegiatan Pelayana
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanRawatInap')} className="submenu-link d-flex justify-content-between">
                        Laporan Rawat Inap
                        <i className={`fa ${openMenus.LaporanRawatInap ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanRawatInap && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Sensus Harian
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Sensus Harian RI Keluar
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Resume Sensus Harian
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Resume Sensus Harian Pend
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Resume Sensus Harian Pend
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Sensus Harian RI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Data Triwulan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Bulanan ICU
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kegiatan Rawat Inap
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Data Kamar
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Asuhan Perawat
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanVK')} className="submenu-link d-flex justify-content-between">
                        Laporan VK
                        <i className={`fa ${openMenus.LaporanVK ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanVK && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Sensus Harian Persalinan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Daftar Bayi Lahir Mati
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keg.Bidan dan Kandungan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Persalinan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Curettage
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Tdk Bersalin Per Dokter
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Tdk RI Per Dokter
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Register Kamar Bersa
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan pembebasan biaya
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Ruang Persalinan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Catatan Medis Kamar Bersa
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanAmbulance')} className="submenu-link d-flex justify-content-between">
                        Laporan Ambulance
                        <i className={`fa ${openMenus.LaporanAmbulance ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanAmbulance && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemakaian Ambulance
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kegiatan Ambulance
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keuangan Pemakaian
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li> 

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanJenazah')} className="submenu-link d-flex justify-content-between">
                        Laporan Jenazah
                        <i className={`fa ${openMenus.LaporanJenazah ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanJenazah && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan Jenazah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengeluaran Jenazah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemandian Jenazah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Forensik
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanKIAKematian')} className="submenu-link d-flex justify-content-between">
                        Laporan KIA (Kematian)
                        <i className={`fa ${openMenus.LaporanKIAKematian ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanKIAKematian && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Ibu Hamil/bersalin
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Bayi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Neonatus dini
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Neonatus
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>  

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanKamarOperasi')} className="submenu-link d-flex justify-content-between">
                        Laporan Kamar Operasi
                        <i className={`fa ${openMenus.LaporanKamarOperasi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanKamarOperasi && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan OK
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Perincian Obat OK
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Bedah dan Jns.Operasi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Dr.Internal dan Dr.Tamu
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap.Bulanan OK
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keg.Bedah dan spesialis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jml Kegiatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jenis Anasthesi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jenis Tindakan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Daftar Pemeriksaan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rincian Tindakan Operasi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rincian Tindakan Anastesi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Mon. Rencana Operasi
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>                

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanPenunjangMedis')} className="submenu-link d-flex justify-content-between">
                        Laporan Penunjang Medis
                        <i className={`fa ${openMenus.LaporanPenunjangMedis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanPenunjangMedis && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('Kunjungan')} className="submenu-link d-flex justify-content-between">
                                Kunjungan
                                <i className={`fa ${openMenus.Kunjungan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.Kunjungan && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        HARIAN RADIOLOGI
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        XRAY
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        CT-SCAN
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        USG
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        LABORATORY
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        LAP. KUNJUNGAN PATOLOGI
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>

                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('Rekapitulasi')} className="submenu-link d-flex justify-content-between">
                                Rekapitulasi
                                <i className={`fa ${openMenus.Rekapitulasi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.Rekapitulasi && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Bulanan Rawat Inap
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Bulanan Rawat Jalan
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Bulanan Jml Pasien
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Bulanan Pemeriksaan
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Rekap Rawat Inap Ke
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Rekap Rawat Inap Un
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Data Tahunan Detail
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Data Tahunan
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap. Data Tahunan APS
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Sensus Unit Pengirim
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap Bulanan ECG
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>

                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('Statistik')} className="submenu-link d-flex justify-content-between">
                                Statistik
                                <i className={`fa ${openMenus.Statistik ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.Statistik && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap Statistik Dokter
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap Statistik Jml Pemerik
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>

                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('KhususRadiologi')} className="submenu-link d-flex justify-content-between">
                                Khusus Radiologi
                                <i className={`fa ${openMenus.KhususRadiologi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.KhususRadiologi && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Lap Pemakaian Film Xray
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>

                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('KhususLaboratorium')} className="submenu-link d-flex justify-content-between">
                                Khusus Laboratorium
                                <i className={`fa ${openMenus.KhususLaboratorium ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.KhususLaboratorium && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Buku Reg. Laborat
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Buku Reg. Patologi
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Pembelian Reagen
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Stock Reagen dan Alkes
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Data Kegiatan LAB
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Kemampuan Lab
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Sen. Harian Kunj
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Laporan Penerimaan Sample
                                    </Link>
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Laporan Permintaan Lab.
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>

                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('DepKes')} className="submenu-link d-flex justify-content-between">
                                DepKes
                                <i className={`fa ${openMenus.MedicalCheckUp ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.TPPDokter && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="/under-construction" className="submenu-link-xx">
                                        Laporan DKK
                                    </Link>
                                    </li>
                                </ul>
                            )}
                            </li>      

                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanHumanResource')} className="submenu-link d-flex justify-content-between">
                        Laporan Human Resource
                        <i className={`fa ${openMenus.LaporanHumanResource ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanHumanResource && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Daftar Karyawan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Daftar Karyawan Honorer
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Gaji Pegawai
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Komponen Gaji Pegawai
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jadwal Kenaikan Pangkat
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanMRS')} className="submenu-link d-flex justify-content-between">
                        Laporan MRS
                        <i className={`fa ${openMenus.LaporanMRS ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanMRS && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                MRS
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Diagnosa MRS
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Data MRS
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li> 

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanKasir')} className="submenu-link d-flex justify-content-between">
                        Laporan Kasir
                        <i className={`fa ${openMenus.LaporanKasir ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanKasir && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jurnal Pembayaran Kasir
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Kasir Harian
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Kasir Per Poli
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Kasir Per Tindakan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('LaporanPendapatanRS')} className="submenu-link-xx d-flex justify-content-between">
                                Laporan Pendapatan RS
                                <i className={`fa ${openMenus.LaporanPendapatanRS ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.LaporanPendapatanRS && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Pendapatan RS
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Pendapatan RS Bulanan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Pendapatan RS Triwulan
                                        </Link>
                                    </li>
                                </ul>
                            )}
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Rincian Pel. Medis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Kas Umum
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Penerimaan Sejenis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan Pasien
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jenis Penerimaan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Jenis Penerimaan
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li> 

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanApotik')} className="submenu-link d-flex justify-content-between">
                        Laporan Apotik
                        <i className={`fa ${openMenus.LaporanApotik ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanApotik && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Stock Opname
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Ret.Penjualan Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rek.Penjualan Gol.Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan RI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Obat OKT
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Obat Apotik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Narkotik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengg OKT
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengg Narkotik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengg N106
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengeluaran Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan Obat/hari
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Obat Habis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keadaan Stock Akhir
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kartu Stock
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Hrg.Jual.Netto
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Golongan OBAT
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                EXP DATE
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Keadaan Stok Per Gol
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Dokter
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Persediaan Obat Stock Opn
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rincian Obat Pasien
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Keuangan Apotik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="#" onClick={() => toggleDropdown('LaporanKhusus')} className="submenu-link-xx d-flex justify-content-between">
                                Laporan Khusus
                                <i className={`fa ${openMenus.LaporanKhusus ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                </Link>
                                {openMenus.LaporanKhusus && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Data Pelayanan Obat di RS
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Data Pelayanan Obat Dispo
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Data Pelayanan Obat Gener
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Data Pelayanan Obat Non G
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Laporan Harian Stok Obat
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Laporan Pelayanan Resep A
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Laporan Penulisan dan Pel
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Rekap Pengeluaran Obat Ap
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Pendapatan Resep Instalas
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Laporan Tagihan Obat Bula
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Lap Tag Obat Bulanan DP
                                        </Link>
                                    </li>
                                </ul>
                            )}
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Obat Kronis
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link
                        to="#"
                        onClick={() => toggleDropdown("LaporanInventory")}
                        className="submenu-link d-flex align-items-center justify-content-between"
                        style={{ gap: "8px" }} // biar ada jarak kecil antara ikon dan teks
                    >
                        <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Laporan Inventory</span>
                        </div>
                        <i
                        className={`fa ${
                            openMenus.LaporanInventory ? "fa-chevron-up" : "fa-chevron-down"
                        } dropdown-arrow`}
                        ></i>
                    </Link>
                    {openMenus.LaporanInventory && (
                        <ul className="submenu">
                            {/*<li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Pemesanan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Pembelian
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to={`${appPrefix}/PengajuanPembayaran`} className="submenu-link-xx">
                                Lap Pembelan Rekap
                                </Link>
                            </li>
                            {/*<li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Minimum Stok
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                LLap Penggunaan Psikotropi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Mutasi Bulanan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Stok Obat Stock Opnam
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Lap Psikotropika Narkotik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Permintaan Antar Unit
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengiriman Antar Unit
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan Antar Unit
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Stock Harian
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Stock FIFO
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    {/*<li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LapInventoryNonMedis')} className="submenu-link d-flex justify-content-between">
                        Lap. Inventory Non Medis
                        <i className={`fa ${openMenus.LapInventoryNonMedis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LapInventoryNonMedis && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Daftar Transaksi Antar Un
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekap Transaksi Antar Uni
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Barang Pakai Habi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Pengadaan Barang
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pengeluaran Barang
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kartu Persediaan Barang
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Penerimaan Pengel
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Mutasi Barang Non
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Persediaan Non Me
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li> 
                    
                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('IndikatorRumahsakit')} className="submenu-link d-flex justify-content-between">
                        Indikator Rumah sakit
                        <i className={`fa ${openMenus.IndikatorRumahsakit ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.IndikatorRumahsakit && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                10 Penyakit Terbesar Berd
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                10 Penyakit Terbesar Berd
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kartu Indek Penyakit
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kartu Indek Penyakit RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kartu Index Operasi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemanfaatan Rumah Sakit
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekapitulasi Resep Dokter
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekapitulasi Pemakaian Ob
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Tingkat pemanfaatan RS
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kegiatan Bidan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Permintaan Obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Resep Pasien Umum
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemakaian obat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemakaian Alkes
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemakaian Obat Takterlaya
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                tingkat pemanfaatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                kunjungan rawat jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Data Omzet
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Tagihan Bulanan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Survilans
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LapNutrient')} className="submenu-link d-flex justify-content-between">
                        Lap Nutrient
                        <i className={`fa ${openMenus.LapNutrient ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LapNutrient && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Ststistik Jml Mkn Pas
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laporan Bulanan Gizi
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanDepKes')} className="submenu-link d-flex justify-content-between">
                        Laporan DepKes
                        <i className={`fa ${openMenus.LaporanDepKes ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanDepKes && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Pasien RI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Pasien RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Pelayanan RI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Pelayanan RJ
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Keg.Farmasi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Reg.Bedah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Reg.Laboratorium
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Reg.Spesimen
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Persalinan dan Abort
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Rujukan Dokter
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Buku Keg.RAdiologi
                                </Link>
                            </li>
                            
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('LaporanRL')} className="submenu-link d-flex justify-content-between">
                        Laporan RL
                        <i className={`fa ${openMenus.LaporanRL ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanRL && (
                        <ul className="submenu">
                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LaporanRL1')} className="submenu-link-xx d-flex justify-content-between">
                                Laporan RL1
                                <i className={`fa ${openMenus.LaporanRL1 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.LaporanRL1 && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                    <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman1')} className="submenu-link-xxx d-flex justify-content-between">
                                        Laporan RL1 Halaman1
                                        <i className={`fa ${openMenus.LaporanRL1Halaman1 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                    </Link>
                                    {openMenus.LaporanRL1Halaman1 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                1.Pelayanan Rawat Inap
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>

                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                            1.Data Dasar Rumah Sakit
                                        </Link>
                                    </li>

                                    <li className="submenu-item">
                                    <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman2')} className="submenu-link-xxx d-flex justify-content-between">
                                        Laporan RL1 Halaman2
                                        <i className={`fa ${openMenus.LaporanRL1Halaman2 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                    </Link>
                                    {openMenus.LaporanRL1Halaman2 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                2.Pengunjung Rumah sakit
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                3.Kunjungan Rawat Jalan
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                4.Kegiatan Kebidanan dan
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                5.Kegiatan Pembedahan
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                6.Kesehatan Jiwa
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                7.Instalasi Rawat Darurat
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                8.Kunjungan Rumah
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>

                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Indikator Pelayanan RS
                                        </Link>
                                    </li>

                                    <li className="submenu-item">
                                        <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman3')} className="submenu-link-xxx d-flex justify-content-between">
                                        Laporan RL1 Halaman 3
                                        <i className={`fa ${openMenus.LaporanRL1Halaman3 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                    </Link>
                                    {openMenus.LaporanRL1Halaman3 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                            <Link to="#" onClick={() => toggleDropdown('SembilanKegiatanRadiologi')} className="submenu-link-xxxx d-flex justify-content-between">
                                            9. Kegiatan Radiologi
                                            <i className={`fa ${openMenus.SembilanKegiatanRadiologi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                            </Link>
                                                {openMenus.SembilanKegiatanRadiologi && (
                                                <ul className="submenu">
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        A. RadioDiagnostik
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        B. RadioTherapi
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        C. Kedokteran Nuklir
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        D. Imaging Pencitraan
                                                        </Link>
                                                    </li>
                                                </ul>
                                            )}         
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                10. Keg.Pelayanan Khusus
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="#" onClick={() => toggleDropdown('SebelasKegiatanRadiologi')} className="submenu-link-xxxx d-flex justify-content-between">
                                                11. Kegiatan Radiologi
                                                <i className={`fa ${openMenus.SebelasKegiatanRadiologi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                                </Link>
                                                {openMenus.SebelasKegiatanRadiologi && (
                                                <ul className="submenu">
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        A. Patologi Klinik
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        B. PatologiAnatomi
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        C. Toksikologi
                                                        </Link>
                                                    </li>
                                                </ul>
                                            )}         
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="#" onClick={() => toggleDropdown('DuabelasKegiatanFarmasiRumahSakit')} className="submenu-link-xxxx d-flex justify-content-between">
                                                12. Kegiatan Farmasi Rumah Sakit
                                                <i className={`fa ${openMenus.DuabelasKegiatanFarmasiRumahSakit ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                                </Link>
                                                {openMenus.DuabelasKegiatanFarmasiRumahSakit && (
                                                <ul className="submenu">
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        A. Pengadaan Obat
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        B. Penulisan dan Pelayanan
                                                        </Link>
                                                    </li>
                                                </ul>
                                            )}         
                                            </li>
                                        </ul>
                                    )}         
                                    </li>
                                                
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        3. Fasilitas Tempat Tidur
                                        </Link>
                                    </li>

                                    <li className="submenu-item">
                                        <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman4')} className="submenu-link-xxx d-flex justify-content-between">
                                        Laporan RL1 Halaman4
                                        <i className={`fa ${openMenus.LaporanRL1Halaman4 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                        </Link>
                                        {openMenus.LaporanRL1Halaman4 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                13. Pelayanan Rehabilitas
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                14. Kegiatan KB
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                15. Kegiatan Peny.Kesehata
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                16. Kegiatan Kes.Gigi Mulu
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                17. Dokter dan Tenaga Asin
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                18. Transfusi Darah
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman5')} className="submenu-link-xxx d-flex justify-content-between">
                                        Laporan RL1 Halaman5
                                        <i className={`fa ${openMenus.LaporanRL1Halaman5 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                        </Link>
                                        {openMenus.LaporanRL1Halaman5 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                19.Lat.Kursus Penataran
                                                </Link>
                                            </li>                                                  
                                            <li className="submenu-item">
                                                <Link to="#" onClick={() => toggleDropdown('DuapuluhPembedahanMata')} className="submenu-link-xxxx d-flex justify-content-between">
                                                20. Pembedahan Mata
                                            <i className={`fa ${openMenus.DuapuluhPembedahanMata ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                            </Link>
                                                {openMenus.DuapuluhPembedahanMata && (
                                                <ul className="submenu">
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        1. Katarak
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        2. Glaukoma
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        3. Retina
                                                        </Link>
                                                    </li>
                                                    <li className="submenu-item">
                                                        <Link to="/under-construction" className="submenu-link-xxxxx">
                                                        4. Kornea/Infeksi
                                                        </Link>
                                                    </li>

                                                </ul>
                                            )}         
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                21. Penanganan Napza
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                22. Kegiatan bayi Tabung
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>
                                    <li className="submenu-item">
                                    <Link to="#" onClick={() => toggleDropdown('LaporanRL1Halaman6')} className="submenu-link-xxx d-flex justify-content-between">
                                    Laporan RL1 Halaman6
                                    <i className={`fa ${openMenus.LaporanRL1Halaman6 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                    </Link>
                                        {openMenus.LaporanRL1Halaman6 && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                23.Cara Pembayaran
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                24.Kegiatan Rujukan
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>
                                        
                                </ul>
                            )}        
                            </li>
                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LaporanRL2')} className="submenu-link-xx d-flex justify-content-between">
                            Laporan RL2
                            <i className={`fa ${openMenus.LaporanRL2 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                                {openMenus.LaporanRL2 && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        1.Morbiditas RI Ketenagaan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Morbiditas RI Surveilan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        3.Morbiditas RJ
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        4.Morbiditas RJ Surveilan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        5.Data Imunisasi
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        6.Morbiditas RI P.Umum
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        7.Morbiditas RI Obstetri
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        8.Morbiditas RI Perinatal
                                        </Link>
                                    </li>
                                </ul>
                            )}         
                            </li>

                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LaporanRL3')} className="submenu-link-xx d-flex justify-content-between">
                            Laporan RL3
                            <i className={`fa ${openMenus.LaporanRL3 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                                {openMenus.LaporanRL3 && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        1.Data Dasar Rumah Sakit
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        1. Kegiatan Pelayanan RI
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Kunjungan Rawat Darurat
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Fasilitas Unit RJ
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        3.Kegiatan Kes.Gigi Mulut
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        4.Kegiatan Kebidanan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        5.Kegiatan Perinatologi
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        6.Kegiatan Pembedahan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        7.Kegiatan Radiologi
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        8. Pemeriksaan Laboratori
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        9.Pel. Rehabilitas Medik
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        10.Keg.Pelayanan Khusus
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        11.Kesehatan Jiwa
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        12.Keluarga Berencana
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        13.P. Obat dan P. Resep
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        14.Kegiatan Rujukan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        15.Cara Bayar
                                        </Link>
                                    </li>
                                </ul>
                            )}         
                            </li>

                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LaporanRL4')} className="submenu-link-xx d-flex justify-content-between">
                            Laporan RL4
                            <i className={`fa ${openMenus.LaporanRL4 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                                {openMenus.LaporanRL4 && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Keadaan Morbiditas Pasien
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        A.Jml Tenaga Kesehatan Je
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        B.Jml Tenaga Non Kesehata
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="#" onClick={() => toggleDropdown('CFormulirdataIndividualKepegawaian')} className="submenu-link-xxx d-flex justify-content-between">
                                        C.Formulir data Individual Kepegawaian
                                        <i className={`fa ${openMenus.CFormulirdataIndividualKepegawaian ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                                    </Link>
                                    {openMenus.CFormulirdataIndividualKepegawaian && (
                                        <ul className="submenu">
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                1.Identitas Pegawai
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                2.Riwayat Pekerjaan dan P
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                4.Riwayat Jabatan
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                5.Riwayat Pendidikan
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                6.Latihan Jenjang
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                7.Latihan Teknis
                                                </Link>
                                            </li>
                                            <li className="submenu-item">
                                                <Link to="/under-construction" className="submenu-link-xxxx">
                                                8.Pelatihan
                                                </Link>
                                            </li>
                                        </ul>
                                    )}         
                                    </li>

                                </ul>
                            )}
                            </li>
                            
                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LaporanRL5')} className="submenu-link-xx d-flex justify-content-between">
                            Laporan RL5
                            <i className={`fa ${openMenus.LaporanRL5 ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.LaporanRL5 && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        1.Pengunjung Rumah sakit
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        1.Data Alat Medis
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Kunjungan Rawat Jalan
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        2.Data Keg.Kesh.Lingkunga
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        3.10 Besar Penyakit RI
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        4.10 Besar Penyakit RJ
                                        </Link>
                                    </li>
                                </ul>
                            )}         
                            </li>
                                                            
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item-x">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Test Laporan
                        </Link>
                    </li>

                    <li className="submenu-item-x">
                    <Link to="#" onClick={() => toggleDropdown('LaporanSPM')} className="submenu-link d-flex justify-content-between">
                        Laporan SPM
                        <i className={`fa ${openMenus.LaporanSPM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.LaporanSPM && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laboratorium PK
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laboratorium PA
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Radiologi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Instalasi Farmasi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Instalasi Gizi
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rekam Medis
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rehab Medik
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Persalinan & Perinatal
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Intslasi Bedah Sentral
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pelayanan Intensif
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Instalasi Gawat Darurat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rawat Inap
                                </Link>
                            </li>
                            
                            <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('LapSPMIPS')} className="submenu-link-xx d-flex justify-content-between">
                            SPM IPS
                            <i className={`fa ${openMenus.LapSPMIPS ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.LapSPMIPS && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Alat Kesehatan (Medis)
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Alat Non Medis
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/under-construction" className="submenu-link-xxx">
                                        Pengelolaan Limbah
                                        </Link>
                                    </li>
                                </ul>
                            )}         
                            </li>

                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Ambulance
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kamar Jenazah
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Laundry
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>*/}

                    </ul>
                )}
            </li>

        </div>

    );
};

export default LaporanMobay;