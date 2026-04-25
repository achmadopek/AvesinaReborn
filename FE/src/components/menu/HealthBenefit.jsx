import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const HealthBenefit = ({
  setShowSidebar,
  isMobile,
  setRightContent,
}) => {
  // Track the state of each dropdown (menu, submenu, and sub-submenu)
  const [openMenus, setOpenMenus] = useState({
    services: false, // Main dropdown "Services"
    webDevelopment: false, // Submenu "Web Development"
    pendaftaran: false, // Sub-submenu "Pendaftaran"
  });

  // Toggle a specific dropdown (menu, submenu, or sub-submenu)
  const toggleDropdown = (menu) => {
    setOpenMenus((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu], // Toggle the specific menu/submenu/sub-submenu
    }));
  };

  return (
    <div>
      {/* First-level Dropdown */}
      <li className="sidebar-item-x">
        <Link
          to="#"
          onClick={() => toggleDropdown("HealthBenefit")}
          className="sidebar-link-x d-flex justify-content-between"
        >
          Health Benefit
          <i
            className={`fa ${
              openMenus.HealthBenefit ? "fa-chevron-up" : "fa-chevron-down"
            } dropdown-arrow`}
          ></i>
        </Link>
        {openMenus.HealthBenefit && (
          <ul className="submenu">
            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Entry Worksheet
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Entry Claim Pegawai
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Entry Faktur
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Entry Claim Provider
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Monitoring Worksheet
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Monitoring Claim Pegawai
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Monitoring Claim Provider
              </Link>
            </li>

            <li className="submenu-item">
              <Link to="/under-construction" className="submenu-link-xx">
                Monitoring Faktur
              </Link>
            </li>
          </ul>
        )}
      </li>
    </div>
  );
};

export default HealthBenefit;
