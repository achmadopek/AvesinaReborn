import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { formatSortDateTime } from "../../../utils/FormatDate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  fetchMonitoringVisiteSummary,
  fetchMonitoringVisiteActivity,
  fetchMonitoringDoctorPerformance,
} from "../../../api/wj_monapp/MasterMonitoring";

import SearchSelectDokter from "../../../components/search/SearchSelectDokter";

// ==================== HELPER FUNCTIONS ====================
const getSPMStatus = (visiteDt) => {
  const dt = new Date(visiteDt);
  const minutes = dt.getHours() * 60 + dt.getMinutes();
  const isStandar = minutes >= 300 && minutes <= 840; // 05:00 - 14:00

  return {
    isStandar,
    label: isStandar ? "Sudah Standar" : "Belum Standar",
    badgeClass: isStandar ? "bg-info text-dark" : "bg-secondary",
  };
};

const getINMStatus = (visiteDt) => {
  const dt = new Date(visiteDt);
  const minutes = dt.getHours() * 60 + dt.getMinutes();
  const isStandar = minutes >= 480 && minutes <= 840; // 08:00 - 14:00

  return {
    isStandar,
    label: isStandar ? "Sudah Standar" : "Belum Standar",
    badgeClass: isStandar ? "bg-primary" : "bg-warning text-dark",
  };
};

