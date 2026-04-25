import API from "../axiosInstance";

// === Helper aman untuk request ===
const safeGet = async (url, params = {}, defaultValue = []) => {
  try {
    const res = await API.get(url, { params });
    return res?.data ?? defaultValue;
  } catch (error) {
    console.error(`[DashboardMobay] Error GET ${url}:`, error);
    return defaultValue;
  }
};

// === Base endpoint ===
const BASE = "/api/mobay/Dashboard";

// ================================
// 1. Grafik Dashboard
// ================================
export const getGrafikDashboard = ({ start, end, typeTglFilter }) =>
  safeGet(`${BASE}/grafik`, { start, end, typeTglFilter }, null);

// ================================
// 2. Tagihan Jatuh Tempo
// ================================
export const getTagihanJatuhTempo = ({ start, end, typeTglFilter }) =>
  safeGet(`${BASE}/jatuh-tempo`, { start, end, typeTglFilter }, {});

// ================================
// 3. Top 5 Tagihan Tertinggi
// ================================
export const getTopTagihan = ({ start, end, typeTglFilter }) =>
  safeGet(`${BASE}/top`, { start, end, typeTglFilter }, []);

// ================================
// 4. Bottom 5 Tagihan Terendah
// ================================
export const getBottomTagihan = ({ start, end, typeTglFilter }) =>
  safeGet(`${BASE}/bottom`, { start, end, typeTglFilter }, []);
