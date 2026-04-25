import { useEffect, useState, useCallback, useRef, useContext } from "react";
import {
  fetchPaginatedData,
  fetchDaftarPoli,
} from "../../../api/wj_monapp/MasterAnjungan";
import {
  fetchPaginatedDataMonitoringIcare,
  fetchPaginatedDataMonitoringAntrian,
  fetchPaginatedDataMonitoringTHP,
  fetchMonitoringDisplaySummary
} from "../../../api/wj_monapp/MasterMonitoring";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";

import MonitoringAplicares from "./MonitoringAplicares";
import MonitoringVClaim from "./MonitoringVClaim";
import MonitoringAntreanRS from "./MonitoringAntreanRS";
import MonitoringDisplay from "./MonitoringDisplay";
import MonitoringApotek from "./MonitoringApotek";
import MonitoringPCare from "./MonitoringPCare";
import MonitoringICare from "./MonitoringICare";
import MonitoringTHP from "./MonitoringTHP";
import MonitoringWSRekamMedis from "./MonitoringWSRekamMedis";
import MonitoringSatuSehat from "./MonitoringSatuSehat";

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

  const sukses = 0, gagal = 0, total = 0; //dummy
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
    sukses: 0,
    gagal: 0,
    total: 0,
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

  const today = new Date().toLocaleDateString("sv-SE");

  useEffect(() => {
    const loadICareStats = async () => {
      try {
        const res = await fetchPaginatedDataMonitoringIcare({
          page: 1,
          limit: 1,
          startDate: today,
          endDate: today,
          poli: "",
          search: "",
        });

        setIcareStats({
          sukses: res.totalSuccess || 0,
          gagal: res.totalError || 0,
          total: Number(res.totalSuccess) + Number(res.totalError) || 0,
        });
      } catch (error) {
        console.error("Gagal ambil statistik iCare:", error);
      }
    };

    loadICareStats();
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
    const loadDisplayStats = async () => {
      try {
        const res = await fetchMonitoringDisplaySummary({
          date: today,          // backend pakai date
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
  const menuMonitoring = [
    {
      id: "AntreanRS",
      label: "Monitoring Antrean RS",
      wslist: ["WsListAntrianRS"],
      stats: [
        {
          key: "online",
          label: "Online",
          value: antrianStats.online
        },
        {
          key: "onsite",
          label: "Onsite",
          value: antrianStats.onsite
        },
        {
          key: "total",
          label: "Total",
          value: antrianStats.total
        }
      ],
      disabled: false,
      component: (props) => <MonitoringAntreanRS {...props} />,
    },

    {
      id: "ICare",
      label: "Monitoring i-Care",
      wslist: ["FKRTL"],
      stats: [
        { label: "Sukses", value: icareStats.sukses },
        { label: "Gagal", value: icareStats.gagal },
        { label: "Total", value: icareStats.total }
      ],
      disabled: false,
      component: (props) => <MonitoringICare {...props} />,
    },

    {
      id: "SatuSehat",
      label: "Bridging Lab SatuSehat",
      wslist: ["WS Satu Sehat"],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
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
          value: displayStats.online
        },
        {
          key: "offline",
          label: "Offline",
          value: displayStats.offline
        },
        {
          key: "total",
          label: "Total",
          value: displayStats.total
        }
      ],
      disabled: false,
      component: (props) => <MonitoringDisplay {...props} />,
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
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: false,
      component: (props) => <MonitoringAplicares {...props} />,
    },
    {
      id: "Mobay",
      label: "Monitoring Utang/Piutang",
      wslist: [
        "Belum Diajukan",
        "Belum Dibayar",
        "Lunas",
        "Hutang",
      ],
      stats: [
        { label: "Hutang", value: sukses },
        { label: "Lunas", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: false,
      component: (props) => <MonitoringVClaim {...props} />,
    },

    {
      id: "Apotek",
      label: "Monitoring Apotek",
      wslist: [
        "DPHO",
        "Non Racikan",
        "Racikan",
        "Riwayat Pelayanan Obat",
        "Daftar Resep",
        "Data Klaim",
      ],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: true,
      component: (props) => <MonitoringApotek {...props} />,
    },
    {
      id: "PCare",
      label: "Monitoring PCare",
      wslist: [
        "Get Diagnosa",
        "Get Dokter",
        "Get Club Prolanis",
        "Get Kesadaran",
        "Get Rujukan",
        "Get Riwayat Kunjungan",
        "Get MCU",
        "Get DPHO",
        "Get Obat by Kunjungan",
        "Get Pendaftaran by Nomor Urut",
        "Get Pendaftaran Provider",
        "Get Peserta",
        "Get Poli FKTP",
        "Get Provider Rayonisasi",
        "Get Referensi Spesialis",
        "Get Status Pulang",
        "Get Referensi Tindakan",
        "Get Tindakan by Kunjungan",
        "Get Alergi",
        "Get Prognosa",
      ],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: true,
      component: (props) => <MonitoringPCare {...props} />,
    },

    {
      id: "WSRekamMedis",
      label: "Monitoring WS Rekam Medis",
      wslist: ["Insert Medical Record"],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: true,
      component: (props) => <MonitoringWSRekamMedis {...props} />,
    },
    // bisa tambah menu lain
    // dummy

    {
      id: "dummy4",
      label: "Monitoring Dummy Empat",
      wslist: ["WS List 1"],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: true,
    },
    {
      id: "dummy5",
      label: "Monitoring Dummy Lima",
      wslist: ["WS List 1"],
      stats: [
        { label: "Sukses", value: sukses },
        { label: "Gagal", value: gagal },
        { label: "Total", value: total }
      ],
      disabled: true,
    },
  ];

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
    [limit]
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
        <div className="card-header py-2 px-3">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            {selectedMenu === "" ? (
              <span>Monitoring Aplikasi</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedMenu("")}
                  className="btn btn-primary btn-sm"
                >
                  ← Kembali ke Menu
                </button>

                <span>Monitoring Aplikasi</span>
              </>
            )}
          </h6>
        </div>
        <div className="card-body p-2">
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
                    height: "140px",
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MasterMonitoring;
