// App.jsx
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "react-toastify";

// Layout & Routes
import Layout from "./components/layout/Layout";
import AppRoutes from "./routes/AppRoutes";

// Pages
import Unauthorized from "./pages/user/Unauthorized";
import Callback from "./pages/user/Callback";

// Assets & Styles
import bgBody from "./assets/bgbody.png";
import "./App.css";

// Axios helper injection
import { setAuthHelpers } from "./api/axiosInstance";

/**
 * AppWrapper
 * - Background dekoratif global.
 * - Tidak interaktif (pointerEvents: none).
 */
function AppWrapper() {
  return <div className="app-bg" />;
}

/**
 * ProtectedLayout
 * - Layout utama yang butuh autentikasi.
 * - Jika ada token → render Layout + AppRoutes.
 * - Jika tidak ada token → redirect ke /callback.
 */
const ProtectedLayout = () => {
  const { token, isLoading } = useAuth();
  const [rightContent, setRightContent] = useState(null);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  return token ? (
    <Layout rightContent={rightContent}>
      <AppRoutes setRightContent={setRightContent} />
    </Layout>
  ) : (
    <Navigate to="/callback" />
  );
};

/**
 * AppInitializer
 * - Hook sekali untuk inject helper dari AuthContext ke axiosInstance.
 * - Supaya axios bisa otomatis ambil/refresh token via AuthContext.
 */
const AppInitializer = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      setAuthHelpers({ getValidToken: auth.getValidToken });
    }
  }, [auth]);

  return null; // komponen ini tidak render apa-apa
};

/**
 * App (Root Component)
 * - Bungkus Router + Context Provider.
 * - Setup global route (callback, unauthorized, protected).
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppInitializer /> {/* Inject AuthContext ke axios */}
          <AppWrapper /> {/* Background global */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar
          />
          <Routes>
            {/* Callback utama */}
            <Route path="/callback" element={<Callback />} />

            {/* Callback dinamis (untuk /sdm/callback, /thp/callback, /mobay/callback, dll) */}
            <Route path="/:app/callback" element={<Callback />} />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Semua route lain → protected */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
