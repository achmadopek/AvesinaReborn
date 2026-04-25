import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Kegiatan = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        KegiatanEksternal: true,        // Main dropdown "Services"
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
                <Link to="#" onClick={() => toggleDropdown('KegiatanEksternal')} className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-calendar-alt fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Pejabat Teknis</span>
                    </div>
                    <i className={`fa ${openMenus.KegiatanEksternal ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.KegiatanEksternal && (
                    <ul className="submenu">

                        <li className="submenu-item">
                            <Link to={`/sdm/KegiatanPegawai`} onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-calendar-plus fa-md me-2"></i>
                                    <span>Kegiatan Pegawai</span>
                                </div>
                            </Link>
                        </li>
                        {/*
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Honorarium Penjabat
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Monitoring Keg Eksternal
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Kerjasama Pendidikan
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Sewa Ruang
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Incenerator
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Parkir
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Gizi Dapur
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Laundry
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Jenazah
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                        Sewa Lahan
                        </Link>
                    </li> */}
                    </ul>
                )}
            </li>

        </div>

    );
};

export default Kegiatan;