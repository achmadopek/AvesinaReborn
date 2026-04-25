import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const RenBang = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        RenBang: true,        // Main dropdown "Services"
        EntriSPM: true,
        VerValSPM: true,  // Submenu "Web Development"
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
                <Link to="#" onClick={() => toggleDropdown('RenBang')} className="sidebar-link-x d-flex justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-bullseye fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Ren Bang</span>
                    </div>
                    <i className={`fa ${openMenus.RenBang ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.RenBang && (
                    <ul className="submenu">

                        {/** Sensus SPM */}
                        <li className="submenu-item-x">
                            <Link to="#" onClick={() => toggleDropdown('EntriSPM')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-clipboard-list fa-md me-2"></i>
                                    <span>Sensus SPM</span>
                                </div>
                                <i className={`fa ${openMenus.EntriSPM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.EntriSPM && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/spm/EntriSPMHarian" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Entri Harian SPM</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/** Verifikasi SPM */}
                        <li className="submenu-item-x">
                            <Link to="#" onClick={() => toggleDropdown('VerValSPM')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-chart-area fa-md me-2"></i>
                                    <span>Monitoring</span>
                                </div>
                                <i className={`fa ${openMenus.VerValSPM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.VerValSPM && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/spm/MonitoringSPM" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>VerVal SPM</span>
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

export default RenBang;