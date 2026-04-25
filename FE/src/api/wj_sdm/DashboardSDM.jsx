import API from "../axiosInstance";

// === Helper aman untuk request ===
const safeGet = async (url, params = {}, defaultValue = []) => {
  try {
    const res = await API.get(url, { params });
    return res?.data ?? defaultValue;
  } catch (error) {
    console.error(`[DashboardSDM] Error GET ${url}:`, error);
    return defaultValue;
  }
};

// === Base endpoint ===
const BASE = "/api/sdm/Dashboard";

export const getGrafikDashboard = () =>
  safeGet(`${BASE}/grafik`, {}, null);

export const getAlertAdministratif = () =>
  safeGet(`${BASE}/alert`, {}, {});

export const getTopRanking = (by = "education") =>
  safeGet(`${BASE}/top`, { by }, []);

export const getBottomRanking = (by = "education") =>
  safeGet(`${BASE}/bottom`, { by }, []);
