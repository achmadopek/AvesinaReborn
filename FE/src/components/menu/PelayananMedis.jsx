import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const PelayananMedis = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Laporan: true, // buka toggle
        MedicalCheckUp: true
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
                <Link to="#" onClick={() => toggleDropdown('Laporan')} className="sidebar-link-x d-flex justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-hospital-user fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Pelayanan Medis</span>
                    </div>
                    <i className={`fa ${openMenus.Laporan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.Laporan && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('MedicalCheckUp')} className="submenu-link d-flex justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-stethoscope fa-md me-2"></i>
                                    <span>Medical Check Up</span>
                                </div>
                                <i className={`fa ${openMenus.MedicalCheckUp ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.MedicalCheckUp && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to="/mcu/PesertaMCU" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>MCU CPMI</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to="/mcu/PemeriksaanBiometrik" className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Biometrik CPMI</span>
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

export default PelayananMedis;