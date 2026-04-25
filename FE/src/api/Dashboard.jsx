import API from "../axiosInstance";

// === Helper aman untuk request ===
const safeGet = async (url, params = {}, defaultValue = []) => {
  try {
    const res = await API.get(url, { params });
    return res?.data ?? defaultValue;
  } catch (error) {
    console.error(`[DashboardTHP] Error GET ${url}:`, error);
    return defaultValue;
  }
};

// === Base path untuk endpoint ===
const BASE = "/api/DashboardTHP";

// === 1. Ambil hasil generate potongan pegawai berdasarkan status & periode ===
export const getData = (peg_id, periode) =>
  safeGet(`${BASE}`, { peg_id, periode }, null);

// === 2. Ambil semua data THP pegawai ===
export const getAllData = (peg_id) =>
  safeGet(`${BASE}/all`, { peg_id });

// === 3. Ambil data untuk grafik (Pendapatan, Potongan, Bersih) ===
export const getDataCart = (peg_id) =>
  safeGet(`${BASE}/cart`, { peg_id });

// === 4. Ambil Top 5 THP ===
export const getTopTHP = (periode) =>
  safeGet(`${BASE}/top`, { periode });

// === 5. Ambil Bottom 5 THP ===
export const getBottomTHP = (periode) =>
  safeGet(`${BASE}/bottom`, { periode });
