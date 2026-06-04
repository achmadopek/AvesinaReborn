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
      if (role === "pegawai" && !peg_id) {
        return;
      }

      const result = await fetchPaginatedData(
        1,
        1000,
        role,
        peg_id
      );

      setNotificationCount(result.total || 0);
    } catch (err) {
      console.log("ERR DETAIL", {
        code: err.code,
        message: err.message,
        status: err.response?.status,
      });
    }
  }, [role, peg_id]);

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
