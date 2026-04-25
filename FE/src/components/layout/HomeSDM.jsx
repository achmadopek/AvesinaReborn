import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  getGrafikDashboard,
  getAlertAdministratif,
  getTopRanking,
  getBottomRanking,
} from "../../api/wj_sdm/DashboardSDM";

import { formatCurrency } from "../../utils/FormatNumber";

const HomeSDM = () => {
  // ================= STATE ================
  const [summary, setSummary] = useState(null);
  const [grafikMKG, setGrafikMKG] = useState([]);
  const [alert, setAlert] = useState({});
  const [top5, setTop5] = useState([]);
  const [bottom5, setBottom5] = useState([]);

  const [loading, setLoading] = useState(true);

  // ======== STATE UNTUK FILTER ========
  const [showFilter, setShowFilter] = useState(false);
  const [filterMode, setFilterMode] = useState("month");

  // default bulan & tahun = bulan berjalan
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const bulanList = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // default range tanggal
  const [start, setStart] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [end, setEnd] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)
  );

  // FIlter State
  const [by, setBy] = useState("golongan");

  // Label UI
  const filterLabelMap = {
    golongan: "Golongan",
    pangkat: "Pangkat",
    education: "Pendidikan",
    employee_sts: "Status Pegawai",
  };

  const filterLabel = filterLabelMap[by] || "Golongan";

  const fetchDashboard = (startDate = null, endDate = null, byParam = by) => {
    setLoading(true);

    Promise.all([
      getGrafikDashboard(startDate, endDate),
      getAlertAdministratif(),
      getTopRanking(byParam),
      getBottomRanking(byParam),
    ])
      .then(([g, a, top, bottom]) => {
        setSummary(g.summary);
        setGrafikMKG(g.grafikMKG);
        setAlert(a);
        setTop5(top);
        setBottom5(bottom);
      })
      .finally(() => setLoading(false));
  };

  // ================= FETCH GRAFIK ================
  useEffect(() => {
    fetchDashboard(start, end, by);
  }, []);

  // === Re-fetch khusus Top & Bottom saat by berubah ===
  useEffect(() => {
    getTopRanking(by).then(setTop5);
    getBottomRanking(by).then(setBottom5);
  }, [by]);

  // ================= DATA UNTUK CHART ================
  const chartData =
    grafikMKG?.labels?.map((l, i) => ({
      label: l,
      total: grafikMKG.data[i],
    })) || [];

  const applyFilter = () => {
    if (filterMode === "range") {
      fetchDashboard(start, end, by);
    } else if (filterMode === "month") {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

      setStart(startDate);
      setEnd(endDate);

      fetchDashboard(startDate, endDate, by);
    } else {
      fetchDashboard(null, null, by);
    }

    setShowFilter(false);
  };

  const cards = [
    {
      label: "Total Pegawai",
      value: summary?.totalPegawai,
      icon: "fa-solid fa-users",
      bg: "bg-primary",
    },
    {
      label: "PNS",
      value: summary?.pns,
      icon: "fa-solid fa-id-badge",
      bg: "bg-success",
    },
    {
      label: "Non PNS",
      value: summary?.nonPns,
      icon: "fa-solid fa-user-minus",
      bg: "bg-warning",
    },
    {
      label: "Dokter",
      value: summary?.dokter,
      icon: "fa-solid fa-user-doctor",
      bg: "bg-info",
    },
  ];

  return (
    <div className="container-fluid py-0 px-0" style={{ position: "relative" }}>
      {/* ===================== FLOAT BUTTON + ACTIVE RANGE ===================== */}
      <div
        className="fixed top-4 right-4 flex items-center gap-3 z-50"
        style={{
          position: "fixed",
          top: "4.5rem",
          right: "1.2rem",
          zIndex: 1000,
          width: "48px",
          height: "48px",
          background: "#2563eb",
          color: "white",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      >
        {/* FILTER BUTTON */}
        <div
          onClick={() => setShowFilter((prev) => !prev)}
          role="button"
          tabIndex={0}
        >
          {/* LABEL RANGE AKTIF */}
          <div className="bg-white shadow-md border px-3 py-1 rounded-full text-sm text-gray-700">
            {filterMode === "range" && (
              <>
                Range: <b>{start}</b> s/d <b>{end}</b>
              </>
            )}

            {filterMode === "month" && (
              <>
                Bulan:{" "}
                <b>
                  {month}/{year}
                </b>
              </>
            )}

            {filterMode === "all" && (
              <>
                Menampilkan: <b>Semua data</b>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===================== MODAL FILTER ===================== */}
      {showFilter && (
        <div
          className="bg-white shadow-2xl z-50 animate-slideLeft"
          style={{
            width: "400px",
            borderTopLeftRadius: "12px",
            borderBottomLeftRadius: "12px",
            position: "absolute",
            zIndex: 2,
            right: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div className="p-5 rounded-xl shadow-2xl w-[400px] animate-slideLeft">
            {/* HEADER */}
            <h2 className="text-lg font-bold text-slate-700 mb-4">
              Filter Data Dashboard
            </h2>

            <table className="table table-theme table-responsive">
              {/* MODE SELECTOR */}
              <tr>
                <td>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    Filter Berdasarkan
                  </label>
                </td>
                <td>
                  <select
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                  >
                    <option value="range">Range Tanggal</option>
                    <option value="month">Bulan & Tahun</option>
                    <option value="all">Semua Data</option>
                    <option value="job_sts">Jenis Jabatan</option>
                    <option value="doctor_sts">Spesialis Dokter</option>
                  </select>
                </td>
              </tr>

              {/* RANGE TANGGAL */}
              {filterMode === "range" && (
                <>
                  <tr>
                    <td>
                      <label className="text-sm text-gray-700 flex items-center">
                        Tanggal Mulai
                      </label>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label className="text-sm text-gray-700 flex items-center">
                        Tanggal Selesai
                      </label>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                      />
                    </td>
                  </tr>
                </>
              )}

              {/* BULAN & TAHUN */}
              {filterMode === "month" && (
                <>
                  <tr>
                    <td>
                      <label className="text-sm text-gray-700 flex items-center">
                        Bulan
                      </label>
                    </td>
                    <td>
                      <select
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        {bulanList.map((nama, i) => (
                          <option key={i + 1} value={i + 1}>
                            {nama}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label className="text-sm text-gray-700 flex items-center">
                        Tahun
                      </label>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </td>
                  </tr>
                </>
              )}
            </table>

            {/* GRID WRAPPER */}
            <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-3"></div>

            {/* FOOTER BUTTON */}
            <div className="mt-5 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                onClick={applyFilter}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUMMARY CARD ================= */}
      <div className="row mt-3 mb-3">
        {cards.map((c) => (
          <div className="col-md-3 col-sm-6 mb-3" key={c.label}>
            <div
              className={`card shadow-sm ${c.bg} text-white h-100`}
              style={{ borderRadius: "14px" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75">{c.label}</div>
                  <div className="fs-4 fw-bold">
                    {loading ? "..." : c.value}
                  </div>
                </div>

                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                  }}
                >
                  <i className={`${c.icon} fs-4`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= GRAFIK BAR ================= */}
      <div className="card shadow-sm card-theme mb-3">
        <div className="card-header">
          <h6 className="mb-0">
            Distribusi Pegawai Berdasarkan Masa Kerja (MKG)
          </h6>
        </div>

        <div className="card-body" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
            >
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value} Pegawai`, 'Jumlah']}
                labelFormatter={(label) => `Masa Kerja: ${label}`}
                cursor={{ fill: 'rgba(37,99,235,0.08)' }}
              />
              <Bar
                dataKey="total"
                radius={[6, 6, 0, 0]}
                fill="#2563eb"
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= ALERT ADMINISTRATIF ================= */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card border-warning">
            <div className="card-body text-center">
              <h6>Belum Diverifikasi</h6>
              <div className="fs-3 fw-bold text-warning">
                {alert.belumVerified}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h6>Belum Divalidasi</h6>
              <div className="fs-3 fw-bold text-danger">
                {alert.belumValidated}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TOP & BOTTOM ================= */}
      <div className="row">
        <div className="col-12 mb-2 d-flex align-items-center gap-2">
          <label htmlFor="filter_by" className="mb-0">
            Filter
          </label>
          <select
            className="form-control form-control-sm form-control form-control-sm-sm border border-secondary rounded-2 w-100"
            value={by}
            onChange={(e) => setBy(e.target.value)}
            id="filter_by"
            style={{ width: "200px" }} // atur lebar select
          >
            <option value="golongan">Golongan</option>
            <option value="education">Pendidikan</option>
            <option value="pangkat">Pangkat</option>
            <option value="employee_sts">Status Pegawai</option>
            <option value="job_sts">Jenis Jabatan</option>
            <option value="doctor_sts">Spesialis Dokter</option>
          </select>
        </div>

        {/* TOP 5 */}
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm card-theme">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0">
                Top 5 Pegawai Terbanyak
                <small className="text-light ms-2">
                  (berdasarkan {filterLabel})
                </small>
              </h6>
            </div>
            <div className="card-body p-2">
              <table className="table table-theme table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="text-end">Jumlah Pegawai</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.length > 0 ? (
                    top5.map((r, i) => (
                      <tr key={i}>
                        <td>{r.label || "-"}</td>
                        <td className="text-end fw-semibold">{r.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center text-muted-theme">
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM 5 */}
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm card-theme">
            <div className="card-header bg-secondary text-white">
              <h6 className="mb-0">
                Bottom 5 Pegawai Tersedikit
                <small className="text-light ms-2">
                  (berdasarkan {filterLabel})
                </small>
              </h6>
            </div>
            <div className="card-body p-2">
              <table className="table table-theme table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="text-end">Jumlah Pegawai</th>
                  </tr>
                </thead>
                <tbody>
                  {bottom5.length > 0 ? (
                    bottom5.map((r, i) => (
                      <tr key={i}>
                        <td>{r.label || "-"}</td>
                        <td className="text-end fw-semibold">{r.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center text-muted-theme">
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSDM;
