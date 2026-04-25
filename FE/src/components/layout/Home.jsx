import { useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "../../context/AuthContext";

const HomeIndex = ({ setRightContent }) => {
  const { role } = useAuth();

  // ======================================
  // ======== Dummy Summary ===============
  const kpi = [
    { name: "BOR (Bed Occupancy Rate)", value: 78, target: 75 },
    { name: "ALOS (Avg Length of Stay)", value: 4.2, target: 4.0 },
    { name: "TOI (Turn Over Interval)", value: 3.1, target: 3.5 },
  ];

  const cardSummary = [
    { title: "Pendapatan", val: 250000000, color: "bg-primary" },
    { title: "Potongan", val: 50000000, color: "bg-danger" },
    { title: "Bersih", val: 200000000, color: "bg-success" },
    { title: "Kunjungan Pasien", val: 1280, color: "bg-dark" },
  ];

  const pieData = [
    { name: "Rawat Jalan", value: 450 },
    { name: "Rawat Inap", value: 220 },
    { name: "IGD", value: 610 },
  ];
  const colors = ["#007bff", "#28a745", "#dc3545"];

  // ======================================
  // Charts
  const barData = [
    { bulan: "Jan", Pendapatan: 20, Potongan: 5 },
    { bulan: "Feb", Pendapatan: 22, Potongan: 4 },
    { bulan: "Mar", Pendapatan: 25, Potongan: 6 },
    { bulan: "Apr", Pendapatan: 27, Potongan: 5 },
    { bulan: "Mei", Pendapatan: 30, Potongan: 6 },
  ];

  const lineData = [
    { bulan: "Jan", SPM: 70 },
    { bulan: "Feb", SPM: 75 },
    { bulan: "Mar", SPM: 78 },
    { bulan: "Apr", SPM: 80 },
    { bulan: "Mei", SPM: 82 },
  ];

  const areaData = [
    { bulan: "Jan", Covid: 40, NonCovid: 90 },
    { bulan: "Feb", Covid: 30, NonCovid: 110 },
    { bulan: "Mar", Covid: 35, NonCovid: 120 },
    { bulan: "Apr", Covid: 25, NonCovid: 130 },
    { bulan: "Mei", Covid: 20, NonCovid: 140 },
  ];

  const activities = [
    { unit: "SDM", total: 124 },
    { unit: "Keuangan", total: 98 },
    { unit: "Pelayanan", total: 89 },
    { unit: "IGD", total: 61 },
    { unit: "Farmasi", total: 55 },
  ];

  useEffect(() => setRightContent(null), []);

  return (
    <div className="container-fluid">
      {/* ==== KPI mini ===== */}
      <div className="row mt-0">
        {kpi.map((item, i) => (
          <div className="col-md-4 mb-3" key={i}>
            <div className="card card-theme shadow-sm">
              <div className="card-body">
                <h6>{item.name}</h6>
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <p className="mt-2 mb-0">
                  {item.value}% (target {item.target}%)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==== Summary cards ===== */}
      <div className="row mt-4">
        {cardSummary.map((i, idx) => (
          <div className="col-md-3 mb-3" key={idx}>
            <div className={`card text-white shadow-sm ${i.color}`}>
              <div className="card-body text-center">
                <h6>{i.title}</h6>
                <h4>{i.val.toLocaleString("id-ID")}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==== Charts 1 ==== */}
      <div className="row">
        {/* BAR */}
        <div className="col-md-6 mb-4">
          <div className="card card-theme shadow-sm">
            <div className="card-header bg-dark text-white">
              Pendapatan vs Potongan
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Pendapatan" fill="#007bff" />
                <Bar dataKey="Potongan" fill="#dc3545" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINE */}
        <div className="col-md-6 mb-4">
          <div className="card card-theme shadow-sm">
            <div className="card-header bg-dark text-white">SPM Global</div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip />
                <Line dataKey="SPM" stroke="#28a745" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==== Charts 2 ==== */}
      <div className="row">
        {/* Donut */}
        <div className="col-md-4 mb-4">
          <div className="card card-theme shadow-sm">
            <div className="card-header bg-dark text-white">
              Distribusi Kunjungan
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={120}
                  fill="#888"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Stacked */}
        <div className="col-md-8 mb-4">
          <div className="card card-theme shadow-sm">
            <div className="card-header bg-dark text-white">
              Kasus Covid vs NonCovid
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={areaData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip />
                <Area
                  dataKey="Covid"
                  stackId="1"
                  stroke="#dc3545"
                  fill="#dc3545"
                />
                <Area
                  dataKey="NonCovid"
                  stackId="1"
                  stroke="#007bff"
                  fill="#007bff"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==== Table ==== (role check) */}
      {role === "admin" && (
        <div className="card card-theme shadow-sm mb-5">
          <div className="card-header bg-dark text-white">
            Unit Aktivitas Tertinggi
          </div>
          <div className="table-responsive">
            <table className="table table-theme table-striped mb-0">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Total Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((x, i) => (
                  <tr key={i}>
                    <td>{x.unit}</td>
                    <td>{x.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeIndex;
