import { Link } from "react-router-dom";
import { useState } from "react";

export const Terjang = ({ setShowSidebar, isMobile, setShowRightContent }) => {
  const [openMenus, setOpenMenus] = useState({ Terjang: true });

  const toggleDropdown = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <div>
      <li className="sidebar-item-x">
        <Link
          to="#"
          onClick={() => toggleDropdown("Terjang")}
          className="sidebar-link-x d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <i className="fas fa-stethoscope fa-fw me-2"></i>
            <span>Terjang</span>
          </div>
          <i
            className={`fa ${openMenus.Terjang ? "fa-chevron-up" : "fa-chevron-down"} dropdown-arrow`}
          ></i>
        </Link>

        {openMenus.Terjang && (
          <ul className="submenu">
            <li className="submenu-item">
              <Link
                to={`/terjang/TrackingPenunjang`}
                className="submenu-link"
                onClick={() => {
                  if (isMobile) setShowSidebar(false);
                  setShowRightContent(true);
                }}
              >
                <div className="d-flex align-items-center">
                  <i className="fas fa-file-medical fa-md me-2"></i>
                  <span>Tracking Penunjang</span>
                </div>
              </Link>
            </li>
          </ul>
        )}
      </li>
    </div>
  );
};

export default Terjang;
