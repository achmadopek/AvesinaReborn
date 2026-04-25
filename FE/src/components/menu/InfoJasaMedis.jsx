import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const InfoJasaMedis = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('InfoJasaMedis')} className="sidebar-link-x d-flex justify-content-between">
            Info Jasa Medis
            <i className={`fa ${openMenus.InfoJasaMedis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.InfoJasaMedis && (
            <ul className="submenu">

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Download Template
                    </Link>
                </li>
                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Import Jasa Pelayanan
                    </Link>
                </li>
                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Info Jasa Medis Per bulan
                    </Link>
                </li>

            </ul>
            )}
            </li>

        </div>

    );
};
    
export default InfoJasaMedis;