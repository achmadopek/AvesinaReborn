// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import API from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const NAVBAR_HEIGHT = 50;
const APP_DEV_ID = 5;

// === SESUAIKAN PATH API DISINI (kalau prefix kamu beda) ===
const API_GET_ACTIVE_UNIT = "/api/rswj-inv/auth/me/active-unit";
const API_SET_ACTIVE_UNIT = "/api/rswj-inv/auth/me/active-unit";
const API_LIST_POLI = "/api/simrs/antrian/antrian-poli-reguler/list-poli"; // <- sesuaikan jika beda

export default function Sidebar({
  isOpen = true,
  isHoverOpen = false,
  isMobile = false,
  onMouseLeave,
  onClose,
}) {
  const { role, roles: roleList } = useAuth();

  const location = useLocation();
  const token = localStorage.getItem("token");
  const activeBasePath = localStorage.getItem("active_base_path") || "";

  const [menuData, setMenuData] = useState([]);
  const [openDropdown, setOpenDropdown] = useState({});

  // ===== ACTIVE UNIT STATE (global) =====
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [activeUnitName, setActiveUnitName] = useState(""); // nama poli/ruangan

  /* =========================
   * UTILITIES
   * ========================= */
  const getAuthHeaders = () => {
    const t = localStorage.getItem("token") || "";
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const decodeToken = (t) => {
    try {
      return JSON.parse(atob(t.split(".")[1]));
    } catch {
      return null;
    }
  };

  // - /public/* -> /{base}/public/*
  // - /secman/* | /wj-trabas/* | /app-dev/* -> /{base}/*
  const normalizePath = (rawPath) => {
    if (!rawPath) return "#";

    const base = (activeBasePath || "").replace(/\/+$/, "");
    const p = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    if (p.startsWith("/public-info")) return p;

    if (p.startsWith("/public/")) {
      return base ? `${base}${p}` : p;
    }

    const m = p.match(/^\/(secman|wj-trabas|app-dev|sim-rswj)(\/.*)?$/);
    if (m) {
      const rest = m[2] || "";
      return base ? `${base}${rest}` : p;
    }

    return p;
  };

  const buildMenuTree = (menus, parentId = null) =>
    (menus || [])
      .filter((m) => m.parent_id === parentId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((m) => ({ ...m, children: buildMenuTree(menus, m.menu_id) }));

  const pruneOrphans = (tree) => {
    const ids = new Set();
    const collect = (nodes) =>
      (nodes || []).forEach((n) => {
        ids.add(n.menu_id);
        collect(n.children || []);
      });
    collect(tree);

    const prune = (nodes) =>
      (nodes || [])
        .filter((n) => n.parent_id == null || ids.has(n.parent_id))
        .map((n) => ({ ...n, children: prune(n.children) }));

    return prune(tree);
  };

  const buildOpenDropdownFromPath = (menus, pathname) => {
    const openState = {};
    const dfs = (node, ancestors = []) => {
      let found = false;
      const finalPath = normalizePath(node.path);

      if (finalPath && pathname.startsWith(finalPath)) found = true;

      (node.children || []).forEach((c) => {
        if (dfs(c, [...ancestors, node.menu_id])) found = true;
      });

      if (found) ancestors.forEach((id) => (openState[id] = true));
      return found;
    };

    (menus || []).forEach((r) => dfs(r, []));
    return openState;
  };

  const collectPaths = (nodes, acc = []) => {
    (nodes || []).forEach((n) => {
      if (n.path) acc.push(normalizePath(n.path));
      collectPaths(n.children || [], acc);
    });
    return acc;
  };

  const isActive = (path) =>
    path && location.pathname.startsWith(normalizePath(path));

  /* =========================
   * FETCH ACTIVE UNIT (DB)
   * ========================= */
  useEffect(() => {
    const loadActiveUnit = async () => {
      if (!token) return;
      try {
        const res = await axios.get(API_GET_ACTIVE_UNIT, {
          headers: getAuthHeaders(),
        });

        const unitId = res.data?.unit_id ? String(res.data.unit_id) : null;
        setActiveUnitId(unitId);

        // resolve nama dari list-poli
        const name = await resolveUnitName(unitId);
        setActiveUnitName(name || ""); // kalau gagal, kosong
      } catch {
        setActiveUnitId(null);
        setActiveUnitName("");
      }
    };

    loadActiveUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!token) return;

      const decoded = decodeToken(token);
      if (!decoded?.roles?.length) return;

      const currentPrefix = window.location.pathname.split("/")[1];

      // cari aplikasi sesuai URL
      let selectedApp = decoded.roles.find(r =>
        r.url?.replace("/", "") === currentPrefix
      );

      if (!selectedApp) {
        selectedApp = decoded.roles[0];
      }

      const selectedAppId = Number(selectedApp.application_id);

      let roleIds = [];
      let applicationId = selectedAppId;

      // SUPER APP (gabung semua role)
      if (selectedAppId === APP_DEV_ID) {
        roleIds = (decoded.roles || []).flatMap(app =>
          (app.roles || []).map(r => r.role_id)
        );
        applicationId = APP_DEV_ID;

      } else {
        // NORMAL APP → filter sesuai role aktif
        roleIds = (selectedApp.roles || [])
          .filter(r => r.role_name.toLowerCase() === role)
          .map(r => r.role_id);
      }

      // kalau kosong, jangan lanjut
      if (!roleIds.length) {
        console.warn("Role ID tidak ditemukan untuk role:", role);
        setMenuData([]);
        return;
      }

      try {
        const res = await API.post(
          "/api/rswj-inv/auth/menus-role",
          {
            role_ids: roleIds,
            application_id: applicationId
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const menus = res.data || [];
        const tree = pruneOrphans(buildMenuTree(menus));

        setMenuData(tree);

        const paths = collectPaths(tree, []);
        localStorage.setItem("accessiblePaths", JSON.stringify(paths));

        setOpenDropdown(
          buildOpenDropdownFromPath(tree, window.location.pathname)
        );

      } catch (err) {
        console.error("Failed to fetch menus:", err);
      }
    };

    fetchMenu();

  }, [token, activeBasePath, role]);

  useEffect(() => {
    if (!menuData.length) return;
    setOpenDropdown((prev) => ({
      ...prev,
      ...buildOpenDropdownFromPath(menuData, location.pathname),
    }));
  }, [location.pathname, menuData]);

  const toggleDropdown = (id, level) => {
    setOpenDropdown((prev) => {
      const next = { ...prev };
      if (level === 1) {
        menuData.forEach((r) => {
          if (r.menu_id !== id) next[r.menu_id] = false;
        });
      }
      next[id] = !prev[id];
      return next;
    });
  };

  /* =========================
   * ACTIVE UNIT MODAL (SWEETALERT)
   * ========================= */
  const openUnitPicker = async () => {
    if (!token) return;

    try {
      const res = await axios.get(API_LIST_POLI, { headers: getAuthHeaders() });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      if (!list.length) {
        await Swal.fire({
          icon: "info",
          title: "Tidak ada ruangan",
          text: "Anda belum memiliki akses ruangan/poli.",
        });
        return;
      }

      const optionsHtml = list
        .map((p) => {
          const id = String(p.srvc_unit_id);
          const name = String(p.srvc_unit_nm || id);
          const selected = String(activeUnitId || "") === id ? "selected" : "";
          return `<option value="${id}" ${selected}>${name}</option>`;
        })
        .join("");

      const activeText = activeUnitId
        ? `${activeUnitName || activeUnitId}`
        : "-";

      const { value: pickedId } = await Swal.fire({
        title: "Pilih Ruangan",
        width: 520,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        focusConfirm: false,
        html: `
        <div style="text-align:left;">
          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            padding:10px 12px;
            border:1px solid rgba(0,0,0,0.12);
            border-radius:10px;
            background: rgba(0,0,0,0.02);
            margin-bottom:12px;
          ">
            <div>
              <div style="font-size:12px; opacity:.75; margin-bottom:2px;">Ruangan aktif</div>
              <div style="font-size:14px; font-weight:600;">${activeText}</div>
            </div>
            <div style="
              font-size:12px;
              padding:6px 10px;
              border-radius:999px;
              border:1px solid rgba(0,0,0,0.12);
              background:#fff;
              white-space:nowrap;
            ">
              Klik untuk ganti
            </div>
          </div>

          <label for="unitSelect" style="display:block; font-size:12px; opacity:.75; margin-bottom:6px;">
            Pilih ruangan/poli
          </label>

          <select id="unitSelect" style="
            width:100%;
            padding:10px 12px;
            border:1px solid rgba(0,0,0,0.18);
            border-radius:10px;
            font-size:14px;
            outline:none;
            background:#fff;
          ">
            ${optionsHtml}
          </select>

          <div style="margin-top:8px; font-size:12px; opacity:.7;">
            Total ruangan tersedia: <b>${list.length}</b>
          </div>
        </div>
      `,
        preConfirm: () => {
          const el = document.getElementById("unitSelect");
          return el?.value ? String(el.value) : "";
        },
      });

      if (!pickedId) return;

      await axios.post(
        API_SET_ACTIVE_UNIT,
        { unit_id: pickedId },
        { headers: getAuthHeaders() },
      );

      const pickedName =
        list.find((x) => String(x.srvc_unit_id) === String(pickedId))
          ?.srvc_unit_nm || pickedId;

      setActiveUnitId(String(pickedId));
      setActiveUnitName(String(pickedName));

      window.dispatchEvent(
        new CustomEvent("active-unit-changed", {
          detail: { unit_id: String(pickedId), unit_name: String(pickedName) },
        }),
      );

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ruangan aktif disimpan",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Gagal set ruangan";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  };

  const resolveUnitName = async (unitId) => {
    if (!unitId) return "";
    try {
      const res = await axios.get(API_LIST_POLI, { headers: getAuthHeaders() });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const found = list.find((x) => String(x.srvc_unit_id) === String(unitId));
      return found?.srvc_unit_nm ? String(found.srvc_unit_nm) : "";
    } catch {
      return "";
    }
  };

  /* =========================
   * RENDER MENU
   * ========================= */
  const renderMenu = (menu, level = 1) => {
    const hasChildren = menu.children?.length > 0;
    const finalPath = normalizePath(menu.path);

    const baseClass =
      level === 1
        ? "side-nav-link side-nav-link-root"
        : "side-nav-link side-nav-link-sub";

    const linkClass = `${baseClass} ${!hasChildren && isActive(menu.path) ? "active" : ""
      }`;

    return (
      <li key={menu.menu_id} className="side-nav-item">
        {hasChildren ? (
          <a
            className={baseClass}
            style={{ cursor: "pointer" }}
            onClick={() => toggleDropdown(menu.menu_id, level)}
          >
            {menu.icon && <i className={menu.icon}></i>}
            <span>{menu.name}</span>

            {level === 1 && (
              <span className="ms-auto">
                {openDropdown[menu.menu_id] ? (
                  <i className="uil-angle-up"></i>
                ) : (
                  <i className="uil-angle-down"></i>
                )}
              </span>
            )}
          </a>
        ) : (
          <Link
            to={finalPath}
            className={linkClass}
            onClick={() => isMobile && onClose?.()}
          >
            {menu.icon && <i className={menu.icon}></i>}
            <span>{menu.name}</span>
          </Link>
        )}

        {hasChildren && (
          <div
            className={`collapse ${openDropdown[menu.menu_id] ? "show" : ""}`}
          >
            <ul
              className={
                level === 1 ? "side-nav-second-level" : "side-nav-third-level"
              }
            >
              {menu.children.map((c) => renderMenu(c, level + 1))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  const visible = isOpen || isHoverOpen;

  return (
    <div
      className={`leftside-menu ${visible ? "" : "closed"} ${isMobile ? "mobile" : ""
        }`}
      onMouseLeave={onMouseLeave}
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100% - ${NAVBAR_HEIGHT}px)`,
        width: '100%',
      }}
    >
      <div className="h-100" data-simplebar>
        <ul className="side-nav">
          {/*<li className="side-nav-item mb-2">
            <a
              href="#"
              style={{
                display: "block",
                fontSize: "14px",
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontWeight: 600,
                paddingLeft: 0,
                paddingRight: 0,
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              }}
              onClick={(e) => {
                e.preventDefault();
                openUnitPicker();
              }}
              title="Klik untuk memilih ruangan aktif"
            >
              {activeUnitName ? (
                <div className="side-nav-title">
                  UNIT ACTIVE:
                  <br />
                  <span style={{ fontWeight: 700 }}>{activeUnitName}</span>
                </div>
              ) : (
                <div className="side-nav-title">Pilih Ruangan</div>
              )}
            </a>
          </li>*/}

          <li className="side-nav-title {isMobile ? mt-4 : mt-0}">NAVIGATION</li>

          {menuData.length === 0 && (
            <li className="text-muted px-3">Tidak ada menu</li>
          )}

          {menuData.map((m) => renderMenu(m))}
        </ul>
      </div>
    </div>
  );
}
