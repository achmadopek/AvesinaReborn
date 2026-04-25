import { useEffect, useState } from "react";
import {
  fetchPaginatedDataMonitoringTHP,
  exportMonitoringTHP,
} from "../../../api/wj_monapp/MasterMonitoring";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatNumber } from "../../../utils/FormatNumber";
import { useAuth } from "../../../context/AuthContext";
import SearchSelectPegawai from "../../../components/search/SearchSelectPegawai";


const MonitoringTHP = ({ limit = 10, isMobile }) => {
  const { user } = useAuth();

  // =======================
  // STATE UTAMA
  // =======================
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_penghasilan: 0,
    total_potongan: 0,
    total_thp: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // =======================
  // FILTER
  // =======================
  const [startDate, setStartDate] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  const [employeeSts, setEmployeeSts] = useState("");
  const [selectedPegawai, setSelectedPegawai] = useState(null);

  // =======================
  // LOAD DATA
  // =======================
  const loadData = async () => {
    try {
      const res = await fetchPaginatedDataMonitoringTHP({
        page: currentPage,
        limit,
        startDate,
        endDate,
        employee_sts: employeeSts,
        peg_id:
          user?.role === "pegawai"
            ? user?.id
            : selectedPegawai?.value || "",
      });

      setData(res.data || []);
      setSummary(res.summary || {});
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Gagal load Monitoring THP:", err);
      setData([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    limit,
    startDate,
    endDate,
    employeeSts,
    selectedPegawai,
  ]);

  // =======================
  // RENDER PAGINATION
  // =======================
  const renderPageNumbers = () => {
    const delta = 1;
    const pages = [];
    let prev;

    const range = (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const addPages = (arr) => {
      arr.forEach((p) => {
        if (prev && p - prev > 1) pages.push("...");
        pages.push(p);
        prev = p;
      });
    };

    addPages(range(1, Math.min(2, totalPages)));
    addPages(
      range(
        Math.max(currentPage - delta, 3),
        Math.min(currentPage + delta, totalPages - 2)
      )
    );
    addPages(range(Math.max(totalPages - 1, 3), totalPages));

    return pages.map((p, i) =>
      p === "..." ? (
        <span key={i} className="mx-1">
          ...
        </span>
      ) : (
        <button
          key={i}
          onClick={() => setCurrentPage(p)}
          className={`btn btn-sm mx-1 ${currentPage === p
            ? "btn-outline-primary"
            : "btn-outline-secondary"
            }`}
        >
          {p}
        </button>
      )
    );
  };

  const rupiah = (v) =>
    `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

  // =======================
  // UI
  // =======================
  return (
    <>
      {/* FILTER */}
      <div className="row p-2">
        <div className="col-md-2">
          <label className="form-label">Periode Dari</label>
          <input
            type="month"
            className="form-control form-control-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Periode Hingga</label>
          <input
            type="month"
            className="form-control form-control-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Status Pegawai</label>
          <select
            className="form-control form-control-sm form-control form-control-sm-sm"
            value={employeeSts}
            onChange={(e) => {
              setEmployeeSts(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Status</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="HONORER">HONORER</option>
            <option value="BLUD">BLUD</option>
            <option value="MOU">MOU</option>
          </select>
        </div>

        {/* CARI PEGAWAI */}
        <div className="col-md-4">
          <SearchSelectPegawai
            value={selectedPegawai}
            onChange={(val) => {
              setSelectedPegawai(val);
              setCurrentPage(1);
            }}
            placeholder="Cari pegawai..."
            isClearable
            disabled={user?.role === "pegawai"}
            styles={{
              padding: "0px",
              marginTop: "32px",
            }}
            className="mt-3"
          />
        </div>

        <div className="col-md-2 d-flex align-items-end gap-2">
          <button
            className="btn btn-secondary btn-sm flex-fill"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setEmployeeSts("");
              setEmployeeNm("");
              setCurrentPage(1);
            }}
          >
            Reset
          </button>

          <button
            className="btn btn-success btn-sm flex-fill"
            onClick={async () => {
              try {
                const res = await exportMonitoringTHP({
                  startDate,
                  endDate,
                  peg_id: user?.role === "pegawai" ? user?.id : "",
                  employee_sts: employeeSts,
                  pegawai_name: pegawaiName,
                });

                const url = window.URL.createObjectURL(
                  new Blob([res.data])
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = `monitoring-thp-${startDate || "all"}-${endDate || "all"
                  }.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {
                alert("Gagal export THP");
              }
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* =======================
          SUMMARY GRFIK
      ======================= */}
      {/* GRAFIK */}
      {data.length > 0 && (
        <div className="card-theme ms-2 me-2 mt-3 p-2 mb-3">
          <div className="card-header py-2 px-3">
            <h6 className="mb-0">Grafik Take Home Pay per Periode</h6>
          </div>

          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...data].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periode" />
                <YAxis
                  tickFormatter={(v) => `${v / 1_000_000} jt`}
                />
                <Tooltip formatter={(v) => rupiah(v)} />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="total_penghasilan"
                  name="Penghasilan"
                  stroke="#198754"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="total_potongan"
                  name="Potongan"
                  stroke="#dc3545"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="thp"
                  name="THP"
                  stroke="#0d6efd"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =======================
          TABLE
      ======================= */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2">
          <h6 className="mb-0">Monitoring Take Home Pay</h6>
        </div>

        <div className="card-body px-0">
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Periode</th>
                  <th>Penghasilan</th>
                  <th>Potongan</th>
                  <th>THP</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={i}>
                      <td>{(currentPage - 1) * limit + i + 1}</td>
                      <td>{row.periode}</td>
                      <td className="text-end">
                        Rp. {formatNumber(row.total_penghasilan)}
                      </td>
                      <td className="text-end">
                        Rp. {formatNumber(row.total_potongan)}
                      </td>
                      <td className="fw-bold text-end">
                        Rp. {formatNumber(row.thp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" align="center">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =======================
              PAGINATION
          ======================= */}
          <div className="d-flex justify-content-between align-items-center mt-2 px-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
            >
              « Prev
            </button>

            <div>{renderPageNumbers()}</div>

            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(totalPages, p + 1)
                )
              }
            >
              Next »
            </button>
          </div>
        </div>
      </div>

      {/* =======================
          CHART
      ======================= */}
      {/*<THPCharts />*/}
    </>
  );
};

export default MonitoringTHP;
