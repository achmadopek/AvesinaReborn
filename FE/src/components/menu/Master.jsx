import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Master = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Master: true,        // Main dropdown "Services"
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
                    onClick={() => toggleDropdown('Master')}
                    className="sidebar-link-x d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-cogs fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Master</span>
                    </div>
                    <i className={`fa ${openMenus.Master ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>
                {openMenus.Master && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link to={`/sdm/MasterPegawai`}
                                className="submenu-link"
                                onClick={() => {
                                    if (isMobile) setShowSidebar(false);
                                    setShowRightContent(true);
                                }}>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-user-tie fa-md me-2"></i>
                                    <span>Pegawai</span>
                                </div>
                            </Link>
                        </li>
                    </ul>
                )}
            </li>

        </div>

    );
};

export default Master;