import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const TPP = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('TPP')} className="sidebar-link-x d-flex justify-content-between">
                TPP
                <i className={`fa ${openMenus.TPP ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.TPP && (
                <ul className="submenu">
                <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Pendaftaran')} className="submenu-link d-flex justify-content-between">
                    Pendaftaran
                    <i className={`fa ${openMenus.Pendaftaran ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Pendaftaran && (
                    <ul className="submenu">
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Pendaftaran Pasien
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Pasien Baru
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Pendaftaran Debitur
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Cek Kepesertaan
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            User MJKN
                        </Link>
                        </li>
                    </ul>
                    )}
                </li>

                <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Dokter')} className="submenu-link d-flex justify-content-between">
                    Dokter
                    <i className={`fa ${openMenus.Dokter ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Dokter && (
                    <ul className="submenu">
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Entri Jadwal
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Lihat Jadwal
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Absen Dokter
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Janji Pertemuan
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Rekap Monitrg. Pertemuan
                        </Link>
                        </li>
                        <li className="submenu-item">
                        <Link to="/under-construction" className="submenu-link-xx">
                            Monitoring Pertemuan
                        </Link>
                        </li>
                    </ul>
                    )}
                </li>


                <li className="submenu-item">
                    <Link to="/under-construction" className="submenu-link d-flex justify-content-between">MRS</Link>
                </li>
                <li className="submenu-item">
                    <Link to="/under-construction" className="submenu-link d-flex justify-content-between">Monitrg. Pendaftaran Baru</Link>
                </li>
                <li className="submenu-item">
                    <Link to="/MasterAnjungan" className="submenu-link d-flex justify-content-between">Anjungan Pendaf. Mandiri</Link>
                </li>
                </ul>
            )}
            </li>

        </div>
    );
};
    
export default TPP;