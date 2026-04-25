import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/layout/Layout";
import AppRoutes from "../routes/AppRoutes";

import Loader from "../components/common/Loader";

const ProtectedLayout = () => {
  const { token, login, isLoading, authReady } = useAuth();
  const [rightContent, setRightContent] = useState(null);
  const location = useLocation();

  const [isProcessingUrlToken, setIsProcessingUrlToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken && !token) {
      setIsProcessingUrlToken(true);

      (async () => {
        await login(urlToken);

        // bersihkan URL biar tidak kepanggil lagi
        window.history.replaceState({}, document.title, location.pathname);

        setIsProcessingUrlToken(false);
      })();
    }
  }, [location, login, token]);

  // Tahan render sampai semua siap
  if (isLoading || !authReady || isProcessingUrlToken) {
    return <Loader />;
  }

  // Redirect hanya kalau benar-benar tidak ada token
  if (!token) {
    return <Navigate to="/callback" replace />;
  }

  return (
    <Layout rightContent={rightContent}>
      <AppRoutes setRightContent={setRightContent} />
    </Layout>
  );
};

export default ProtectedLayout;