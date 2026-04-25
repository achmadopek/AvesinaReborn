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
  getTagihanJatuhTempo,
  getTopTagihan,
  getBottomTagihan,
} from "../../api/wj_mobay/DashboardMobay";

import { formatCurrency } from "../../utils/FormatNumber";

const HomeMobay = () => {
  // ================= STATE ================
  const [grafik, setGrafik] = useState(null);
  const [tempo, setTempo] = useState({
    jatuhTempoTerdekat: [],
    jatuhTempoTerlewat: [],
  });
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

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [start, setStart] = useState(
    formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
  );

  const [end, setEnd] = useState(
    formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  );

  const fetchDashboard = (startDate, endDate) => {
    setLoading(true);

    Promise.all([
      getGrafikDashboard({ start: startDate, end: endDate }),
      getTagihanJatuhTempo({ start: startDate, end: endDate }),
      getTopTagihan({ start: startDate, end: endDate }),
      getBottomTagihan({ start: startDate, end: endDate }),
    ])
      .then(([g, t, top, bottom]) => {
        setGrafik(g);
        setTempo({
          jatuhTempoTerdekat: t?.jatuhTempoTerdekat || [],
          jatuhTempoTerlewat: t?.jatuhTempoTerlewat || [],
        });
        setTop5(top);
        setBottom5(bottom);
      })
      .catch((err) => console.error("Dashboard Error:", err))
      .finally(() => setLoading(false));
  };

  // ================= FETCH GRAFIK ================
  useEffect(() => {
    if (filterMode === "range") {
      fetchDashboard(start, end);
    } else if (filterMode === "month") {
      const startDate = formatLocalDate(new Date(year, month - 1, 1));
      const endDate = formatLocalDate(new Date(year, month, 0));

      fetchDashboard(startDate, endDate);
    } else {
      fetchDashboard(null, null);
    }
  }, [filterMode, start, end, month, year]);

  // ================= DATA UNTUK CHART ================
  const chartData =
    grafik?.labels?.map((tgl, idx) => ({
      tanggal: tgl.replaceAll("-", "/"),
      Tagihan: grafik.tagihan?.[idx] || 0,
      Diajukan: grafik.diajukan?.[idx] || 0,
      Dibayar: grafik.dibayar?.[idx] || 0,
      Hutang: grafik.hutang?.[idx] || 0,
      Sisa: grafik.sisaTagihan?.[idx] || 0,
      HutangSisa: grafik.hutangDanSisaTagihan?.[idx] || 0,
    })) || [];

  const applyFilter = () => {
    if (filterMode === "range") {
      fetchDashboard(start, end);
    } else if (filterMode === "month") {
      const startDate = formatLocalDate(new Date(year, month - 1, 1));
      const endDate = formatLocalDate(new Date(year, month, 0));

      setStart(startDate);
      setEnd(endDate);

      fetchDashboard(startDate, endDate);
    } else {
      fetchDashboard(null, null); // jika endpoint mendukung
    }

    setShowFilter(false);
  };

  return (
    <div className="container-fluid py-0 px-0" style={{ position: "relative" }}>
      {/* ===================== FLOAT BUTTON + ACTIVE RANGE ===================== */}
      <div
        className="fixed top-4 right-4 flex items-center gap-3 z-50"
        style={{
          position: "fixed",
          top: "70px",
          right: "-5px",
          zIndex: 9999,
          width: "25px",
          height: "200px",
          background: "#2563eb",
          color: "white",
          borderRadius: "5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          padding: "10",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        {/* FILTER BUTTON */}
        <div
          onClick={() => setShowFilter((prev) => !prev)}
          role="button"
          tabIndex={0}
        >
          {/* LABEL RANGE AKTIF */}
          <div className="">
            {filterMode === "range" && (
              <b>
                {start} s/d {end}
              </b>
            )}

            {filterMode === "month" && (
              <b>
                {bulanList[month - 1]} {year}
              </b>
            )}

            {filterMode === "all" && (
              <>
                <b>Semua data</b>
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
            width: "350px",
            top: "70px",
            borderTopLeftRadius: "12px",
            borderBottomLeftRadius: "12px",
            position: "fixed",
            zIndex: 9998,
            right: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div className="p-5 rounded-xl shadow-2xl w-[400px] animate-slideLeft">
            {/* HEADER */}
            <h2 className="text-lg font-bold text-slate-700 mb-4">
              Filter Data Dashboard
            </h2>

            <div className="space-y-3">

              {/* MODE */}
              <div className="row items-center">
                <label className="col-md-4 text-sm font-medium text-gray-700">
                  Filter Berdasarkan
                </label>
                <select
                  className="col-md-8 w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="range">Range</option>
                  <option value="month">Bulanan</option>
                  <option value="all">Semua Data</option>
                </select>
              </div>

              {/* RANGE */}
              {filterMode === "range" && (
                <>
                  <div className="row items-center">
                    <label className="col-md-4 text-sm text-gray-700">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      className="col-md-8 w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </div>

                  <div className="row items-center">
                    <label className="col-md-4 text-sm text-gray-700">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      className="col-md-8 w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* MONTH */}
              {filterMode === "month" && (
                <>
                  <div className="row items-center">
                    <label className="col-md-4 text-sm text-gray-700">
                      Bulan
                    </label>
                    <select
                      className="col-md-8 w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {bulanList.map((nama, i) => (
                        <option key={i + 1} value={i + 1}>
                          {nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row items-center">
                    <label className="col-md-4 text-sm text-gray-700">
                      Tahun
                    </label>
                    <input
                      type="number"
                      className="col-md-8 w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </div>
                </>
              )}

            </div>

            <div className="mt-3 flex justify-between">
              <button
                className="px-4 py-2 bg-gray-400 rounded me-2"
                onClick={() => {
                  setFilterMode("month");
                  setMonth(now.getMonth() + 1);
                  setYear(now.getFullYear());
                }}
              >
                Reset
              </button>

              <button
                className="px-4 py-2 bg-blue-600 rounded"
                onClick={() => setShowFilter(false)}
              >
                Tutup
              </button>
            </div>

            {/* GRID WRAPPER */}
            <div className="grid grid-cols-[130px_1fr] gap-y-4 gap-x-3"></div>
          </div>
        </div>
      )}

      {/* ================= SUMMARY CARD ================= */}
      <div className="row mt-3 mb-3">
        {[
          {
            label: "Total Tagihan",
            value: grafik?.totalTagihan,
            bg: "bg-primary",
            icon: "fa-file-invoice",
          },
          {
            label: "Total Diajukan",
            value: grafik?.totalDiajukan,
            bg: "bg-warning",
            icon: "fa-paper-plane",
          },
          {
            label: "Total Dibayar",
            value: grafik?.totalDibayar,
            bg: "bg-success",
            icon: "fa-check-circle",
          },
          {
            label: "Total Hutang",
            value: grafik?.totalHutang,
            bg: "bg-danger",
            icon: "fa-exclamation-circle",
          },
          {
            label: "Sisa Tagihan",
            value: grafik?.totalSisaTagihan,
            bg: "bg-secondary",
            icon: "fa-clock",
          },
          {
            label: "Hutang & Sisa Tagihan",
            value: grafik?.totalHutangDanSisaTagihan,
            bg: "bg-info",
            icon: "fa-calculator",
          },
        ].map((item) => (
          <div className="col-12 col-md-6 col-lg-2 mb-2" key={item.label}>
            <div className={`card shadow-sm text-white ${item.bg} border-0`}>
              <div className="card-body text-center">
                <h6>
                  <i className={`fas ${item.icon} me-2`}></i>
                  {item.label}
                </h6>
                <div className="fs-5 fw-bold">
                  {loading ? "..." : formatCurrency(item.value || 0)}
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
            Grafik Harian Tagihan - Diajukan - Dibayar - Hutang
          </h6>
        </div>

        <div className="card-body" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={JSON.stringify(chartData)} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="tanggal"
                type="category"
                interval={0}
                allowDuplicatedCategory={false}
                tick={{ fontSize: 8 }}
                angle={-45}
                textAnchor="end"
              />

              <YAxis tickFormatter={(val) => formatCurrency(val)} />

              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Tanggal: ${label}`}
              />

              <Bar dataKey="Tagihan" fill="#2563eb" />
              <Bar dataKey="Diajukan" fill="#f59e0b" />
              <Bar dataKey="Dibayar" fill="#16a34a" />
              <Bar dataKey="Hutang" fill="#dc2626" />
              <Bar dataKey="Sisa" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= JATUH TEMPO ================= */}
      <div className="row">
        {/* Terdekat */}
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm card-theme">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">Jatuh Tempo Terdekat</h6>
            </div>
            <div className="card-body p-2">
              <div className="table-responsive">
                <table className="table table-theme table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Faktur</th>
                      <th>Provider</th>
                      <th>Tagihan</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempo.jatuhTempoTerdekat?.length > 0 ? (
                      tempo.jatuhTempoTerdekat.map((r, i) => (
                        <tr key={i}>
                          <td>{r.invoice_no}</td>
                          <td>{r.prvdr_str}</td>
                          <td>{formatCurrency(r.total_tagihan)}</td>
                          <td>{r.invoice_due_dt?.slice(0, 10) || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
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

        {/* Terlewat */}
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm card-theme">
            <div className="card-header bg-danger text-white">
              <h6 className="mb-0">Jatuh Tempo Terlewat</h6>
            </div>
            <div className="card-body p-2">
              <div className="table-responsive">
                <table className="table table-theme table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Faktur</th>
                      <th>Provider</th>
                      <th>Tagihan</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempo.jatuhTempoTerlewat?.length > 0 ? (
                      tempo.jatuhTempoTerlewat.map((r, i) => (
                        <tr key={i}>
                          <td>{r.invoice_no}</td>
                          <td>{r.prvdr_str}</td>
                          <td>{formatCurrency(r.total_tagihan)}</td>
                          <td>{r.invoice_due_dt?.slice(0, 10) || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
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

      {/* ================= TOP & BOTTOM ================= */}
      <div className="row">
        {/* TOP 5 */}
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm card-theme">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0">Top 5 Tagihan Tertinggi</h6>
            </div>
            <div className="card-body p-2">
              <table className="table table-theme table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Unit</th>
                    <th>Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.length > 0 ? (
                    top5.map((r, i) => (
                      <tr key={i}>
                        <td>{r.prvdr_str}</td>
                        <td>{r.srvc_unit_nm}</td>
                        <td>{formatCurrency(r.total_tagihan)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
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
              <h6 className="mb-0">Bottom 5 Tagihan Terendah</h6>
            </div>
            <div className="card-body p-2">
              <table className="table table-theme table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Unit</th>
                    <th>Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {bottom5.length > 0 ? (
                    bottom5.map((r, i) => (
                      <tr key={i}>
                        <td>{r.prvdr_str}</td>
                        <td>{r.srvc_unit_nm}</td>
                        <td>{formatCurrency(r.total_tagihan)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
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

export default HomeMobay;
