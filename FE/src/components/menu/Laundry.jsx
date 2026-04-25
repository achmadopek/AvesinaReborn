import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Laundry = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            Laundry 
            <i className={`fa ${openMenus.KamarPerawatan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.KamarPerawatan && (
            <ul className="submenu">

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Permintaan Pasien</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pencucian</Link>
                </li>
                    
                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('TPPDokter')} className="submenu-link d-flex justify-content-between">
                        Antar Unit
                        <i className={`fa ${openMenus.TPPDokter ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.TPPDokter && (
                        <ul className="submenu">
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Permintaan
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Pengiriman
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Penerimaan
                            </Link>
                            </li>

                        </ul>
                        )}
                    </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pemusnahan</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Item</Link>
                </li>           
                    
            </ul>
            )}
            </li>

        </div>

    );
};
    
export default Laundry;