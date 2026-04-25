import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const RekamMedis = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
      const [openMenus, setOpenMenus] = useState({
        services: false,        // Main dropdown "Services"
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
                <Link to="#" onClick={() => toggleDropdown('RekamMedis')} className="sidebar-link-x d-flex justify-content-between">
                Rekam Medis 
                <i className={`fa ${openMenus.RekamMedis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.RekamMedis && (
                <ul className="submenu">
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Mon. Discharge Summ
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Entry Discharge Summary
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Pengkodean
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Berkas Rekam Medis
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Permintaan Rekam Medis
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Entri Kelengkapan Berkas
                        </Link>
                    </li>
                    <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                        Mon. Kelengkapan Berkas
                        </Link>
                    </li>
                </ul>
                )}
            </li>
        </div>
    );
};
    
export default RekamMedis;