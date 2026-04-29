import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import API from '../api/axiosInstance';

// === Context Setup ===
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// URL App Center dari .env (fallback lokal)
const APP_CENTER_URL = import.meta.env.VITE_APP_CENTER_URL || "http://localhost:5173";

export const AuthProvider = ({ children }) => {
  // === State utama Auth ===
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [nik, setNik] = useState('');
  const [peg_id, setPegId] = useState(''); //di token = employee_id
  const [user_id, setUserId] = useState(''); //di token = id
  const [nama, setNama] = useState('');
  const [roles, setRoles] = useState([]);
  const [units, setUnits] = useState([]);
  const [role, setRole] = useState('');
  const [role_id, setRoleID] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [applicationDescription, setApplicationDescription] = useState('');
  const [appPrefix, setAppPrefix] = useState("");
  const [dashboard, setDashboard] = useState('');

  // Loader state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMonitoringPage = () => {
    return window.location.pathname.startsWith("/monapp/MasterMonitoring");
  };

  // === Auto Logout karena Idle ===
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 menit
  const inactivityTimer = useRef(null);

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout();
      // Bisa tambahin notifikasi di sini
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (!token) return;

    // SKIP auto logout untuk monitoring
    if (isMonitoringPage()) {
      console.log("Monitoring mode aktif → idle logout dimatikan");
      return;
    }

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
    };
  }, [token]);

  // === Token Validation & Decode ===
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const isCallback = window.location.pathname.includes("callback");

      //console.log("INIT AUTH:", { token, isCallback });

      // PALING PENTING: skip semua logic saat callback
      if (isCallback) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // CASE: tidak ada token
        if (!token) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const decoded = jwtDecode(token);

        //console.log("DECODED TOKEN:", decoded);

        if (decoded.exp * 1000 < Date.now()) {
          const refreshed = await getValidToken();

          if (!refreshed && !isMonitoringPage()) {
            logout();
            return;
          }
        } else {
          setUserData(decoded);
        }

      } catch (error) {
        console.error("Token tidak valid:", error);
        logout();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Supaya token tetap hidup terus
  useEffect(() => {
    if (!token) return;
    if (!isMonitoringPage()) return;

    console.log("Monitoring mode → auto refresh aktif");

    const interval = setInterval(() => {
      getValidToken();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const firstSegment = window.location.pathname.split("/")[1];

    // abaikan /callback agar tidak dianggap sub-app
    if (!firstSegment || firstSegment === "callback") {
      setAppPrefix("");
    } else {
      setAppPrefix(`/${firstSegment}`);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("FORCE STOP LOADING (failsafe)");
      setIsLoading(false);
    }, 7000); // 7 detik

    return () => clearTimeout(timeout);
  }, []);


  // === Simpan data user dari decoded token ===
  const setUserData = (decoded) => {
    // console.log("SET USER DATA CALLED");
    const currentPrefix = window.location.pathname.split("/")[1];

    // DATA USER DASAR → TETAP SET
    setUsername(decoded.username || '');
    setPegId(decoded.employee_id || '');
    setNama(decoded.nama || '');
    setNik(decoded.nik || '');
    setUserId(decoded.id || '');

    if (decoded.roles && Array.isArray(decoded.roles)) {
      let currentApp = decoded.roles.find(r =>
        r.url?.replace("/", "") === currentPrefix
      );

      if (!currentApp) {
        currentApp = decoded.roles[0];
      }

      setApplicationName(currentApp.application_name || '');
      setApplicationId(currentApp.application_id || '');
      setRole((currentApp.roles?.[0]?.role_name || '').toLowerCase());
      setRoleID((currentApp.roles?.[0]?.role_id || ''));
      setRoles(currentApp.roles?.map(r => r.role_name) || []);
      setUnits(decoded.units || []);
      setApplicationDescription(currentApp.application_description || '');
      setDashboard(currentApp.dashboard || '/');

      //console.log("TOKEN DECODED:", decoded);
      //console.log("UNITS ROOT TOKEN:", decoded.units);
    }
  };

  // === Login (simpan token + decode user) ===
  const login = async (newToken) => {
    localStorage.setItem("token", newToken);

    const decoded = jwtDecode(newToken);
    setUserData(decoded);

    setToken(newToken);

    // kasih waktu React commit state
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  // === Logout (hapus token + reset state) ===
  const logout = () => {
    setToken(null);
    setUsername('');
    setRole('');
    setRoleID('');
    setRoles([]);
    setUnits([]);
    setNik('');
    setPegId('');
    setUserId('');
    setNama('');
    setApplicationName('');
    setApplicationDescription('');
    setIsLoading(false);
    setIsRefreshing(false);
    setDashboard('');

    localStorage.removeItem('token');

    // Redirect ke App Center (SSO)
    window.location.href = APP_CENTER_URL;
  };

  // === Refresh Token ===
  const refreshToken = async () => {
    try {
      setIsRefreshing(true);
      const res = await API.post('/api/refresh', {}, { withCredentials: true });
      if (res.data.token) {
        login(res.data.token);
        return true;
      }
    } catch (error) {
      console.error('Refresh token gagal:', error.response?.data || error.message);
    } finally {
      setIsRefreshing(false);
    }
    return false;
  };

  // === Token getter (validasi + auto refresh) ===
  const refreshingPromise = useRef(null);

  const getValidToken = async () => {
    if (!token) return null;

    const refreshWithTimeout = async () => {
      return Promise.race([
        refreshToken(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Refresh timeout")), 5000)
        ),
      ]);
    };

    try {
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (!isExpired) return token;

      if (refreshingPromise.current) {
        console.log("Menunggu proses refresh token lain...");
        await refreshingPromise.current;
        return localStorage.getItem("token");
      }

      console.warn("Token expired, mencoba refresh...");
      refreshingPromise.current = refreshWithTimeout();

      const success = await refreshingPromise.current;

      refreshingPromise.current = null;

      if (!success) {
        logout();
        return null;
      }

      return localStorage.getItem("token");

    } catch (error) {
      console.error("Gagal decode token:", error);
      logout();
      return null;
    }
  };

  // === Provider value ===
  const value = useMemo(
    () => ({
      token,
      username,
      applicationId,
      applicationName,
      applicationDescription,
      role,
      role_id,
      roles,
      units,
      nik,
      peg_id,
      user_id,
      nama,
      login,
      logout,
      setRole,
      isLoading,
      isRefreshing,
      getValidToken,
      appPrefix,
      dashboard,
    }),
    [
      token,
      username,
      applicationName,
      applicationDescription,
      role,
      role_id,
      roles,
      units,
      nik,
      peg_id,
      user_id,
      nama,
      isLoading,
      isRefreshing,
      appPrefix,
      dashboard,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
