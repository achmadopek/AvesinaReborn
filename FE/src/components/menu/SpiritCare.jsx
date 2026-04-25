import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const SpiritCare = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('KamarPerawatan')} className="sidebar-link-x d-flex justify-content-between">
            Spirit Care 
            <i className={`fa ${openMenus.KamarPerawatan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.KamarPerawatan && (
            <ul className="submenu">

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Spiritual Care</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pertemuan</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pelayanan Pendukung</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Kerjasama</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Kunjungan Keluarga</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Kunjungan Pasien</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Mon. Spirit Care</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Mon. Kunjungan Keluarga</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Mon. Kunjungan Pasien</Link>
                </li>

            </ul>
            )}
            </li>

        </div>

    );
};
    
export default SpiritCare;