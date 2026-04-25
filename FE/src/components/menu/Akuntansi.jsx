import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Akuntansi = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Akuntansi: true,        // Main dropdown "Services"
        LaporanInventory: true,  // Submenu "Web Development"
        MonitoringTagihan: true,     // Sub-submenu "Pendaftaran"
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
                <Link to="#" onClick={() => toggleDropdown('Akuntansi')} className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-money-bill-wave fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Akuntansi</span>
                    </div>
                    <i className={`fa ${openMenus.Akuntansi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.Akuntansi && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown("LaporanInventory")}
                                className="submenu-link d-flex align-items-center justify-content-between"
                                style={{ gap: "8px" }} // biar ada jarak kecil antara ikon dan teks
                            >
                                <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                                    <i className="fas fa-file-invoice-dollar"></i>
                                    <span>Pembelian Rekap</span>
                                </div>
                                <i
                                    className={`fa ${openMenus.LaporanInventory ? "fa-chevron-up" : "fa-chevron-down"
                                        } dropdown-arrow`}
                                ></i>
                            </Link>
                            {openMenus.LaporanInventory && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/mobay/PenerimaanBerkas`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Penerimaan Berkas</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/mobay/VerifikasiPengajuan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Verifikasi Pengajuan</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/mobay/PembayaranTagihan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Pembayaran Tagihan</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown("MonitoringTagihan")}
                                className="submenu-link d-flex align-items-center justify-content-between"
                                style={{ gap: "8px" }} // biar ada jarak kecil antara ikon dan teks
                            >
                                <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                                    <i className="fas fa-chart-line"></i>
                                    <span>Monitoring</span>
                                </div>
                                <i
                                    className={`fa ${openMenus.MonitoringTagihan ? "fa-chevron-up" : "fa-chevron-down"
                                        } dropdown-arrow`}
                                ></i>
                            </Link>
                            {openMenus.MonitoringTagihan && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/mobay/MonitoringTagihan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Monitoring Tagihan</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                    </ul>
                )}
            </li>

            {/* <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Pendaftaran')} className="submenu-link d-flex justify-content-between">
                            Asset
                            <i className={`fa ${openMenus.Pendaftaran ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Pendaftaran && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Entry Asset
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Asset
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('TPPDokter')} className="submenu-link d-flex justify-content-between">
                            Voucher
                            <i className={`fa ${openMenus.TPPDokter ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.TPPDokter && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Bank Masuk
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Bank Keluar
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Kas Masuk
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Kas Keluar
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Umum
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Generate Voucher
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('HutangDanPiutang')} className="submenu-link d-flex justify-content-between">
                            Hutang dan Piutang
                            <i className={`fa ${openMenus.HutangDanPiutang ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.HutangDanPiutang && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Piutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pembayaran Piutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Hutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pembayaran Hutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Piutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Hutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Bayar Piutang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Bayar Hutang
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>*/}


            {/*<li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Buku Besar</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Cash Flow</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Laporan Neraca</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Laporan Rugi-Laba</Link>
                    </li>
                        
                    <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Konfigurasi')} className="submenu-link d-flex justify-content-between">
                            Konfigurasi
                            <i className={`fa ${openMenus.Konfigurasi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Konfigurasi && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Generate Hutang
                                </Link>
                                </li>
                                
                            </ul>
                            )}
                        </li>
                    </li>
                </ul>
            )}
            </li>*/}

        </div>
    );
};

export default Akuntansi;