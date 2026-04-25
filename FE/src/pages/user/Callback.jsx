import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const Callback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { app } = useParams();

  const APP_CENTER_API = import.meta.env.VITE_APP_CENTER_API;
  const APP_CENTER_URL = import.meta.env.VITE_APP_CENTER_URL;

  const hasExchanged = useRef(false); // kunci penting

  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;

    const exchangeCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        //window.alert("Kode otentikasi tidak ditemukan. Silakan login ulang.");
        window.location.href = APP_CENTER_URL;
        return;
      }

      try {
        const res = await axios.post(
          `${APP_CENTER_API}/auth/exchange-code`,
          { code },
          { withCredentials: true }
        );

        const { token } = res.data;
        if (!token) throw new Error("Token tidak diterima");

        //console.log(token);

        await login(token);

        // kasih 1 micro delay (lebih clean dari setTimeout)
        await Promise.resolve();

        // bersihkan URL (?code=...)
        window.history.replaceState({}, document.title, window.location.pathname);

        // redirect sekali saja
        const target = app ? `/${app}` : "/";
        window.location.replace(target);
      } catch (err) {
        console.error("Exchange code gagal:", err);
        //window.alert("Otentikasi gagal. Silakan login ulang.");
        window.location.href = APP_CENTER_URL;
      }
    };

    exchangeCode();
  }, [app, login, navigate, APP_CENTER_API, APP_CENTER_URL]);

  return (
    <div className="w-100 vh-100 d-flex flex-column justify-content-center align-items-center bg-dark bg-opacity-10">
      <div className="p-4 border rounded-4 shadow-sm bg-white text-center" style={{ width: "280px" }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>

        <h5 className="mb-1">Mengautentikasi...</h5>
        <p className="text-muted small mb-0">Menghubungkan ke App Center</p>

        <div className="mt-3">
          <a href={APP_CENTER_URL} className="btn btn-outline-primary btn-sm px-3 rounded-pill">
            Re-Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Callback;
