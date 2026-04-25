import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const UnitPelayananMedis = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            Unit Pelayanan Medis 
                <i className={`fa ${openMenus.TPP ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.TPP && (
            <ul className="submenu">

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Laboratorium</Link>
                </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('Radiology')} className="submenu-link d-flex justify-content-between">
                        Radiology
                        <i className={`fa ${openMenus.Radiology ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.Radiology && (
                        <ul className="submenu">

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Foto X-ray
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                CT-Scan
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                MRI
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                USG
                            </Link>
                            </li>
                            
                        </ul>
                        )}
                    </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('THT')} className="submenu-link d-flex justify-content-between">
                        THT
                        <i className={`fa ${openMenus.THT ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.THT && (
                        <ul className="submenu">

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Spirometer
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Audiometri
                            </Link>
                            </li>
                            
                        </ul>
                        )}
                    </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('Elektromedik')} className="submenu-link d-flex justify-content-between">
                        Elektromedik
                        <i className={`fa ${openMenus.Elektromedik ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.Elektromedik && (
                        <ul className="submenu">

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                ECT
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Brain Mapping
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                EEG
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                ECG
                            </Link>
                            </li>
                            
                        </ul>
                        )}
                    </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('Cardio')} className="submenu-link d-flex justify-content-between">
                        Cardio
                        <i className={`fa ${openMenus.Cardio ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.Cardio && (
                        <ul className="submenu">

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Treadmill
                            </Link>
                            </li>
                            
                        </ul>
                        )}
                    </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Patologi Anatomi</Link>
                </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Lab Patologi</Link>
                </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Mikrobiologi</Link>
                </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Fisio Theraphy</Link>
                </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Data Kegiatan Loket Pemba</Link>
                </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('MonitoringUPM')} className="submenu-link d-flex justify-content-between">
                        Monitoring UPM
                        <i className={`fa ${openMenus.MonitoringUPM ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.MonitoringUPM && (
                        <ul className="submenu">

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Lab
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring X-Ray
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring USG
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring CT-Scan
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring lab. Patologi
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring MRI
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring ECG
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Pemeriksaan
                            </Link>
                            </li>

                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Pemeriksaan Do
                            </Link>
                            </li>
                            
                        </ul>
                        )}
                    </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Verifikasi Dokter</Link>
                </li>

                <li className="submenu-item">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">Verifikasi Analyst</Link>
                </li>

            </ul>
            )}
            </li>

        </div>
    );
};
    
export default UnitPelayananMedis;