const MonitoringVisite = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const today = new Date().toISOString().split("T")[0];

  // ==================== STATE ====================
  const [summary, setSummary] = useState({});
  const [data, setData] = useState([]);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [chartHarian, setChartHarian] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [dokter, setDokter] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("visite_dt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // ==================== FETCH FUNCTIONS ====================
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetchMonitoringVisiteSummary({
        dokter: dokter?.value || "",
        startDate,
        endDate,
      });
      setSummary(res.summary || {});
      setChartHarian(res.chartHarian || []);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  }, [dokter, startDate, endDate]);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMonitoringVisiteActivity({
        page: currentPage,
        limit,
        dokter: dokter?.value || "",
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
      });
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Error fetching activity:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    limit,
    dokter,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
  ]);

  const fetchDoctorPerformance = useCallback(async () => {
    try {
      const res = await fetchMonitoringDoctorPerformance({
        dokter: dokter?.value || "",
        startDate,
        endDate,
      });
      setDoctorPerformance(res.data || []);
    } catch (err) {
      console.error("Error fetching doctor performance:", err);
    }
  }, [dokter, startDate, endDate]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchSummary();
    fetchDoctorPerformance();
    fetchActivity();
  }, [fetchSummary, fetchDoctorPerformance, fetchActivity]);

  // ==================== HANDLERS ====================
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setStartDate(today);
    setEndDate(today);
    setDokter(null);
    setSearch("");
    setCurrentPage(1);
  };

  // Pagination Helper
  const renderPageNumbers = () => {
    const delta = 1;
    const range = (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const withDots = (pages) => {
      const result = [];
      let prev = null;
      for (let page of pages) {
        if (prev !== null && page - prev > 1) result.push("...");
        result.push(page);
        prev = page;
      }
      return result;
    };

    const startPages = range(1, Math.min(2, totalPages));
    const endPages = range(Math.max(totalPages - 1, 3), totalPages);
    const middlePages = range(
      Math.max(currentPage - delta, 3),
      Math.min(currentPage + delta, totalPages - 2),
    );

    const pages = withDots([...startPages, ...middlePages, ...endPages]);

    return pages.map((page, idx) =>
      page === "..." ? (
        <span key={`dots-${idx}`} className="mx-1">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`btn btn-sm mx-1 ${
            currentPage === page
              ? "btn-outline-primary"
              : "btn-outline-secondary"
          }`}
        >
          {page}
        </button>
      ),
    );
  };

  return (
    <>
      {/* ==================== FILTER SECTION ==================== */}
      <div className="card shadow-sm border-0 mb-3 mx-2">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-2 col-6">
              <label className="form-label small mb-1">Tanggal Dari</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small mb-1">Tanggal Hingga</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-md-4 col-12">
              <label className="form-label small mb-1">Dokter</label>
              <SearchSelectDokter
                value={dokter}
                onChange={(selected) => {
                  setDokter(selected);
                  setCurrentPage(1);
                }}
                className="w-100"
              />
            </div>

            <div className="col-md-2 col-6">
              <label className="form-label small mb-1">Pencarian</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Nama dokter / pasien / NRM..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="col-md-2 col-6">
              <button
                type="button"
                className="btn btn-sm btn-secondary w-100"
                onClick={resetFilter}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SUMMARY CARDS ==================== */}
      <div className="row g-2 mb-3 mx-2">
        {/* Aktivitas Visite */}
        <div className="col-md-6">
          <div className="card-theme p-2 h-100">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Aktivitas Visite Dokter</h6>
            </div>
            <div className="card-body">
              <div className="row g-2 text-center">
                <div className="col-4">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">DPJP</small>
                      <h3 className="fw-bold text-success mb-0">
                        {summary?.dpjpVisite || 0}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">Rubber</small>
                      <h3 className="fw-bold text-danger mb-0">
                        {summary?.rubberVisite || 0}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">Total</small>
                      <h3 className="fw-bold mb-0">
                        {summary?.totalAktivitas || 0}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pasien Rawat Inap */}
        <div className="col-md-6">
          <div className="card-theme p-2 h-100">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Pasien Rawat Inap Aktif</h6>
              <small className="text-muted">
                (Berdasarkan status saat ini)
              </small>
            </div>
            <div className="card-body">
              <div className="row g-2 text-center">
                <div className="col-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">Memiliki DPJP</small>
                      <h3 className="fw-bold text-success mb-0">
                        {summary?.pasienDPJP || 0}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">Belum DPJP</small>
                      <h3 className="fw-bold text-danger mb-0">
                        {summary?.pasienBelumDPJP || 0}
                      </h3>
                    </div>
                  </div>
                </div>
                {/*<div className="col-4">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <small className="text-muted">Total Pasien</small>
                      <h3 className="fw-bold mb-0">
                        {summary?.totalPasienRawatInap || 0}
                      </h3>
                    </div>
                  </div>
                </div>*/}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ANALISA CHARTS ==================== */}
      <div className="row g-2 mb-3 mx-2">
        {/* Pie Charts */}
        <div className="col-md-6">
          <div className="card-theme p-2 h-100">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Analisa Kepatuhan Visite</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Komposisi Aktivitas */}
                <div className="col-md-4 col-12">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center">
                      <h6 className="fw-bold mb-3">Komposisi Aktivitas</h6>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "DPJP", value: summary?.dpjpVisite || 0 },
                              {
                                name: "Rubber",
                                value: summary?.rubberVisite || 0,
                              },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(1)}%`
                            }
                          >
                            <Cell fill="#198754" />
                            <Cell fill="#dc3545" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Kepatuhan SPM */}
                <div className="col-md-4 col-12">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center">
                      <h6 className="fw-bold mb-3">Kepatuhan SPM</h6>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Standar",
                                value: Number(summary?.spmStandar || 0),
                              },
                              {
                                name: "Tidak Standar",
                                value: Number(summary?.spmTidakStandar || 0),
                              },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(1)}%`
                            }
                          >
                            <Cell fill="#0dcaf0" />
                            <Cell fill="#6c757d" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Kepatuhan INM */}
                <div className="col-md-4 col-12">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center">
                      <h6 className="fw-bold mb-3">Kepatuhan INM</h6>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Standar",
                                value: Number(summary?.inmStandar || 0),
                              },
                              {
                                name: "Tidak Standar",
                                value: Number(summary?.inmTidakStandar || 0),
                              },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(1)}%`
                            }
                          >
                            <Cell fill="#0d6efd" />
                            <Cell fill="#ffc107" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Chart Harian */}
        <div className="col-md-6">
          <div className="card-theme p-2 h-100">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Trend Aktivitas Harian</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={chartHarian}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tanggal" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="dpjp"
                    name="DPJP"
                    stroke="#198754"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="rubber"
                    name="Rubber"
                    stroke="#dc3545"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== RAPOR KEPATUHAN DOKTER ==================== */}
      <div className="card-theme mx-2 mb-3 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Rapor Kepatuhan Dokter</h6>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={doctorPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="employee_nm"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="persentase" name="% Kepatuhan" fill="#198754" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table Rapor */}
        <div className="table-responsive mt-3">
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>Rank</th>
                <th>Dokter</th>
                <th>Standar</th>
                <th>Tidak Standar</th>
                <th>Total</th>
                <th>% Kepatuhan</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.map((item, index) => (
                <tr key={item.employee_id}>
                  <td>#{index + 1}</td>
                  <td>{item.employee_nm}</td>
                  <td className="text-success fw-bold">{item.visiteStandar}</td>
                  <td className="text-danger fw-bold">
                    {item.visiteTidakStandar}
                  </td>
                  <td>{item.total}</td>
                  <td>
                    <div className="progress" style={{ height: "24px" }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${item.persentase}%` }}
                      >
                        {item.persentase}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== HISTORY VISITE TABLE ==================== */}
      <div className="card-theme mx-2 mb-3 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">History Visite Dokter</h6>
        </div>
        <div className="card-body px-0 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm">
              <thead>
                <tr>
                  <th>No</th>
                  <th
                    role="button"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("visite_dt")}
                  >
                    Tanggal/Jam{" "}
                    {sortBy === "visite_dt" &&
                      (sortOrder === "ASC" ? "▲" : "▼")}
                  </th>
                  <th>Status SPM</th>
                  <th>Status INM</th>
                  <th>Dokter Visite</th>
                  <th>Pelayanan</th>
                  <th>Poli</th>
                  <th>NRM</th>
                  <th>Nama Pasien</th>
                  <th>DPJP Pasien</th>
                  <th>Jenis</th>
                  <th>Sumber</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((item, index) => {
                    const spm = getSPMStatus(item.visite_dt);
                    const inm = getINMStatus(item.visite_dt);

                    return (
                      <tr key={`${item.sumber}-${item.row_id}`}>
                        <td>{(currentPage - 1) * limit + index + 1}</td>
                        <td>{formatSortDateTime(item.visite_dt)}</td>
                        <td className="text-center">
                          <span className={`badge ${spm.badgeClass}`}>
                            {spm.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${inm.badgeClass}`}>
                            {inm.label}
                          </span>
                        </td>
                        <td>{item.employee_nm}</td>
                        <td>{item.medical_service_name}</td>
                        <td>{item.srvc_unit_nm}</td>
                        <td>{item.mr_code}</td>
                        <td>{item.patient_nm}</td>
                        <td>{item.dpjp_nm || "(belum ada DPJP)"}</td>
                        <td className="text-center">
                          <span
                            className={`badge ${item.jenis === "DPJP" ? "bg-success" : "bg-danger"}`}
                          >
                            {item.jenis}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${item.sumber === "VISITE" ? "bg-primary" : "bg-warning text-dark"}`}
                          >
                            {item.sumber}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3 px-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              « Prev
            </button>

            <div className="d-flex">{renderPageNumbers()}</div>

            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next »
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringVisite;
