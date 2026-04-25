import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const KamarPerawatan = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            Kamar Perawatan
            <i className={`fa ${openMenus.KamarPerawatan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.KamarPerawatan && (
            <ul className="submenu">

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Antrian MRS</Link>
                </li>

                <li className="submenu-item">
                <Link to="#" onClick={() => toggleDropdown('MedicalCheckUp')} className="submenu-link d-flex justify-content-between">
                    Pelayanan
                    <i className={`fa ${openMenus.MedicalCheckUp ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.MedicalCheckUp && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                            Pemeriksaan Komplit
                            </Link>
                        </li>
                        
                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('TPPDokter')} className="submenu-link-xx d-flex justify-content-between">
                            Mutasi
                            <i className={`fa ${openMenus.TPPDokter ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.TPPDokter && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xxx">
                                    Mutasi Konsul
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xxx">
                                    Mutasi Dokter
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xxx">
                                    Mutasi Ruang
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xxx">
                                    Mutasi Makan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xxx">
                                    Mutasi Perawatan
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            Measurement Harian
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            Asuhan Keperawatan
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            MRS
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            KRS
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            Rencana KRS
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            Tagihan Rawat Inap
                            </Link>
                        </li>
                        <li className="submenu-item">
                            <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                            Rujukan Pasien
                            </Link>
                        </li>
                    </ul>
                )}
                </li>

                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Informasi Tempat Kosong</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitrng. Rawat Inap</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitoring KRS</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitrng. Kamar Steril</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitrng. Jadwal Visite</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Cetak Surat</Link>
                </li>
                <li className="submenu-item">
                <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Monitrng. Rencana KRS</Link>
                </li>
            </ul>
            )}
            </li>

        </div>

    );
};
    
export default KamarPerawatan;