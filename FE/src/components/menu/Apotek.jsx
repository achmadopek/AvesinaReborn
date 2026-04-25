import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Apotek = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('poli')} className="sidebar-link-x d-flex justify-content-between">
            Apotek 
            <i className={`fa ${openMenus.poli ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.poli && (
            <ul className="submenu">

                    <li className="submenu-item">
                      <Link to="#" onClick={() => toggleDropdown('TPPDokter')} className="submenu-link d-flex justify-content-between">
                      Penjualan
                      <i className={`fa ${openMenus.TPPDokter ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                      </Link>
                      {openMenus.TPPDokter && (
                      <ul className="submenu">
                          <li className="submenu-item">
                          <Link to="/under-construction" className="submenu-link-xx">
                              Resep Internal
                          </Link>
                          </li>
                          <li className="submenu-item">
                          <Link to="/under-construction" className="submenu-link-xx">
                              Resep Eksternal
                          </Link>
                          </li>
                          <li className="submenu-item">
                          <Link to="/under-construction" className="submenu-link-xx">
                              Non Resep
                          </Link>
                          </li>
                          <li className="submenu-item">
                          <Link to="/under-construction" className="submenu-link-xx">
                              Langsung
                          </Link>
                          </li>
                          <li className="submenu-item">
                          <Link to="/under-construction" className="submenu-link-xx">
                              E-Resep
                          </Link>
                          </li>

                      </ul>
                      )}
                    </li>  

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pengembalian</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Resep</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Penjualan</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Pengembalian</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Pasien</Link>
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Entri Tagihan Apotik</Link>
                </li>

            </ul>
            )}
            </li>

        </div>

    );
};
    
export default Apotek;