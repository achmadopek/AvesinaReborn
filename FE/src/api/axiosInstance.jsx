import axios from "axios";

let getValidTokenFn = null;

// inject dari AuthContext
export const setAuthHelpers = (helpers) => {
  getValidTokenFn = helpers.getValidToken;
};

// === API Instance ===
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  withCredentials: true,
});

// === REFRESH LOCK (anti multiple refresh) ===
let isRefreshing = false;
let refreshSubscribers = [];

// daftar request yang nunggu token baru
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// === REQUEST INTERCEPTOR ===
API.interceptors.request.use(async (config) => {
  // skip refresh endpoint
  if (config.url?.includes("/api/refresh")) {
    return config;
  }

  if (getValidTokenFn) {
    try {
      const token = await getValidTokenFn();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Gagal mendapatkan token:", err);
    }
  }

  return config;
});

// === RESPONSE INTERCEPTOR ===
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // kalau bukan 401 → lempar aja
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // hindari infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // kalau sedang refresh → tunggu
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(API(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      // pakai getValidToken → sudah include refresh logic
      const newToken = await getValidTokenFn();

      if (!newToken) {
        throw new Error("Token refresh gagal");
      }

      onRefreshed(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return API(originalRequest);
    } catch (err) {
      console.error("Refresh gagal di interceptor:", err);

      // fallback → redirect logout global
      window.location.href =
        import.meta.env.VITE_APP_CENTER_URL || "/";

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;