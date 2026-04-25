import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Poli = ({ setShowSidebar, isMobile, setRightContent }) => {

  // Track the state of each dropdown (menu, submenu, and sub-submenu)
  const [openMenus, setOpenMenus] = useState({
    poli: true,        // Main dropdown "Services"
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
          <div className="d-flex align-items-center">
            <i className="fas fa-clinic-medical fa-fw me-2"></i> {/* Ikon Master */}
            <span>Poliklinik</span>
          </div>
          <i className={`fa ${openMenus.poli ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
        </Link>
        {openMenus.poli && (
          <ul className="submenu">

            {/*<li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Antrian Semua Unit</Link>
                </li>*/}
            <li className="submenu-item">
              <Link to="/antrian/AntrianPasien" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                  <i className="fas fa-stream"></i>
                  <span>Antrian Pasien</span>
                </div>
              </Link>
            </li>

            {/*<li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pemeriksaan Tunggal</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Pemeriksaan Komplit</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Rujukan Pasien</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Cetak Surat</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Rekap UGD</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring Rawat Jalan</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Antrikan MRS</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Entri Imunisasi</Link>
                </li>*/}
          </ul>
        )}
      </li>

    </div>

  );
};

export default Poli;