// components/layout/Layout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SidebarMTH from "./SidebarMTH";
import Topbar from "./Topbar";
import RightContent from "./Rightbar";
import { useAuth } from "../../context/AuthContext";

const Layout = ({ children }) => {
  const [rightContent, setRightContent] = useState(null);

  // Responsive states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [showRightContent, setShowRightContent] = useState(
    window.innerWidth >= 768
  );

  const { logout, role, applicationName } = useAuth();

  // === Handle Responsiveness (resize) ===
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(
        !mobile && applicationName !== "WJ-SIGMA" && role !== "pegawai"
      );
      setShowRightContent(
        !mobile &&
        applicationName !== "WJ-SIGMA" &&
        applicationName !== "WJ-MOBAY"
      );
    };
    handleResize(); // initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [role]);

  // === Force hide sidebar/rightbar untuk role tertentu ===
  useEffect(() => {
    if (applicationName === "WJ-SIGMA") {
      setShowSidebar(false);
      setShowRightContent(false);
    } else if (applicationName === "WJ-MOBAY") {
      setShowRightContent(false);
    }
  }, [role]);

  // === Toggle Sidebar ===
  const handleToggleSidebar = () => {
    if (applicationName === "WJ-SIGMA") return;
    setShowSidebar((prev) => {
      if (isMobile && !prev) setShowRightContent(false);
      return !prev;
    });
  };

  // === Toggle Rightbar ===
  const handleToggleRightContent = () => {
    if (applicationName === "WJ-SIGMA" || applicationName === "WJ-MOBAY")
      return;
    setShowRightContent((prev) => {
      if (isMobile && !prev) setShowSidebar(false);
      return !prev;
    });
  };

  // === Logout ===
  const handleLogout = () => logout();

  return (
    <div className="d-flex" style={{ minHeight: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      {applicationName !== "WJ-SIGMA" && showSidebar && (
        <div
          className="border-end bg-sae-only custom-scroll"
          style={{
            width: isMobile ? "100%" : "250px",
            position: isMobile ? "absolute" : "fixed",
            zIndex: 1001,
            height: "100vh",
            paddingBottom: "75px",
            top: isMobile ? "50px" : "45px",
            flexShrink: 0,
            overflow: "auto",
          }}
        >
          {/*<Sidebar
            setShowSidebar={setShowSidebar}
            setShowRightContent={setShowRightContent}
            isMobile={isMobile}
          />
          <hr />*/}
          <br />
          <SidebarMTH
            setShowSidebar={setShowSidebar}
            setShowRightContent={setShowRightContent}
            isMobile={isMobile}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      )}

      {/* Wrapper utama */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {/* Topbar */}
        <div
          style={{
            zIndex: 1001,
            position: "fixed",
            width: "100%",
          }}
        >
          <Topbar
            onToggleSidebar={handleToggleSidebar}
            onToggleRight={handleToggleRightContent}
            onLogout={handleLogout}
          />
        </div>

        {/* Konten + Rightbar */}
        <div
          className="d-flex flex-grow-1"
          style={{
            marginTop: isMobile ? "65px" : "70px",
            marginLeft: isMobile ? "0" : !showSidebar ? 0 : "255px",
            height: "calc(100vh - 58px)",
          }}
        >
          {/* Konten utama */}
          <div
            className="flex-grow-1 custom-scroll p-2 me-2"
            style={{
              minWidth: 0,
              overflowY: "auto",
              height: "calc(100% - 30px)",
            }}
          >
            {/* Clone children supaya bisa akses setRightContent */}
            {React.cloneElement(children, { setRightContent })}
          </div>

          {/* Rightbar */}
          {showRightContent && (
            <div
              className="border-start custom-scroll"
              style={{
                width: isMobile ? "100%" : "320px",
                backgroundColor: isMobile ? "white" : "none",
                position: isMobile ? "absolute" : "relative",
                top: isMobile ? "56px" : 0,
                paddingTop: isMobile ? "8px" : 0,
                paddingBottom: isMobile ? "8px" : 0,
                zIndex: 1000,
                overflowY: "auto",
                height: "calc(100vh - 82px)",
                flexShrink: 0,
              }}
            >
              <RightContent
                content={rightContent}
                onClose={() => setShowRightContent(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Credit */}
      <div
        className="text-center bg-sae"
        style={{
          position: "fixed",
          bottom: "0px",
          left: 0,
          right: 0,
          zIndex: 1050,
          pointerEvents: "none",
        }}
      >
        <span
          className="px-3 py-1 rounded-pill shadow-sm"
          style={{
            fontSize: "0.75rem",
            fontWeight: "500",
            color: "white",
            display: "inline-block",
          }}
        >
          © {new Date().getFullYear()}{" "}
          <span style={{ color: "#4e73df", fontWeight: "600" }}>ITRSWJ</span>
        </span>
      </div>
    </div>
  );
};

export default Layout;
