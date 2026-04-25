import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const KomiteMutu = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        KomiteMutu: true,        // Main dropdown "Services"
        EntriINM: true, // Submenu "Web Development"
        VerValINM: true,     // Sub-submenu "Pendaftaran"
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
                <Link to="#" onClick={() => toggleDropdown('KomiteMutu')} className="sidebar-link-x d-flex justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-medal fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Komite Mutu</span>
                    </div>
                    <i className={`fa ${openMenus.KomiteMutu ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.KomiteMutu && (
                    <ul className="submenu">

                        {/* Sensus INM */}
                        <li className="submenu-item-x">
                            <Link to="#" onClick={() => toggleDropdown('EntriINM')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-clipboard-list fa-md me-2"></i>
                                    <span>Sensus INM</span>
                                </div>
                                <i className={`fa ${openMenus.EntriINM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.EntriINM && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/inm/EntriINMHarian" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Entri Harian INM</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/** Verifikasi INM */}
                        <li className="submenu-item-x">
                            <Link to="#" onClick={() => toggleDropdown('VerValINM')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-chart-area fa-md me-2"></i>
                                    <span>Monitoring</span>
                                </div>
                                <i className={`fa ${openMenus.VerValINM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.VerValINM && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/inm/MonitoringINM" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>VerVal INM</span>
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

export default KomiteMutu;