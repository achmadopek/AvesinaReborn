import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMediaQuery } from "react-responsive";
import ToDoList from "../../pages/user/ToDoList";
import { Modal, Button } from "react-bootstrap";
import { useNotification } from "../../context/NotificationContext";
import { formatRole } from "../../utils/FormtText";

const Topbar = ({ onToggleSidebar, onToggleRight, onLogout }) => {
  const {
    username,
    role,
    roles,
    setRole,
    applicationName,
    applicationDescription,
  } = useAuth();
  const { notificationCount, loadNotificationCount } = useNotification();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const dropdownRef = useRef(null);

  // Theme state
  const [theme, setTheme] = useState(
    localStorage.getItem("app-theme") || "light"
  );

  useEffect(() => {
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const switchTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="d-flex justify-content-between align-items-center px-3 py-2 bg-sae-liner-only "
      style={{
        backgroundColor: "var(--color-topbar-bg)",
        color: "var(--color-text-inverse)",
      }}
    >
      {/* KIRI: Sidebar + Judul */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="topbar-btn btn-lg"
          onClick={onToggleSidebar}
          style={{ padding: isMobile ? "12px 8px" : "" }}
        >
          ☰
        </button>

        <div style={{ marginLeft: "10px" }}>
          <div
            className="topbar-title"
            style={{ fontSize: isMobile ? "12pt" : "18pt"}}
          >
            {applicationName}
          </div>
          <div
            className="topbar-subtitle {isMobile ? mt-1 : mt-0}"
            style={{ fontSize: isMobile ? "5pt" : "8pt" }}
          >
            {applicationDescription ? applicationDescription : 'Subtittle here...'}
          </div>
        </div>
      </div>

      {/* KANAN: Theme Dropdown + User Dropdown + Right Toggle */}
      <div className="d-flex align-items-center gap-3" ref={dropdownRef}>
        {/* Theme Switch */}
        <div className="theme-switch-wrapper">
          <button
            className="theme-switch-btn"
            onClick={() => switchTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <i className="fas fa-sun"></i>
            ) : (
              <i className="fas fa-moon"></i>
            )}
            {!isMobile &&
              <span className="theme-switch-text">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            }
          </button>
        </div>

        {/* User Dropdown */}
        {username && role && (
          <div className="position-relative">
            <button
              className="topbar-btn btn-lg dropdown-toggle text-right"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ fontSize: "9pt" }}
            >
              <i className="fas fa-fw fa-user"></i>
              {!isMobile && (
                <>
                  {formatRole(username)} ({formatRole(role)})
                </>
              )}

              {!isMobile && (
                <>
                  {notificationCount > 0 && (
                    <span
                      className="badge-theme badge-blink"
                      style={{ marginLeft: "5px", fontSize: "8pt" }}
                    >
                      NEW
                    </span>
                  )}
                </>
              )}
            </button>

            {dropdownOpen && (
              <div
                className="position-absolute end-0 mt-2 p-2 dropdown-menu-theme shadow"
                style={{ minWidth: "220px", borderRadius: "4px" }}
              >
                {isMobile && (
                  <>
                    <div className="text-center p-2">
                      <i className="fas fa-fw fa-user"></i>
                      {formatRole(username)} ({formatRole(role)})
                    </div>
                    <hr style={{ margin: "4px 0" }} />
                  </>
                )}

                {/* Switch Role */}
                {roles &&
                  roles.length > 1 &&
                  roles
                    .slice()
                    .sort((a, b) => formatRole(a).localeCompare(formatRole(b)))
                    .map((r, idx) => (
                      <button
                        key={idx}
                        className={`dropdown-item-theme w-100 btn ${r === role ? "active" : ""}`}
                        style={{ padding: "6px 8px", fontSize: "9pt", textAlign: "left" }}
                        onClick={() => {
                          setRole(r);
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="fas fa-user-tag me-2"></i> {formatRole(r)}
                      </button>
                    ))}

                {roles && roles.length > 1 && (
                  <hr style={{ margin: "4px 0" }} />
                )}

                {/* Logout */}
                <button
                  className="dropdown-item-theme w-100 btn fs-5"
                  onClick={() => {
                    onLogout();
                    setDropdownOpen(false);
                  }}
                >
                  <i className="bi bi-arrow-repeat fs-5 me-2"></i> Ganti Aplikasi
                </button>
                <hr style={{ margin: "4px 0" }} />

                {/* Notifikasi */}
                <button
                  className="dropdown-item-theme w-100 btn"
                  style={{ padding: "8px" }}
                  onClick={() => {
                    setShowNotificationModal(true);
                    setDropdownOpen(false);
                  }}
                >
                  <i className="fas fa-fw fa-bell"></i> Notifikasi
                  {notificationCount > 0 && (
                    <span
                      className="badge-theme badge-blink"
                      style={{
                        top: "10px",
                        right: "-10px",
                        fontSize: "8pt",
                        borderRadius: "8px",
                      }}
                    >
                      {notificationCount} daftar tindakan
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right Toggle */}
        <button
          className="topbar-btn btn-lg"
          style={{ padding: isMobile ? "12px 8px" : "", marginLeft: "10px" }}
          onClick={onToggleRight}
        >
          ➤
        </button>
      </div>

      {/* Modal Notifikasi */}
      <Modal
        show={showNotificationModal}
        onHide={() => setShowNotificationModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-sae text-light">
          <Modal.Title>Daftar Tindakan (To Do List)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ToDoList
            onClose={() => {
              setShowNotificationModal(false);
              loadNotificationCount();
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowNotificationModal(false);
              loadNotificationCount();
            }}
          >
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
};

export default Topbar;
