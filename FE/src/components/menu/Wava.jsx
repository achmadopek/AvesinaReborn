import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Wava = ({ setShowSidebar, isMobile, setShowRightContent }) => {

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
          <Link
            to="/wava"
            className="sidebar-link-x d-flex align-items-center"
            onClick={() => {
              if (isMobile) setShowSidebar(false);
              setShowRightContent(true);
            }}
          >
            <i className="fas fa-home fa-fw me-2"></i> {/* Ikon Home */}
            <span>WAVA</span>
          </Link>
        </li>
      </div>
    );
};
    
export default Wava;