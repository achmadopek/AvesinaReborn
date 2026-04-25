import { Link } from 'react-router-dom';
import { useState } from 'react';

export const LaporanMutu = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Laporan: true,        // Main dropdown "Services"
        LaporanINM: true,  // Submenu "Web Development"
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
                            <Link to="#" onClick={() => toggleDropdown('LaporanINM')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-calculator fa-md me-2"></i>
                                    <span>Rekap INM</span>
                                </div>
                                <i className={`fa ${openMenus.LaporanINM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.LaporanINM && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/inm/RekapRingkasINM" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Rekapitulasi INM</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                    </ul>
                )}
            </li>

        </div>

    );
};

export default LaporanMutu;