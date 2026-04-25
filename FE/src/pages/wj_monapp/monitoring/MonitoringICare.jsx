import { useEffect, useState } from "react";
import {
  fetchPaginatedDataMonitoringIcare,
  exportMonitoringIcareToExcel,
  fetchIcareDailySummary
} from "../../../api/wj_monapp/MasterMonitoring";
import { fetchDaftarPoli } from "../../../api/wj_monapp/MasterServisUnit";
import { formatSortDateTime } from "../../../utils/FormatDate";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useAuth } from "../../../context/AuthContext";

const MonitoringIcare = ({ isMobile, limit = 10 }) => {
  // State for data and pagination
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for totals
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [totalError, setTotalError] = useState(0);
  const totalAll = totalSuccess + totalError;

  const [totalPatientPoli, setTotalPatientPoli] = useState(0);

  // Date handling (set to local time zone)
  const localToday = new Date();
  localToday.setHours(0, 0, 0, 0); // Set time to 00:00:00 for startDate

  const localTomorrow = new Date(localToday);
  localTomorrow.setHours(23, 59, 59, 999); // Set time to 23:59:59 for endDate

  const [startDate, setStartDate] = useState(
    localToday.toLocaleDateString("en-CA")
  );
  const [endDate, setEndDate] = useState(
    localTomorrow.toLocaleDateString("en-CA")
  );

  // State for poli selection
  const [poli, setPoli] = useState("");
  const [poliList, setPoliList] = useState([]);

  // WebSocket URL from environment variables
  const WS_URL = import.meta.env.VITE_WS_URL;

  // State for current day, to trigger reload when day changes
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toLocaleDateString("en-CA");
  });

  // State for autoRun feature and related window
  const [icareWindow, setIcareWindow] = useState(null);
  const [autoRun, setAutoRun] = useState(false);

  const { getValidToken } = useAuth();

  // Polling intervals
  const POLLING_FAST = 30000;
  const POLLING_SLOW = 120000;

  // Role-based access
  const { role } = useAuth();

  // State for line chart data
  const [lineChartData, setLineChartData] = useState([]);

  // =======================
  // LOAD DATA UTAMA
  // =======================
  const loadData = async () => {
    try {
      const res = await fetchPaginatedDataMonitoringIcare({
        page: currentPage,
        limit,
        startDate,
        endDate,
        poli,
      });

      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalSuccess(res.totalSuccess || 0);
      setTotalError(res.totalError || 0);
      setTotalPatientPoli(res.totalPatientPoli || 0);

      console.log("Data monitoring iCare dimuat:", res);
    } catch (err) {
      console.error("Error fetch monitoring:", err);
      setData([]);
    }
  };

  // Ambil data saat filter berubah
  useEffect(() => {
    loadData();
  }, [currentPage, limit, startDate, endDate, poli]);

  const barData = [
    { name: "SUKSES", value: Number(totalSuccess) },
    { name: "GAGAL", value: Number(totalError) },
    {
      name: "BELUM",
      value: Math.max(
        0,
        Number(totalPatientPoli) -
        (Number(totalSuccess) + Number(totalError))
      ),
    }
  ];

  const pieData = [
    { name: "SUKSES", value: Number(totalSuccess) },
    { name: "GAGAL", value: Number(totalError) },
    {
      name: "BELUM",
      value: Math.max(
        0,
        Number(totalPatientPoli) -
        (Number(totalSuccess) + Number(totalError))
      ),
    }
  ];

  const COLORS = ["#4caf50", "#f44336", "#2196f3"]; // Success, Error, Others

  // =======================
  // LOAD LINE CHART SUMMARY (DAILY)
  // =======================
  useEffect(() => {
    if (!startDate || !endDate) {
      setLineChartData([]);
      return;
    }

    const loadLineChart = async () => {
      try {
        const res = await fetchIcareDailySummary({
          startDate,
          endDate,
          poli
        });

        const normalized = (res.data || []).map(d => ({
          ...d,
          date: new Date(d.date).toISOString().slice(0, 10)
        }));

        setLineChartData(normalized);

      } catch (err) {
        console.error("Gagal load summary harian iCare", err);
        setLineChartData([]);
      }
    };

    loadLineChart();
  }, [startDate, endDate, poli]);

  // =======================
  // FETCH POLI
  // =======================
  useEffect(() => {
    const fetchPoli = async () => {
      try {
        const res = await fetchDaftarPoli();
        setPoliList(res.data || []);
      } catch (err) {
        console.error("Error fetch poli:", err);
      }
    };
    fetchPoli();
  }, []);

  // =======================
  // WEBSOCKET LISTENER
  // =======================
  useEffect(() => {
    let ws;

    const connectWS = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => console.log("WS Connected: Monitoring ICare");

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === "icare-updated") {
            console.log("WS update → reload data");
            loadData();
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WS closed — reconnecting in 5s...");
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();
    return () => ws && ws.close();
  }, []);

  // =======================
  // AUTO RELOAD SAAT HARI BERGANTI
  // =======================
  useEffect(() => {
    const timer = setInterval(() => {
      // Ambil tanggal hari ini (waktu lokal)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set waktu ke 00:00:00
      const localDate = today.toISOString().slice(0, 10); // Format sebagai YYYY-MM-DD

      // Periksa apakah tanggal hari ini berbeda dengan currentDay
      if (localDate !== currentDay) {
        console.log("Hari berganti — reload data baru");
        setCurrentDay(localDate); // Update currentDay dengan tanggal baru
        loadData(); // Memuat ulang data saat hari berganti
      }
    }, 60000); // Cek setiap 1 menit

    return () => clearInterval(timer); // Bersihkan interval saat komponen unmount
  }, [currentDay]); // Jalankan efek ini setiap kali currentDay berubah

  // =======================
  // POLLING ADAPTIF
  // =======================
  useEffect(() => {
    if (!autoRun) return;

    const intervalTime =
      totalSuccess < totalPatientPoli ? POLLING_FAST : POLLING_SLOW;

    const timer = setInterval(loadData, intervalTime);
    return () => clearInterval(timer);
  }, [autoRun, totalSuccess, totalPatientPoli]);

  // =======================
  // AUTO RUN MAIN LOGIC
  // =======================
  useEffect(() => {
    if (!autoRun) return;
    if (!icareWindow || icareWindow.closed) return;

    const hour = new Date().getHours();
    if (hour < 14) return;
    if (totalSuccess > 0) return;

    const target = data.find((item) => !item.status && item.link_icare);
    if (!target) return;

    console.log("AutoRun →", target.link_icare);
    icareWindow.location.href = target.link_icare;
  }, [autoRun, data, totalSuccess, icareWindow]);

  // =======================
  // ENABLE AUTORUN
  // =======================
  const handleEnableAutoRun = () => {
    setAutoRun(true);
    const w = window.open("", "_blank", "width=500,height=700");
    setIcareWindow(w);
  };

  // KEEP ALIVE saat AutoRun aktif
  useEffect(() => {
    if (!autoRun) return;

    console.log("AutoRun keep-alive started");

    const interval = setInterval(async () => {
      try {
        const t = await getValidToken();
        console.log("Keep-alive -> Token OK", t ? "Yes" : "No");
        if (!t) {
          console.warn("Token invalid. Stopping AutoRun.");
          setAutoRun(false);
        }
      } catch (err) {
        console.error("Keep-alive error:", err);
      }
    }, 5 * 60 * 1000); // setiap 5 menit

    return () => {
      clearInterval(interval);
      console.log("AutoRun keep-alive stopped");
    };
  }, [autoRun]);

  // =======================
  // RENDER PAGE NUMBER
  // =======================
  const renderPageNumbers = () => {
    const delta = 1;
    const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

    const pages = [];
    let prev;
    const addWithDots = (list) => {
      list.forEach((p) => {
        if (prev && p - prev > 1) pages.push("...");
        pages.push(p);
        prev = p;
      });
    };

    addWithDots(range(1, Math.min(2, totalPages)));
    addWithDots(
      range(
        Math.max(currentPage - delta, 3),
        Math.min(currentPage + delta, totalPages - 2)
      )
    );
    addWithDots(range(Math.max(totalPages - 1, 3), totalPages));

    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`dots-${idx}`}>...</span>
      ) : (
        <button
          key={`page-${p}-${idx}`}
          onClick={() => setCurrentPage(p)}
          className={`btn btn-sm mx-1 ${currentPage === p ? "btn-outline-primary" : "btn-outline-secondary"
            }`}
        >
          {p}
        </button>
      )
    );
  };

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, poli]);


  // =======================
  // RENDER UI
  // =======================
  return (
    <>
      {/* FILTER */}
      <div className="row mb-2 p-2">
        <div className="col-md-3 mb-0">
          <label className="form-label">Tanggal Dari</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="col-md-3 mb-0">
          <label className="form-label">Tanggal Hingga</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="col-md-3 mb-0">
          <label className="form-label">Poli</label>
          <select
            className="form-control form-control-sm form-control form-control-sm-sm"
            value={poli}
            onChange={(e) => setPoli(e.target.value)}
          >
            <option value="">Semua</option>
            {poliList.map((p) => (
              <option key={p.srvc_unit_id} value={p.srvc_unit_id}>
                {p.srvc_unit_nm}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3 mb-0">
          {/* Auto Run hanya untuk Admin */}
          {role === "admin" && (
            <div className="mt-2" style={{ fontSize: "9pt" }}>
              <label className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  checked={autoRun}
                  onChange={(e) =>
                    e.target.checked ? handleEnableAutoRun() : setAutoRun(false)
                  }
                />
                <span>Auto Run (setelah jam 14.00 WIB)</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-2">
            <button
              className={`btn ${role === "admin" ? "btn-sm" : "btn-lg"
                } btn-secondary flex-fill`}
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPoli("");
                setLineChartData([]);
              }}
            >
              Reset
            </button>

            <button
              className={`btn ${role === "admin" ? "btn-sm" : "btn-lg"
                } btn-success flex-fill`}
              onClick={async () => {
                try {
                  const res = await exportMonitoringIcareToExcel({
                    startDate,
                    endDate,
                    poli,
                    search: "",
                  });

                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `monitoring-icare-${startDate || "all"}-${endDate || "all"
                    }.xlsx`;
                  a.click();

                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  alert("Gagal export data");
                }
              }}
            >
              Ekspor
            </button>
          </div>
        </div>
      </div>

      {/*GRAFIK */}
      <div className="card-theme ms-2 me-2 mb-3 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Grafik BPJS ICare</h6>
        </div>

        <div className="card-body px-0 py-0">
          <div className="row d-flex justify-content-center">
            {/* Bar Chart */}
            <div className="col-md-2 col-6">
              <h6 className="p-2">Status Integrasi</h6>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {barData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="col-md-2 col-6">
              <h6 className="p-2">Komposisi Data</h6>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart Rekap Harian */}
            <div className="col-md-8 col-12">
              <h6 className="p-2">Trend iCare Harian</h6>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineChartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 30 }} />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name="Sukses"
                  />
                  <Line
                    type="monotone"
                    dataKey="error"
                    stroke="#f44336"
                    strokeWidth={2}
                    name="Gagal"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#2196f3"
                    strokeWidth={2}
                    name="Belum iCare"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>

      {/* TABEL */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring BPJS ICare</h6>
        </div>

        <div className="card-body px-0 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NRM</th>
                  <th>Nama Pasien</th>
                  {!isMobile && <th>Ruangan</th>}
                  <th>Status ICare</th>
                  <th>Dokter ICare</th>
                  <th>Tanggal ICare</th>
                  <th>Keterangan</th>
                  {role === "admin" && <th>Icare Link (Alternatif)</th>}
                  {role === "admin" && <th>Icare Device</th>}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, i) => (
                    <tr key={i}>
                      <td>{(currentPage - 1) * limit + (i + 1)}</td>
                      <td>{item.mr_code}</td>
                      <td>{item.patient_nm}</td>
                      <td>{item.srvc_unit_nm}</td>

                      <td>
                        {item.status ? (
                          <span
                            className={`badge ${item.status === "SUCCESS"
                              ? "bg-success"
                              : "bg-danger"
                              }`}
                          >
                            {item.status}
                          </span>
                        ) : (
                          <span style={{ color: "gray" }}>Belum iCare</span>
                        )}
                      </td>

                      <td>
                        {item.employee_nm || (
                          <span style={{ color: "gray" }}>Belum iCare</span>
                        )}
                      </td>

                      <td>
                        {item.created_at ? (
                          formatSortDateTime(item.created_at)
                        ) : (
                          <span style={{ color: "gray" }}>Belum iCare</span>
                        )}
                      </td>

                      <td>
                        {item.message || (
                          <span style={{ color: "gray" }}>Belum iCare</span>
                        )}
                      </td>

                      {role === "admin" && (
                        <>
                          <td>
                            {item.status ? (
                              <span style={{ color: "gray" }}>Sudah iCare</span>
                            ) : (
                              (() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                const start = new Date(startDate);
                                start.setHours(0, 0, 0, 0);

                                const end = new Date(endDate);
                                end.setHours(23, 59, 59, 999);

                                if (today >= start && today <= end) {
                                  return (
                                    <div className="d-flex align-items-center gap-1">
                                      <a
                                        href={item.link_icare}
                                        target="_blank"
                                        className="btn btn-primary btn-sm"
                                        style={{ fontSize: "10px" }}
                                      >
                                        Icare
                                      </a>
                                      <span
                                        className="text-muted-theme-theme"
                                        style={{ fontSize: "9px" }}
                                      >
                                        {item.dr_visite_nm}
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <span style={{ color: "red" }}>
                                    Link Kadaluarsa
                                  </span>
                                );
                              })()
                            )}
                          </td>

                          <td>
                            {item.ip_address || (
                              <span style={{ color: "gray" }}>Belum iCare</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" align="center">
                      Atur Filter untuk Akses Rincian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-outline-secondary btn-sm"
            >
              « Prev
            </button>
            <div>{renderPageNumbers()}</div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-outline-secondary btn-sm"
            >
              Next »
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringIcare;
