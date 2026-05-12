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
  Line
} from "recharts";


import {
  fetchMonitoringVisite
} from "../../../api/wj_monapp/MasterMonitoring";



const MonitoringVisite = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [dokter, setDokter] = useState("");
  const [dokterList, setDokterList] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState(null);

  const [rekapDokter, setRekapDokter] = useState([]);

  const visiteHarianMap = {};

  data.forEach((item) => {
    const tgl = item.visite_dt?.split(" ")[0];

    if (!visiteHarianMap[tgl]) {
      visiteHarianMap[tgl] = 0;
    }

    visiteHarianMap[tgl]++;
  });

  const dokterChartData = rekapDokter
    .slice(0, 10)
    .map((d) => ({
      dokter: d.employee_nm,
      total: Number(d.total_visite)
    }));

  const lineData = Object.entries(visiteHarianMap).map(
    ([tanggal, total]) => ({
      tanggal,
      total
    })
  );

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await fetchMonitoringVisite({
        page: currentPage,
        limit,
        dokter: dokter || "ALL",
        startDate,
        endDate,
        search,
      });

      console.log(res);

      setData(res.data || []);
      setRekapDokter(res.recapDokter || []);
      setTotalPages(res.totalPages || 1);
      setSummary(res.summary || {});
    } catch (err) {
      console.error("Gagal ambil data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, startDate, endDate, dokter, search]);

  useEffect(() => {
    const fetchDokter = async () => {
      try {
        const res = await fetchMonitoringVisite({
          page: 1,
          limit: 1,
          startDate,
          endDate,
        });

        setDokterList(res.dokterList || []);

      } catch (err) {
        console.error(err);
      }
    };

    fetchDokter();
  }, []);

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
      {/* FILTER */}
      <div className="row mb-2 p-2">
        <div className="col-12">
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <label className="form-label">Tanggal Dari</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="col-md-3 col-6">
              <label className="form-label">Tanggal Hingga</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-md-3 col-6">
              <label className="form-label">Dokter</label>
              <select
                className="form-control form-control-sm"
                value={dokter}
                onChange={(e) => setDokter(e.target.value)}
              >
                <option value="">Semua Dokter</option>

                {dokterList.map((d) => (
                  <option
                    key={d.employee_id}
                    value={d.employee_id}
                  >
                    {d.employee_nm}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 col-6 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-sm btn-secondary w-100"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDokter("");
                  setSearch("");
                  setCurrentPage(1);
                }}
              >
                Reset Filter
              </button>
            </div>

            <div className="col-12">
              <input
                type="text"
                className="form-control form-control-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari dokter, pelayanan, poli..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRAFIK ANTRIAN */}
      {/* SUMMARY */}
      <div className="row g-3 mb-3 ms-1 me-1">

        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <small className="text-muted">Total Visite</small>
              <h2 className="fw-bold text-primary mb-0">
                {summary?.totalVisite || 0}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <small className="text-muted">
                Visite Jam Standar
              </small>

              <h2 className="fw-bold text-success mb-0">
                {summary?.visiteStandar || 0}
              </h2>

              <small className="text-muted">
                06:00 - 23:59
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <small className="text-muted">
                Diluar Jam Standar
              </small>

              <h2 className="fw-bold text-danger mb-0">
                {summary?.visiteTidakStandar || 0}
              </h2>

              <small className="text-muted">
                00:00 - 05:59
              </small>
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

            {/* TOP DOKTER */}
            <div className="col-lg-6">

              <div className="card shadow-sm h-100">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    Top 10 Dokter Visite
                  </h6>

                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={dokterChartData}
                      layout="vertical"
                      margin={{ left: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis type="number" />

                      <YAxis
                        dataKey="dokter"
                        type="category"
                        width={140}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="total"
                        fill="#0d6efd"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                </div>
              </div>

            </div>

            {/* TREN */}
            <div className="col-lg-6">

              <div className="card shadow-sm h-100">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    Tren Visite Harian
                  </h6>

                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={lineData}>

                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="tanggal" />

                      <YAxis />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#198754"
                        strokeWidth={3}
                      />

                    </LineChart>
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
                  <th>No</th>
                  <th>Tanggal/Jam Visite</th>
                  <th>Status Jam</th>
                  <th>Dokter</th>
                  <th>Pelayanan</th>
                  <th>Poli</th>
                  <th>NRM</th>
                  <th>Nama Pasien</th>
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
                          const jam = new Date(item.visite_dt).getHours();

                          const isStandar = jam >= 6;

                          return (
                            <span
                              className={`badge ${
                                isStandar
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {isStandar
                                ? "Standar"
                                : "Belum Standar"}
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
