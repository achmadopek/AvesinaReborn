// context/NotificationContext.js
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { fetchPaginatedData } from "../api/Notification";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const { role, peg_id } = useAuth();

  const loadNotificationCount = useCallback(async () => {
    try {
      // Cegah fetch kalau peg_id belum ada (misal AuthContext belum selesai init)
      if (role === "pegawai" && !peg_id) {
        console.warn("Skip fetch notifikasi: peg_id belum siap");
        return;
      }

      const result = await fetchPaginatedData(1, 1000, role, peg_id);
      setNotificationCount(result.total || 0);
    } catch (err) {
      console.error("Gagal fetch notifikasi:", err);
    }
  }, [role, peg_id]); // tambahkan peg_id supaya ikut update

  useEffect(() => {
    loadNotificationCount();

    // auto refresh setiap 60 detik
    const interval = setInterval(loadNotificationCount, 60000);
    return () => clearInterval(interval);
  }, [loadNotificationCount]);

  return (
    <NotificationContext.Provider
      value={{ notificationCount, setNotificationCount, loadNotificationCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
