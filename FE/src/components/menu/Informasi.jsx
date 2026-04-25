import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Informasi = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('Informasi')} className="sidebar-link-x d-flex justify-content-between">
            Informasi 
            <i className={`fa ${openMenus.Informasi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.Informasi && (
            <ul className="submenu">

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Info Kamar</Link>
                </li>

                <li className="submenu-item">
                <Link to="/QueryTarikData" className="submenu-link-xx">Tarik Tambang</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Monitoring Pasien</Link>
                </li>

                <li className="submenu-item">
                <Link to="/HistoryPasien" className="submenu-link-xx">History Pasien</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Info Harga</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Monitoring Jadwal Kontrol</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Display Pasien R. Inap</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Display Pasien R. Jalan</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Display Kamar Kosong</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">Display Jadwal OK</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" className="submenu-link-xx">I-Care BPJS</Link>
                </li>
   
            </ul>
            )}
            </li>

        </div>

    );
};
    
export default Informasi;