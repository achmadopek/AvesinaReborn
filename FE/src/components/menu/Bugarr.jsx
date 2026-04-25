import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Bugarr = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Bugarr: true,        // Main dropdown "Services"
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
                    onClick={() => toggleDropdown('Bugarr')}
                    className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-cogs fa-fw me-2"></i> {/* Ikon Bugarr */}
                        <span>BUGARR</span>
                    </div>
                    <i className={`fa ${openMenus.Bugarr ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.Bugarr && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link to={`/bugarr/EntriBugarr`}
                                className="submenu-link"
                                onClick={() => {
                                    if (isMobile) setShowSidebar(false);
                                    setShowRightContent(true);
                                }}>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-clipboard-list fa-md me-2"></i>
                                    <span>Lapor Upload</span>
                                </div>
                            </Link>
                        </li>

                        <li className="submenu-item">
                            <Link to={`/bugarr/MonitoringBugarr`}
                                className="submenu-link"
                                onClick={() => {
                                    if (isMobile) setShowSidebar(false);
                                    setShowRightContent(true);
                                }}>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-chart-area fa-md me-2"></i>
                                    <span>Monitoring</span>
                                </div>
                            </Link>
                        </li>
                    </ul>
                )}
            </li>

        </div>

    );
};

export default Bugarr;