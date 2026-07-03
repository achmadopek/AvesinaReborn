import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
  useMemo,
  lazy,
  Suspense,
} from "react";
import {
  fetchPaginatedData,
  fetchDaftarPoli,
} from "../../../api/wj_monapp/MasterAnjungan";
import {
  fetchDashboardMonitoringIcare,
  fetchPaginatedDataMonitoringAntrian,
  fetchPaginatedDataMonitoringTHP,
  fetchMonitoringDisplaySummary,
  fetchMonitoringVisiteSummary,
  fetchMonitoringVisiteActivity,
  fetchMonitoringSatuSehatSummary,
  fetchMonitoringAplicaresSummary,
} from "../../../api/wj_monapp/MasterMonitoring";
import { fetchMobayMonitoringSummary } from "../../../api/wj_mobay/MonitoringTagihan";
import { fetchDashboardSupervisi } from "../../../api/wj_supervisi/DashboardSupervisi";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import { Button } from "react-bootstrap";

const MonitoringAplicares = lazy(() => import("./MonitoringAplicares"));
const MonitoringVClaim = lazy(() => import("./MonitoringVClaim"));
const MonitoringAntreanRS = lazy(() => import("./MonitoringAntreanRS"));
const MonitoringDisplay = lazy(() => import("./MonitoringDisplay"));
const MonitoringApotek = lazy(() => import("./MonitoringApotek"));
const MonitoringPCare = lazy(() => import("./MonitoringPCare"));
const MonitoringICare = lazy(() => import("./MonitoringICare"));
const MonitoringTHP = lazy(() => import("./MonitoringTHP"));
const MonitoringWSRekamMedis = lazy(() => import("./MonitoringWSRekamMedis"));
const MonitoringSatuSehat = lazy(() => import("./MonitoringSatuSehat"));
const MonitoringVisite = lazy(() => import("./MonitoringVisite"));
const MonitoringSupervisi = lazy(() => import("./MonitoringSupervisi"));

// Initial form state
const initialFormState = {
  search: "",
  // tambahkan field lain kalau perlu
};

