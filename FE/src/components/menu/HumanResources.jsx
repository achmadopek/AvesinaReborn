import { Link } from 'react-router-dom';
import { useState } from 'react';

export const HumanResources = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        HumanResources: true,        // Main dropdown "Services"
        webDevelopment: false,  // Submenu "Web Development"
        pendaftaran: false,     // Sub-submenu "Pendaftaran"
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
                <Link to="#" onClick={() => toggleDropdown('HumanResources')} className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-users fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Kepegawaian</span>
                    </div>
                    <i className={`fa ${openMenus.HumanResources ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.HumanResources && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link to={`/sdm/MutasiPegawai`} onClick={() => { if (isMobile) setShowSidebar(false); setShowRightContent(true); }} className="submenu-link">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-exchange-alt fa-md me-2"></i>
                                    <span>Mutasi Pegawai</span>
                                </div>
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to={`/sdm/PresensiPegawai`} onClick={() => { if (isMobile) setShowSidebar(false); setShowRightContent(true); }} className="submenu-link">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-fingerprint fa-md me-2"></i>
                                    <span>Presensi Pegawai</span>
                                </div>
                            </Link>
                        </li>
                        {/*
                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Proposal')} className="submenu-link d-flex justify-content-between">
                            Proposal
                            <i className={`fa ${openMenus.Proposal ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Proposal && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Proposal Training
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Proposal Magang
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('KomponenGaji')} className="submenu-link d-flex justify-content-between">
                            Komponen Gaji
                            <i className={`fa ${openMenus.KomponenGaji ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.KomponenGaji && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Komponen Gaji
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Master Component
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Tipe Gaji
                                </Link>
                                </li>                                
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Penggajian')} className="submenu-link d-flex justify-content-between">
                            Penggajian
                            <i className={`fa ${openMenus.Penggajian ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Penggajian && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Komponen Gaji Pegawai
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Generate Gaji
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('MonitoringPenggajian')} className="submenu-link d-flex justify-content-between">
                            Monitoring Penggajian
                            <i className={`fa ${openMenus.MonitoringPenggajian ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.MonitoringPenggajian && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Penggajian
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>
                    
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Cuti Pegawai</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Kompensasi Cuti</Link><div className="d-flex align-items-center">
                            <i className="fas fa-exchange-alt fa-md me-2"></i>
                            <span>Mutasi Pegawai</span>
                        </div>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Lembur</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Kompensasi UGD</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Surat - Surat</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Proposal Train</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Proposal Magan</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Potongan Masa</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Cuti Pegawai</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Kompensasi Cut</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Lembur</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitrg. Kompensasi UGD</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Absensi</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Gaji dan Pangk</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pengumuman Lowongan</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Riwayat Pegawai</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring KGB</Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Mon Kenaikan Pangkat</Link>
                    </li>*/}

                    </ul>
                )}
            </li>

        </div>
    );
};

export default HumanResources;