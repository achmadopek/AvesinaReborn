import { Link } from 'react-router-dom';
import { useState } from 'react';

export const MonitoringBPJS = ({ setShowSidebar, isMobile, setShowRightContent }) => {


    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        MonitoringBPJS: true,        // Main dropdown "Services"
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
                <Link
                    to="#"
                    onClick={() => toggleDropdown('MonitoringBPJS')}
                    className="sidebar-link-x d-flex justify-content-between align-items-center"
                >
                    <div className="d-flex align-items-center">
                        <i className="fas fa-desktop fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Monitoring</span>
                    </div>
                    <i className={`fa ${openMenus.MonitoringBPJS ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.MonitoringBPJS && (
                    <ul className="submenu">

                        <li className="submenu-item">
                            <Link
                                to={`/monapp/MasterMonitoring`}
                                onClick={() => {
                                    if (isMobile) setShowSidebar(false);
                                    setShowRightContent(false);
                                }}
                                className="submenu-link"
                            >
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-chart-line fa-md me-2"></i>
                                    <span>Dashboard Monitor</span>
                                </div>
                            </Link>
                        </li>
                        {/*<li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Monitoring Pendaftaran Vc
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Laporan Data Kunjungan
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Laporan Data KLAIM
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    5 Kunjungan Terakhir
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Rujukan Pasien
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Rencana Kontrol/SPRI
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Monitoring Verif Klaim
                    </Link>
                </li>
                <li className="submenu-item disabled-link">
                    <Link to="/under-construction" onClick={() => { if (isMobile) setShowSidebar(false); }} className="submenu-link">
                    Monitoring Ketersediaan K
                    </Link>
                </li>*/}

                    </ul>
                )}
            </li>

        </div>

    );
};

export default MonitoringBPJS;