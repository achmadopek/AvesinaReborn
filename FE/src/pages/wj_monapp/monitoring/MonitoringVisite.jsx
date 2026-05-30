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
  fetchMonitoringVisiteSummary,
  fetchMonitoringVisiteActivity
} from "../../../api/wj_monapp/MasterMonitoring";

import SearchSelectDokter from "../../../components/search/SearchSelectDokter";

const MonitoringVisite = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState([]);

  const [summary, setSummary] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [dokter, setDokter] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [sortBy, setSortBy] = useState("visite_dt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const [pieAktivitas, setPieAktivitas] = useState([]);
  const [chartHarian, setChartHarian] = useState([]);

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

  const fetchSummary = async () => {
    try {

      const res =
        await fetchMonitoringVisiteSummary({

          dokter:
            dokter?.value || "",

          startDate,
          endDate
        });

      setSummary(
        res.summary || {}
      );

      setPieAktivitas(
        res.pieAktivitas || []
      );

      setChartHarian(
        res.chartHarian || []
      );
    } catch (err) {
      console.log(err);
    }
  };

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res =
        await fetchMonitoringVisiteActivity({
          page: currentPage,
          limit,

          dokter: dokter?.value || "",

          startDate,
          endDate,

          search,

          sortBy,
          sortOrder
        });
      setData(
        res.data || []
      );
      setTotalPages(
        res.totalPages || 1
      );
    } catch (err) {
      console.log(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchSummary();
    fetchActivity();

  }, [
    currentPage,
    startDate,
    endDate,
    dokter,
    search,
    sortBy,
    sortOrder
  ]);

  //console.log("dokterList:", dokterList);

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

          {/* DOKTER */}
          <div className="col-md-6 col-6">
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
                setSearch("");
                setDokter(null);
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
    {/* SUMMARY */}
    {/* ============================= */}
    <div className="row g-2 mb-2 mx-2 ">

      <div className="col-md-6">
        <div className="card-theme p-2 h-100">
          <div className="card-header py-2 px-3">
            <h6 className="mb-0">
              Aktifitas Visite Dokter
            </h6>
          </div>

          <div className="card-body">

            <div className="row">

              {/* VISITE DPJP */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Aktivitas DPJP
                    </small>

                    <h2 className="fw-bold text-success mb-0">
                      {summary?.dpjpVisite || 0}
                    </h2>

                  </div>
                </div>
              </div>

              {/* RUBBER */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Rubber Visite
                    </small>

                    <h2 className="fw-bold text-danger mb-0">
                      {summary?.rubberVisite || 0}
                    </h2>

                  </div>
                </div>
              </div>

              {/* TOTAL AKTIVITAS */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Total Aktivitas
                    </small>

                    <h2 className="fw-bold text-dark mb-0">
                      {summary?.totalAktivitas || 0}
                    </h2>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-theme p-2 h-100">
          <div className="card-header py-2 px-3">
            <h6 className="mb-0">
              Kuantitas Visite Dokter
            </h6>
          </div>

          <div className="card-body">

            <div className="row g-3 mb-3 mx-1">

              {/* VISITE DPJP */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Memiliki DPJP
                    </small>

                    <h2 className="fw-bold text-success mb-0">
                      {summary?.pasienDPJP || 0}
                    </h2>

                  </div>
                </div>
              </div>

              {/* RUBBER */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Belum Memiliki DPJP
                    </small>

                    <h2 className="fw-bold text-danger mb-0">
                      {summary?.pasienBelumDPJP || 0}
                    </h2>

                  </div>
                </div>
              </div>

              {/* TOTAL AKTIVITAS */}
              <div className="col-md-4 col-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <small className="text-muted d-block mb-1">
                      Total Pasien Rawat Inap
                    </small>

                    <h2 className="fw-bold text-dark mb-0">
                      {summary?.totalPasienRawatInap || 0}
                    </h2>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    
    
    {/* ============================= */}
    {/* ANALISA VISITE */}
    {/* ============================= */}
    <div className="row g-2 mb-2 mx-2 ">

      <div className="col-md-6">
        <div className="card-theme p-2 h-100">

          <div className="card-header py-2 px-3">
            <h6 className="mb-0">
              Analisa Visite Dokter
            </h6>
          </div>

          <div className="card-body">

            <div className="row g-3">

              <div className="col-md-4 col-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body">

                    <h6 className="fw-bold mb-3">
                      Komposisi Aktivitas
                    </h6>

                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>

                        <Pie
                          data={[
                            {
                              name: "DPJP",
                              value: summary?.dpjpVisite || 0
                            },
                            {
                              name: "Rubber",
                              value: summary?.rubberVisite || 0
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
              <div className="col-md-4 col-6">
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
                              name: "Standar",
                              value: Number(
                                summary.spmStandar || 0
                              )
                            },
                            {
                              name: "Tidak Standar",
                              value: Number(
                                summary.spmTidakStandar || 0
                              )
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

              {/* PIE KEPATUHAN VISITE */}
              <div className="col-md-4 col-6">
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
                            name: "Standar",
                            value: Number(
                              summary.inmStandar || 0
                            )
                          },
                          {
                            name: "Tidak Standar",
                            value: Number(
                              summary.inmTidakStandar || 0
                            )
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

            </div>

          </div>

        </div>
      </div>

      <div className="col-md-6">
        <div className="card-theme p-2 h-100">

          <div className="card-header py-2 px-3">
            <h6 className="mb-0">
              Grafik Harian Aktifitas Visite Dokter
            </h6>
          </div>

          <div className="card-body">

            <div className="row g-3">

              <div className="col-12">
                <div className="card shadow-sm h-100">
                  <div className="card-body">

                    <h6 className="fw-bold mb-3">
                      Trend Aktivitas Harian
                    </h6>

                    <ResponsiveContainer
                      width="100%"
                      height={350}
                    >
                      <LineChart
                        data={chartHarian}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="tanggal"
                        />

                        <YAxis />

                        <Tooltip />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="dpjp"
                          name="DPJP"
                          stroke="#198754"
                          strokeWidth={2}
                        />

                        <Line
                          type="monotone"
                          dataKey="rubber"
                          name="Rubber"
                          stroke="#dc3545"
                          strokeWidth={2}
                        />

                      </LineChart>
                    </ResponsiveContainer>

                  </div>
                </div>
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
            History Visite Dokter
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
                >
                  Status SPM
                  {sortBy === "spm_status" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  className="text-center"
                  style={{ cursor: "pointer", width: "120px" }}
                >
                  Status INM
                  {sortBy === "inm_status" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                >
                  Dokter Visite
                  {sortBy === "employee_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                >
                  Pelayanan
                  {sortBy === "medical_service_name" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                >
                  Poli
                  {sortBy === "srvc_unit_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                >
                  NRM
                  {sortBy === "mr_code" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  role="button"
                  style={{ cursor: "pointer" }}
                >
                  Nama Pasien
                  {sortBy === "patient_nm" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th>
                  DPJP Pasien
                </th>
                <th>
                  Jenis
                </th>
                <th>
                  Sumber
                </th>
              </tr>
            </thead>

              <tbody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={`${item.sumber}-${item.row_id}`}>
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
                            totalMenit >= 300 &&
                            totalMenit <= 840;

                          return (
                            <span
                              className={`badge ${
                                isSPM
                                  ? "bg-info text-dark"
                                  : "bg-secondary"
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
                      <td>
                        {item.dpjp_nm}
                      </td>

                      <td className="text-center">
                        {item.jenis === "DPJP" ? (
                          <span className="badge bg-success">
                            DPJP
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            Rubber
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            item.sumber === "VISITE"
                              ? "bg-primary"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {item.sumber}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
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
