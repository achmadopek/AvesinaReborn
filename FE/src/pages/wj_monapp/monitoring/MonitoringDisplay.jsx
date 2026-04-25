import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
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
  ResponsiveContainer,
} from "recharts";
import { fetchMonitoringDisplaySummary, fetchMonitoringDisplayMonthly } from "../../../api/wj_monapp/MasterMonitoring";
import { formatSortDateTime } from "../../../utils/FormatDate";

const MonitoringDisplay = () => {
  const { role } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [offlineThreshold, setOfflineThreshold] = useState(20);

  const [summary, setSummary] = useState(null);
  const [displays, setDisplays] = useState([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [monthlyData, setMonthlyData] = useState([]);
  const [devices, setDevices] = useState([]);

  const isFetching = useRef(false);

  const fetchData = async () => {
    if (isFetching.current) return;

    isFetching.current = true;
    setLoading(true);

    try {
      const res = await fetchMonitoringDisplaySummary({
        date,
        offlineThreshold,
      });
      setSummary(res.summary);
      setDisplays(res.perDisplay || []);
    } catch (err) {
      console.error("Gagal fetch monitoring display:", err);
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch pertama kali
    fetchData();

    // auto refresh tiap 10 detik
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // 10.000 ms = 10 detik

    // cleanup saat unmount / dependency berubah
    return () => clearInterval(interval);
  }, [date, offlineThreshold]);

  useEffect(() => {
    fetchMonthly();
  }, [month]);

  const fetchMonthly = async () => {
    try {
      const res = await fetchMonitoringDisplayMonthly({ month });
      setMonthlyData(res.data || []);
      setDevices(res.devices || []);
    } catch (err) {
      console.error("Gagal fetch monthly chart:", err);
    }
  };

  /* ===== GRAFIK DATA ===== */
  const pieData = [
    { name: "Online", value: Number(summary?.online || 0) },
    { name: "Offline", value: Number(summary?.offline || 0) },
  ];

  const offlineBarData = displays.map((d) => ({
    name: d.device_id,
    value: d.total_offline_seconds,
  }));

  const disconnectBarData = displays.map((d) => ({
    name: d.device_id,
    value: d.disconnect_count,
  }));

  const formatSecondsToHMS = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return [h, m, s]
      .map(v => String(v).padStart(2, "0"))
      .join(":");
  };

  const COLORS = ["#4caf50", "#f44336", "#2196f3", "#ff9800"];

  return (
    <>
      {/* FILTER */}
      <div className="row mb-2 p-2">
        <div className="col-md-3 col-6">
          <label className="form-label">Tanggal</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="col-md-3 col-6">
          <label className="form-label">Offline Threshold (detik)</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={offlineThreshold}
            onChange={(e) => setOfflineThreshold(Number(e.target.value))}
          />
        </div>

        <div className="col-md-3 col-6">
          <label className="form-label">Bulan</label>
          <input
            type="month"
            className="form-control form-control-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="col-md-3 col-12 d-flex align-items-end">
          <button
            className="btn btn-sm btn-secondary w-100"
            onClick={fetchData}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* GRAFIK */}
      <div className="card-theme ms-2 me-2 mb-3 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring Display Antrian</h6>
        </div>

        <div className="card-body px-0 py-0">
          <div className="row gx-0 gy-3 p-3">

            {/* PIE */}
            <div className="chart-box col-md-4 col-12">
              <h6>Status Display</h6>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="60%"          // geser pie ke kiri
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>

                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* OFFLINE DURATION */}
            <div className="chart-box col-md-4 col-12">
              <h6>Total Offline (detik)</h6>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={offlineBarData}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* DISCONNECT */}
            <div className="chart-box col-md-4 col-12">
              <h6>Jumlah Disconnect</h6>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={disconnectBarData}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          <div className="row gy-3 p-3">
            {/* MONTHLY RECAP */}
            <div className="chart-box col-md-12 col-12">
              <h6>Rekap Bulanan</h6>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  {devices.map((dev, i) => (
                    <Line
                      key={dev}
                      type="monotone"
                      dataKey={dev}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Status Display</h6>
        </div>

        <div className="card-body table-responsive">
          <table className="table table-theme table-bordered table-sm">
            <thead>
              <tr>
                <th>No</th>
                <th>Device</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>IP</th>
                <th>Page</th>
                <th>Offline</th>
                <th>Disconnect</th>
              </tr>
            </thead>

            <tbody>
              {displays.length > 0 ? (
                displays.map((d, i) => (
                  <tr key={d.device_id}>
                    <td>{i + 1}</td>
                    <td>{d.device_id}</td>
                    <td>
                      <span
                        className={`badge ${d.status === "ONLINE"
                          ? "bg-success"
                          : "bg-danger"
                          }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td>{formatSortDateTime(d.last_seen)}</td>
                    <td>{d.last_ip}</td>
                    <td>{d.last_page}</td>
                    <td>{formatSecondsToHMS(d.total_offline_seconds)}</td>
                    <td>{d.disconnect_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonitoringDisplay;