const MasterMonitoring = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]); // data antrian
  const [poliData, setPoliData] = useState([]); // data daftar poli
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

  const { role } = useContext(AuthContext);
  const { notificationCount, loadNotificationCount } = useNotification();

  const [selectedMenu, setSelectedMenu] = useState(""); // menu yang dipilih

  const sukses = 0,
    gagal = 0,
    total = 0; //dummy
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    .toISOString()
    .slice(0, 10);

  const todayTHP = new Date().toISOString().slice(0, 10);

  const [summary, setSummary] = useState({
    total_pegawai: 0,
    below_umr: 0,
    above_umr: 0,
  });

  const [icareStats, setIcareStats] = useState({
    totalSuccess: 0,
    totalError: 0,
    totalIcare: 0,
  });

  const [antrianStats, setAntrianStats] = useState({
    online: 0,
    onsite: 0,
    total: 0,
  });

  // DISPLAY STATS
  const [displayStats, setDisplayStats] = useState({
    online: 0,
    offline: 0,
    total: 0,
  });

  // VISITE DOKTER
  const [visiteStats, setVisiteStats] = useState({
    totalVisite: 0,

    spmStandar: 0,
    spmTidakStandar: 0,

    inmStandar: 0,
    inmTidakStandar: 0,

    spmPercent: 0,
    inmPercent: 0,
  });

  const [satuSehatStats, setSatuSehatStats] = useState({
    totalSuccess: 0,
    totalError: 0,
    totalSatuSehat: 0,
  });

  const [aplicaresStats, setAplicaresStats] = useState({
    totalRooms: 0,
    totalCapacity: 0,
    totalAvailable: 0,
  });

  const [mobayStats, setMobayStats] = useState({
    totalDiajukan: 0,
    totalLunas: 0,
    totalHutang: 0,
  });

  const [supervisiStats, setSupervisiStats] = useState({
    kendalaCount: 0,
    focus: 0,
    action: 0,
  });

  const [wsRekamMedisStats, setWSRekamMedisStats] = useState({
    totalSuccess: 0,
    totalError: 0,
    totalWSRekamMedis: 0,
  });

  const today = new Date().toLocaleDateString("sv-SE");

  useEffect(() => {
    const loadVisiteStats = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const res = await fetchMonitoringVisiteSummary({
          startDate: today,
          endDate: today,
        });

        const summary = res.summary || {};

        const spmTotal =
          Number(summary.spmStandar || 0) +
          Number(summary.spmTidakStandar || 0);

        const inmTotal =
          Number(summary.inmStandar || 0) +
          Number(summary.inmTidakStandar || 0);

        const spmPercent =
          spmTotal === 0 ? 0 : (summary.spmStandar / spmTotal) * 100;

        const inmPercent =
          inmTotal === 0 ? 0 : (summary.inmStandar / inmTotal) * 100;

        setVisiteStats({
          totalVisite: summary.totalAktivitas || 0,

          spmStandar: summary.spmStandar || 0,

          spmTidakStandar: summary.spmTidakStandar || 0,

          inmStandar: summary.inmStandar || 0,

          inmTidakStandar: summary.inmTidakStandar || 0,

          spmPercent,

          inmPercent,
        });
      } catch (error) {
        console.error("Gagal ambil statistik visite:", error);
      }
    };

    loadVisiteStats();
  }, []);

  useEffect(() => {
    const loadAntrianStats = async () => {
      try {
        const res = await fetchPaginatedDataMonitoringAntrian({
          page: 1,
          limit: 1,
          startDate: today,
          endDate: today,
          poli: "",
          search: "",
        });

        setAntrianStats({
          online: res.antrianStats?.totalOnline || 0,
          onsite: res.antrianStats?.totalOnsite || 0,
          total: res.antrianStats?.totalAntrian || 0,
        });
      } catch (error) {
        console.error("Gagal ambil statistik iCare:", error);
      }
    };

    loadAntrianStats();
  }, []);

  useEffect(() => {
    const loadTHPStats = async () => {
      try {
        const res = await fetchPaginatedDataMonitoringTHP({
          page: 1,
          limit: 1,
          startDate: startOfYear,
          endDate: todayTHP,
          peg_id: "",
          employee_sts: "",
        });

        setSummary({
          total_pegawai: res.summary?.total_pegawai || 0,
          below_umr: res.summary?.below_umr || 0,
          above_umr: res.summary?.above_umr || 0,
        });
      } catch (error) {
        console.error("Gagal ambil statistik THP:", error);
      }
    };

    loadTHPStats();
  }, []);

  useEffect(() => {
    const loadSupervisiStats = async () => {
      try {
        const res = await fetchDashboardSupervisi();
        const dashboard = res.data || res;

        const kendalaCount = Number(dashboard.kendalaCount || 0);

        const focusCount = Array.isArray(dashboard.fokusDireksi)
          ? dashboard.fokusDireksi.length
          : 0;

        const actionCount = Array.isArray(dashboard.rencanaAksi)
          ? dashboard.rencanaAksi.length
          : 0;

        setSupervisiStats({
          kendalaCount,
          focus: focusCount,
          action: actionCount,
        });
      } catch (error) {
        console.error("Gagal ambil statistik Supervisi:", error);
      }
    };

    loadSupervisiStats();
  }, []);

  useEffect(() => {
    const loadAplicaresStats = async () => {
      try {
        const res = await fetchMonitoringAplicaresSummary();

        setAplicaresStats({
          totalRooms: res.totalRooms || 0,
          totalCapacity: res.totalCapacity || 0,
          totalAvailable: res.totalAvailable || 0,
        });
      } catch (err) {
        console.error("Gagal ambil statistik Aplicares:", err);
      }
    };

    loadAplicaresStats();
  }, []);

  useEffect(() => {
    const loadSatuSehatStats = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetchMonitoringSatuSehatSummary({
          startDate: today,
          endDate: today,
        });

        setSatuSehatStats({
          totalSuccess: Number(res.totalSuccess || 0),
          totalError: Number(res.totalError || 0),
          totalSatuSehat: Number(res.totalSatuSehat || 0),
        });
      } catch (error) {
        console.error("Gagal ambil statistik SatuSehat:", error);
      }
    };

    loadSatuSehatStats();
  }, []);

  useEffect(() => {
    const loadMobayStats = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetchMobayMonitoringSummary({
          start: today,
          end: today,
          typeTglFilter: "tgl_po",
        });

        setMobayStats({
          totalDiajukan: Number(res.totalDiajukan || 0),
          totalLunas: Number(res.totalLunas || 0),
          totalHutang: Number(res.totalHutang || 0),
        });
      } catch (error) {
        console.error("Gagal ambil statistik Mobay:", error);
      }
    };

    loadMobayStats();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const res = await fetchDashboardMonitoringIcare({
          startDate: today,
          endDate: today,
        });

        setIcareStats({
          totalSuccess: Number(res.totalSuccess || 0),
          totalError: Number(res.totalError || 0),
          totalIcare: Number(res.totalIcare || 0),
        });
      } catch (err) {
        console.error("Gagal load dashboard iCare:", err);
      }
    };

    loadDashboard();

    const interval = setInterval(loadDashboard, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDisplayStats = async () => {
      try {
        const res = await fetchMonitoringDisplaySummary({
          date: today, // backend pakai date
          offlineThreshold: 20, // samakan dengan BE
        });

        setDisplayStats({
          online: res.summary?.online || 0,
          offline: res.summary?.offline || 0,
          total: res.summary?.totalDisplay || 0,
        });
      } catch (error) {
        console.error("Gagal ambil statistik Monitoring Display:", error);
      }
    };

    // fetch pertama
    loadDisplayStats();

    // auto refresh tiap 10 detik
    const interval = setInterval(() => {
      loadDisplayStats();
    }, 10000);

    // cleanup
    return () => clearInterval(interval);
  }, [today]);

  // daftar menu monitoring
  const menuMonitoring = useMemo(
    () => [
      {
        id: "AntreanRS",
        label: "Monitoring Antrean RS",
        wslist: ["WsListAntrianRS"],
        stats: [
          {
            key: "online",
            label: "Online",
            value: antrianStats.online,
          },
          {
            key: "onsite",
            label: "Onsite",
            value: antrianStats.onsite,
          },
          {
            key: "total",
            label: "Total",
            value: antrianStats.total,
          },
        ],
        disabled: false,
        component: (props) => <MonitoringAntreanRS {...props} />,
      },

      {
        id: "Supervisi",
        label: "Monitoring Supervisi",
        wslist: ["Supervisi Harian"],
        stats: [
          { label: "Kendala", value: supervisiStats.kendalaCount },
          { label: "Fokus", value: supervisiStats.focus },
          { label: "Action", value: supervisiStats.action },
        ],
        disabled: false,
        component: (props) => <MonitoringSupervisi {...props} />,
      },

      {
        id: "Visite",
        label: "Monitoring Visite Dokter",
        wslist: [
          "Visite Harian",
          "Rapor Mingguan Dokter",
          "Kepatuhan Jam Visite",
        ],
        stats: [
          {
            label: "Total",
            value: visiteStats.totalVisite,
          },
          {
            label: "SPM",
            value: (
              <>
                {(visiteStats.spmPercent || 0).toFixed(0)}
                <span className="fs-6">%</span>
              </>
            ),
          },
          {
            label: "INM",
            value: (
              <>
                {(visiteStats.inmPercent || 0).toFixed(0)}
                <span className="fs-6">%</span>
              </>
            ),
          },
        ],
        disabled: false,
        component: (props) => <MonitoringVisite {...props} />,
      },

      {
        id: "Aplicares",
        label: "Monitoring Ketersediaan Kamar",
        wslist: [
          "Referensi Kamar",
          "Update Ketersediaan Tempat Tidur",
          "Ruangan Baru",
          "Ketersediaan Kamar RS",
          "Hapus Ruangan",
        ],
        stats: [
          { label: "Ruang", value: aplicaresStats.totalRooms },
          { label: "Kapasitas", value: aplicaresStats.totalCapacity },
          { label: "Tersedia", value: aplicaresStats.totalAvailable },
        ],
        disabled: false,
        component: (props) => <MonitoringAplicares {...props} />,
      },

      {
        id: "ICare",
        label: "Monitoring i-Care",
        wslist: ["FKRTL"],
        stats: [
          { label: "Sukses", value: icareStats.totalSuccess },
          { label: "Gagal", value: icareStats.totalError },
          { label: "Total", value: icareStats.totalIcare },
        ],
        disabled: false,
        component: (props) => <MonitoringICare {...props} />,
      },

      {
        id: "SatuSehat",
        label: "Bridging SatuSehat",
        wslist: ["WS Satu Sehat"],
        stats: [
          { label: "Sukses", value: satuSehatStats.totalSuccess },
          { label: "Gagal", value: satuSehatStats.totalError },
          { label: "Total", value: satuSehatStats.totalSatuSehat },
        ],
        disabled: false,
        component: (props) => <MonitoringSatuSehat {...props} />,
      },

      {
        id: "thp",
        label: "Monitoring Gaji Pegawai",
        wslist: ["THP Tertinggi", "THP Terendah"],
        stats: [
          { label: "Pegawai < UMR", value: summary.below_umr },
          { label: "Pegawai ≥ UMR", value: summary.above_umr },
          { label: "Jumlah Pegawai", value: summary.total_pegawai },
        ],
        disabled: false,
        component: (props) => <MonitoringTHP {...props} />,
      },

      {
        id: "display",
        label: "Monitoring Display",
        wslist: ["Status Display Antrian"],
        stats: [
          {
            key: "online",
            label: "Online",
            value: displayStats.online,
          },
          {
            key: "offline",
            label: "Offline",
            value: displayStats.offline,
          },
          {
            key: "total",
            label: "Total",
            value: displayStats.total,
          },
        ],
        disabled: false,
        component: (props) => <MonitoringDisplay {...props} />,
      },

      {
        id: "Mobay",
        label: "Monitoring Utang/Piutang",
        wslist: ["Belum Diajukan", "Belum Dibayar", "Lunas", "Hutang"],
        stats: [
          { label: "Hutang", value: mobayStats.totalHutang },
          { label: "Lunas", value: mobayStats.totalLunas },
          { label: "Diajukan", value: mobayStats.totalDiajukan },
        ],
        disabled: false,
        component: (props) => <MonitoringVClaim {...props} />,
      },
    ],
    [
      antrianStats,
      supervisiStats,
      visiteStats,
      aplicaresStats,
      icareStats,
      satuSehatStats,
      summary,
      displayStats,
      mobayStats,
    ],
  );

  // ---- Pantau ukuran layar ----
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Reset form ----
  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
  }, []);

  // ---- Load Daftar Poli ----
  const loadDaftarPoli = useCallback(async () => {
    try {
      const result = await fetchDaftarPoli();
      setPoliData(result || []);
    } catch (err) {
      console.error("Gagal fetch daftar poli:", err);
    }
  }, []);

  useEffect(() => {
    loadDaftarPoli();
  }, [loadDaftarPoli]);

  // ---- Load Data Antrian ----
  const loadData = useCallback(
    async (page = 1, search = "") => {
      if (!search.trim()) return;
      try {
        const result = await fetchPaginatedData(page, limit, search);
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data antrian:", err);
      }
    },
    [limit],
  );

  // ---- Debounce Search ----
  useEffect(() => {
    if (isEditing) return;
    if (!form.search.trim()) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage, form.search);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.search, isEditing, loadData]);

  // ---- Handle select pegawai (placeholder) ----
  const handleSelectPegawai = (item) => {
    //console.log("Selected pegawai:", item);
    // bisa set form atau navigasi detail
  };

  // Daftar gradient (20 lebih)
  const gradients = [
    "linear-gradient(135deg, #4e73df, #224abe)", // biru
    "linear-gradient(135deg, #1cc88a, #13855c)", // hijau
    "linear-gradient(135deg, #36b9cc, #258391)", // cyan
    "linear-gradient(135deg, #f6c23e, #dda20a)", // kuning
    "linear-gradient(135deg, #e74a3b, #be2617)", // merah
    "linear-gradient(135deg, #6a11cb, #2575fc)", // ungu-biru
    "linear-gradient(135deg, #00c6ff, #0072ff)", // biru laut
    "linear-gradient(135deg, #11998e, #38ef7d)", // emerald
    "linear-gradient(135deg, #8e2de2, #4a00e0)", // violet
    "linear-gradient(135deg, #f7971e, #ffd200)", // orange
    "linear-gradient(135deg, #fc5c7d, #6a82fb)", // pink-ungu
    "linear-gradient(135deg, #00b09b, #96c93d)", // hijau lime
    "linear-gradient(135deg, #ee0979, #ff6a00)", // merah-oranye
    "linear-gradient(135deg, #ff7eb3, #ff758c)", // pink
    "linear-gradient(135deg, #56ccf2, #2f80ed)", // biru soft
    "linear-gradient(135deg, #ff512f, #dd2476)", // sunset
    "linear-gradient(135deg, #373b44, #4286f4)", // abu-biru
    "linear-gradient(135deg, #ff9a9e, #fad0c4)", // soft pink
    "linear-gradient(135deg, #0f2027, #203a43, #2c5364)", // dark ocean
  ];

  // ---- Render ----
  return (
    <>
      <div className="card shadow-sm card-theme">
        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}
        <div className="card-header py-2 px-3 d-flex align-items-center justify-content-between">
          <div>
            Monitoring Aplikasi & Integrasi Sistem Informasi Rumah Sakit
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className="ms-2"
            onClick={() => setSelectedMenu("")}
          >
            Kembali ke Dashboard
          </Button>
        </div>
        <div className="container-fluid">
          <div className="row align-items-center">
            {/* 1. KIRI: LOGO PEMKAB & LOGO RS BERDAMPINGAN */}
            <div className="col-1 d-flex align-items-center justify-content-center gap-3">
              {/* Logo Pemkab Probolinggo */}
              <div className="text-center" style={{ minWidth: "85px" }}>
                <img
                  src="/logo-pemkab.png"
                  alt="Logo Pemkab Probolinggo"
                  style={{ maxHeight: "100px", width: "auto" }}
                  className="img-fluid"
                />
                <div
                  className="fw-bold mt-1 text-uppercase"
                  style={{
                    fontSize: "0.75rem",
                    color: "#111",
                    lineHeight: "1.2",
                  }}
                >
                  Pemerintah
                  <br />
                  Kabupaten Probolinggo
                </div>
              </div>
            </div>

            {/* 2. TENGAH: TEKS JUDUL UTAMA */}
            <div className="col-6 text-center">
              {/* Baris 1: HOSPITAL LEADER'S... */}
              <h3
                className="fw-bold mb-1"
                style={{
                  fontSize: "1.9rem",
                  letterSpacing: "0.5px",
                  color: "#111",
                  lineHeight: "0.9",
                }}
              >
                HOSPITAL LEADER'S DAILY PLAYBOOK
              </h3>

              {/* Baris 2: RSUD WALUYO JATI */}
              <h1
                className="fw-black mb-2"
                style={{
                  fontSize: "3.6rem",
                  fontWeight: "900",
                  color: "#133825",
                  transform: "scaleX(0.95)",
                  letterSpacing: "-1px",
                  lineHeight: "0.9",
                }}
              >
                RSUD WALUYO JATI
              </h1>

              {/* Baris 3: WJ SMART BUGARR... */}
              <h4
                className="fw-normal mb-3"
                style={{
                  color: "#b86200",
                  fontSize: "1.25rem",
                  lineHeight: "0.9",
                }}
              >
                WJ SMART BUGARR – Hospital Command Center
              </h4>

              {/* Baris 4: Satu Data... */}
              <p
                className="fw-bold text-muted mb-0"
                style={{
                  fontSize: "0.95rem",
                  color: "#222",
                  lineHeight: "1.4",
                }}
              >
                Satu Data • Satu Dashboard • Satu Aksi untuk Pelayanan yang
                Lebih Baik
              </p>
            </div>

            {/* 3. PALING KANAN: LOGO WALUYO */}
            <div className="col-1 text-start ">
              {/* Logo RSUD Waluyo Jati */}
              <div className="text-start">
                <img
                  src="/logo-rsud.png"
                  alt="Logo RSUD Waluyo Jati"
                  style={{
                    maxHeight: "120px",
                    width: "auto",
                    marginLeft: "40px",
                  }}
                  className="img-fluid"
                />
              </div>
            </div>

            {/* 4. FOTO DIREKTUR */}
            <div className="col-4 text-end">
              <img
                src="/dr_yessy.png"
                alt="Foto Direktur"
                style={{
                  width: "auto",
                  height: "120px",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>

        <div className="card-body p-2" style={{ marginTop: "0" }}>
          {selectedMenu === "" ? (
            <div className="row">
              {menuMonitoring.map((menu, index) => (
                <div
                  key={menu.id}
                  className="col-md-4 col-sm-6 mb-4"
                  onClick={() => !menu.disabled && setSelectedMenu(menu.id)}
                  style={{
                    cursor: menu.disabled ? "not-allowed" : "pointer",
                    opacity: menu.disabled ? 0.5 : 1, // <-- visual cue
                    height: "170px",
                  }}
                >
                  <div
                    className="card shadow-sm text-center h-100"
                    style={{
                      borderRadius: "16px",
                      background: menu.disabled
                        ? "#9e9e9e" // abu2
                        : gradients[index], // normal
                    }}
                  >
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h6 className="fw-bold mb-3" style={{ fontSize: "14pt" }}>
                        {menu.label}
                      </h6>

                      <div className="d-flex justify-content-around">
                        {menu.stats?.map((stat, i) => (
                          <div key={i}>
                            <h4 className="fw-bold">{stat.value}</h4>
                            <small className="fw-semibold">{stat.label}</small>
                          </div>
                        ))}
                      </div>

                      {role === "admin" && (
                        <small className="d-block mt-3 opacity-75">
                          ID: {menu.id}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="row">
              <div className="col-12">
                <Suspense
                  fallback={
                    <div className="text-center py-5">
                      Memuat modul monitoring...
                    </div>
                  }
                >
                  {menuMonitoring
                    .find((m) => m.id === selectedMenu)
                    ?.component({
                      data,
                      poliData,
                      isMobile,
                      limit,
                      currentPage,
                      totalPages,
                      setCurrentPage,
                      handleSelectPegawai,
                      setForm,
                    })}
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MasterMonitoring;
