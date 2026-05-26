import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
  Legend
} from "recharts";

import {
  fetchMonitoringVisite
} from "../../../api/wj_monapp/MasterMonitoring";

import SearchSelectDokter from "../../../components/search/SearchSelectDokter";

const MonitoringVisite = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [statusFilter, setStatusFilter] = useState("");
  const [dokter, setDokter] = useState(null);
  const [dokterList, setDokterList] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState(null);

  const [rekapDokter, setRekapDokter] = useState([]);

  const [sortBy, setSortBy] = useState("visite_dt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const [chartHarian, setChartHarian] = useState([]);

  const dokterChartData = rekapDokter
    .slice(0, 10)
    .map((d) => ({
      dokter: d.employee_nm,
      total: Number(d.total_visite)
    }));

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) =>
        prev === "ASC" ? "DESC" : "ASC"
      );
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }

    setCurrentPage(1);
  };

  const coverage =
    summary?.totalPasienAktif > 0
      ? (
          summary?.sudahDivisite /
          summary?.totalPasienAktif
        ) * 100
      : 0;

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await fetchMonitoringVisite({
        page: currentPage,
        limit,
        statusFilter,
        startDate,
        endDate,
        search,
        dokter: dokter?.value || "",
        sortBy,
        sortOrder,
      });

      console.log("RES:", res);

      setData(res.data || []);
      setRekapDokter(res.rekapDokter || []);
      setDokterList(res.dokterList || []);
      setTotalPages(res.totalPages || 1);
      setSummary(res.summary || {});
      setChartHarian(res.chartHarian || []);
    } catch (err) {
      console.error("Gagal ambil data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    currentPage,
    startDate,
    endDate,
    statusFilter,
    search,
    dokter,
    sortBy,
    sortOrder
  ]);

  console.log("dokterList:", dokterList);

  // === Pagination helper ===
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
      Math.min(currentPage + delta, totalPages - 2)
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
          className={`btn btn-sm mx-1 ${currentPage === page
            ? "btn-outline-primary"
            : "btn-outline-secondary"
            }`}
        >
          {page}
        </button>
      )
    );
  };

  const barData = rekapDokter.map((d) => ({
    name: d.employee_nm,
    value: Number(d.total_visite)
  }));

  const COLORS = ["#4caf50", "#ff9800", "#f44336", "#2196f3"];

  return (
  <>
    {/* ============================= */}
    {/* FILTER */}
    {/* ============================= */}
    <div className="card shadow-sm border-0 mb-3 mx-2">
      <div className="card-body">

        <div className="row g-2">

          {/* TANGGAL DARI */}
          <div className="col-md-2 col-6">
            <label className="form-label small mb-1">
              Tanggal Dari
            </label>

            <input
              type="date"
              className="form-control form-control-sm p-2"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />
          </div>

          {/* TANGGAL HINGGA */}
          <div className="col-md-2 col-6">
            <label className="form-label small mb-1">
              Tanggal Hingga
            </label>

            <input
              type="date"
              className="form-control form-control-sm p-2"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />
          </div>

          {/* STATUS */}
          <div className="col-md-3 col-6">
            <label className="form-label small mb-1">
              Status
            </label>

            <select
              className="form-control form-control-sm p-2"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">
                Semua Data
              </option>

              <option value="spm_ok">
                SPM Standar
              </option>

              <option value="spm_no">
                SPM Tidak Standar
              </option>

              <option value="inm_ok">
                INM Standar
              </option>

              <option value="inm_no">
                INM Tidak Standar
              </option>
            </select>
          </div>

          {/* DOKTER */}
          <div className="col-md-3 col-6">
            <label className="form-label small mb-1">
              Dokter
            </label>

            <SearchSelectDokter
              value={dokter}
              onChange={(selected) => {
                setDokter(selected);
                setCurrentPage(1);
              }}
              className="w-100 p-0"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "33px",
                  height: "33px",
                  fontSize: "12px"
                }),

                valueContainer: (base) => ({
                  ...base,
                  height: "33px",
                  padding: "0 8px"
                }),

                input: (base) => ({
                  ...base,
                  margin: "0px",
                  padding: "0px",
                  fontSize: "12px"
                }),

                indicatorsContainer: (base) => ({
                  ...base,
                  height: "33px"
                }),

                option: (base) => ({
                  ...base,
                  fontSize: "12px",
                  paddingTop: "6px",
                  paddingBottom: "6px"
                }),

                menu: (base) => ({
                  ...base,
                  fontSize: "12px"
                }),

                singleValue: (base) => ({
                  ...base,
                  fontSize: "12px"
                })
              }}
            />
          </div>

          {/* RESET */}
          <div className="col-md-2 col-12 d-flex align-items-end">
            <button
              type="button"
              className="btn btn-sm btn-secondary w-100 p-2"
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
                setStatusFilter("");
                setSearch("");
                setDokter("");
                setCurrentPage(1);
              }}
            >
              Reset Filter
            </button>
          </div>

        </div>

      </div>
    </div>

    {/* ============================= */}
    {/* HERO COVERAGE */}
    {/* ============================= */}
    <div className="card shadow-sm border-0 mb-3 mx-2">
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-2">

          <div>
            <h5 className="fw-bold mb-0">
              Coverage Visite Pasien
            </h5>

            <small className="text-muted">
              Monitoring kepatuhan visite rawat inap
            </small>
          </div>

          <div className="text-end">
            <h3 className="fw-bold text-success mb-0">
              {coverage.toFixed(1)}%
            </h3>

            <small className="text-muted">
              Sudah divisite
            </small>
          </div>

        </div>

        <div
          className="progress"
          style={{
            height: "14px",
            borderRadius: "10px"
          }}
        >
          <div
            className="progress-bar bg-success"
            style={{
              width: `${coverage}%`
            }}
          />
        </div>

      </div>
    </div>

    {/* ============================= */}
    {/* SUMMARY */}
    {/* ============================= */}
    <div className="row g-3 mb-3 mx-1">

      {/* TOTAL PASIEN */}
      <div className="col-md-3 col-6">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">

            <small className="text-muted d-block mb-1">
              Total Pasien Aktif
            </small>

            <h2 className="fw-bold text-primary mb-0">
              {summary?.totalPasienAktif || 0}
            </h2>

          </div>
        </div>
      </div>

      {/* SUDAH DIVISITE */}
      <div className="col-md-3 col-6">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">

            <small className="text-muted d-block mb-1">
              Sudah Divisite
            </small>

            <h2 className="fw-bold text-success mb-0">
              {summary?.sudahDivisite || 0}
            </h2>

          </div>
        </div>
      </div>

      {/* BELUM DIVISITE */}
      <div className="col-md-3 col-6">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">

            <small className="text-muted d-block mb-1">
              Belum Divisite
            </small>

            <h2 className="fw-bold text-danger mb-0">
              {summary?.belumDivisite || 0}
            </h2>

          </div>
        </div>
      </div>

      {/* RUBBER */}
      <div className="col-md-3 col-6">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-body">

            <small className="text-muted d-block mb-1">
              Rubber Visite
            </small>

            <h2 className="fw-bold text-secondary mb-0">
              {summary?.rubberVisite || 0}
            </h2>

          </div>
        </div>
      </div>

    </div>

      {/* GRAFIK */}
      <div className="card-theme ms-2 me-2 mb-3 p-2">

        <div className="card-header py-2 px-3">
          <h6 className="mb-0">
            Analisa Visite Dokter
          </h6>
        </div>

        <div className="card-body">

          <div className="row g-3">

            <div className="col-md-2">
              <div className="card shadow-sm h-100">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    Coverage Visite Pasien
                  </h6>

                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>

                      <Pie
                        data={[
                          {
                            name: "Sudah",
                            value: Number(summary?.sudahDivisite || 0)
                          },
                          {
                            name: "Belum",
                            value: Number(summary?.belumDivisite || 0)
                          }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
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

            {/* PIE KEPATUHAN VISITE */}
            <div className="col-md-2">
              <div className="card shadow-sm h-100">
                <div className="card-body">

                <h6 className="fw-bold mb-3">
                  Kepatuhan SPM
                </h6>

                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>

                      <Pie
                        data={[
                          {
                            name: "Standar\n(05:00 - 14:00)",
                            value: Number(summary?.spmStandar || 0)
                          },
                          {
                            name: "Tidak Standar\n(<05:00 / >14:00)",
                            value: Number(summary?.spmTidakStandar || 0)
                          }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
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

            {/* PIE KEPATUHAN VISITE */}
            <div className="col-md-2">
              <div className="card shadow-sm h-100">
                <div className="card-body">

                <h6 className="fw-bold mb-3">
                  Kepatuhan INM
                </h6>

                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>

                    <Pie
                      data={[
                        {
                          name: "Standar\n(08:00 - 14:00)",
                          value: Number(summary?.inmStandar || 0)
                        },
                        {
                          name: "Tidak Standar\n(<08:00 / >14:00)",
                          value: Number(summary?.inmTidakStandar || 0)
                        }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
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

            {/* GRAFIK HARIAN */}
            <div className="col-lg-6">

              <div className="card shadow-sm h-100">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    Kepatuhan Jam Visite Harian
                  </h6>

                  <ResponsiveContainer width="100%" height={350}>

                    <BarChart data={chartHarian}>

                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="tanggal"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis />

                      <Tooltip />

                      <Legend />

                      {/* SPM */}
                      <Bar
                        dataKey="spmStandar"
                        name="SPM Standar"
                        fill="#198754"
                      />

                      <Bar
                        dataKey="spmTidak"
                        name="SPM Tidak Standar"
                        fill="#dc3545"
                      />

                      {/* INM */}
                      <Bar
                        dataKey="inmStandar"
                        name="INM Standar"
                        fill="#0d6efd"
                      />

                      <Bar
                        dataKey="inmTidak"
                        name="INM Tidak Standar"
                        fill="#ffc107"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* TABEL */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">
            Monitoring Visite Dokter
          </h6>
        </div>

        <div className="card-body px-0 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm">
            <thead>
              <tr>

                <th style={{ width: "60px" }}>
                  No
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("visite_dt")}
                >
                  Tanggal/Jam Visite
                  {sortBy === "visite_dt" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  className="text-center"
                  style={{ cursor: "pointer", width: "120px" }}
                  onClick={() => handleSort("spm_status")}
                >
                  Status SPM
                  {sortBy === "spm_status" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  className="text-center"
                  style={{ cursor: "pointer", width: "120px" }}
                  onClick={() => handleSort("inm_status")}
                >
                  Status INM
                  {sortBy === "inm_status" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("employee_nm")}
                >
                  Dokter
                  {sortBy === "employee_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("medical_service_name")}
                >
                  Pelayanan
                  {sortBy === "medical_service_name" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("srvc_unit_nm")}
                >
                  Poli
                  {sortBy === "srvc_unit_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("mr_code")}
                >
                  NRM
                  {sortBy === "mr_code" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("patient_nm")}
                >
                  Nama Pasien
                  {sortBy === "patient_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

              </tr>
            </thead>

              <tbody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={item.visite_id}>
                      <td>
                        {(currentPage - 1) * limit + index + 1}
                      </td>

                      <td>
                        {formatSortDateTime(item.visite_dt)}
                      </td>
                      <td className="text-center">
                        {(() => {
                          const dt = new Date(item.visite_dt);

                          const totalMenit =
                            dt.getHours() * 60 + dt.getMinutes();

                          const isSPM =
                            totalMenit >= 360 &&
                            totalMenit <= 840;

                          return (
                            <span
                              className={`badge ${
                                isSPM
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {isSPM ? "Sudah Standar" : "Belum Standar"}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="text-center">
                        {(() => {
                          const dt = new Date(item.visite_dt);

                          const totalMenit =
                            dt.getHours() * 60 + dt.getMinutes();

                          const isINM =
                            totalMenit >= 480 &&
                            totalMenit <= 840;

                          return (
                            <span
                              className={`badge ${
                                isINM
                                  ? "bg-primary"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {isINM ? "Sudah Standar" : "Belum Standar"}
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        {item.employee_nm}
                      </td>

                      <td>
                        {item.medical_service_name}
                      </td>

                      <td>
                        {item.srvc_unit_nm}
                      </td>
                      <td>
                        {item.mr_code}
                      </td>
                      <td>
                        {item.patient_nm}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="d-flex justify-content-between align-items-center mt-2 px-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              « Prev
            </button>

            <div>{renderPageNumbers()}</div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
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
