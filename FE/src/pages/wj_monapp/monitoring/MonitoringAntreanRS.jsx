import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPaginatedDataMonitoringAntrian, fetchMonitoringAntrianSummary } from "../../../api/wj_monapp/MasterMonitoring";
import { fetchDaftarPoli } from "../../../api/wj_monapp/MasterServisUnit";
import { formatSortDate, formatSortDateTime } from "../../../utils/FormatDate";
import {
  BarChart,
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

const MonitoringAntreanRS = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const kodePoli = searchParams.get("kode");

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [poli, setPoli] = useState("");
  const [poliList, setPoliList] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [summary, setSummary] = useState(null);

  const openDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await fetchPaginatedDataMonitoringAntrian({
        page: currentPage,
        limit,
        poli: kodePoli || poli || "ALL",
        startDate,
        endDate,
        search,
      });

      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Gagal ambil data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, startDate, endDate, poli, search]);

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

  //Helper cari task id trakhir
  const getLastTaskId = (item) => {
    for (let i = 7; i >= 1; i--) {
      if (item[`taskid_${i}`] === 1) {
        return i;
      }
    }
    return 0;
  };

  // helper status user_mcu
  const getPelayananStatus = (item) => {
    const lastTask = getLastTaskId(item);

    if (lastTask >= 7) {
      return {
        label: "Selesai Semua Layanan",
        taskID: getLastTaskId(item),
        className: "bg-success",
      };
    }

    if (lastTask >= 5) {
      return {
        label: "Selesai Dilayani Dokter",
        taskID: getLastTaskId(item),
        className: "bg-info",
      };
    }

    if (lastTask >= 4) {
      return {
        label: "Sedang Dilayani",
        taskID: getLastTaskId(item),
        className: "bg-primary",
      };
    }

    return {
      label: "Belum Dilayani",
      taskID: getLastTaskId(item),
      className: "bg-warning text-dark",
    };
  };

  // grafik antrian
  const fetchSummary = async () => {
    try {
      const res = await fetchMonitoringAntrianSummary({
        poli: kodePoli || poli || "ALL",
        startDate,
        endDate
      });

      setSummary(res);
    } catch (err) {
      console.error("Gagal fetch summary:", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate, poli, kodePoli]);

  const barData = [
    { name: "Dilayani", value: Number(summary?.totalDilayani || 0) },
    {
      name: "Belum Dilayani",
      value:
        Number(summary?.totalPatient || 0) -
        Number(summary?.totalDilayani || 0) -
        Number(summary?.totalDibatalkan || 0),
    },
    { name: "Dibatalkan", value: Number(summary?.totalDibatalkan || 0) },
  ];

  const pieData = [
    { name: "Check-In", value: Number(summary?.checkinYes || 0) },
    { name: "Belum", value: Number(summary?.checkinNo || 0) },
  ];

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

            <div className="col-md-3 col-6 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-sm btn-secondary w-100"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPoli("");
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
                placeholder="Cari Nama Pasien, NRM, Nomor Kartu BPJS, NIK, Kode Booking..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRAFIK ANTRIAN */}
      <div className="card-theme ms-2 me-2 mb-3 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring Antrian Klinik</h6>
        </div>

        <div className="card-body px-0 py-0">
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

            {/* BAR */}
            <div style={{ width: "calc(50% - 10px)", minWidth: "320px", textAlign: "center", border: "1px solid #ddd", marginTop: "10px", borderRadius: "8px", padding: "10px" }}>
              <h4>Status Pelayanan</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PIE */}
            <div style={{ width: "calc(50% - 10px)", minWidth: "320px", textAlign: "center", border: "1px solid #ddd", marginTop: "10px", borderRadius: "8px", padding: "10px" }}>
              <h4>Komposisi Check-In</h4>
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
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>

      {/* TABEL */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">
            Daftar Antrian Pasien{" "}
            {kodePoli ? `(POLI ${kodePoli})` : "(Semua Poli)"}
          </h6>
        </div>

        <div className="card-body px-0 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tgl Booking/Daftar</th>
                  <th>Tgl Periksa <br /> Kode Booking</th>
                  <th>NRM <br /> Nama Pasien</th>
                  <th>No. BPJS <br /> NIK (No. KTP)</th>

                  {!isMobile && (
                    <>
                      <th>Poli < br /> Debitur</th>
                      <th>Status Check-In</th>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <th key={n} className="text-center">
                          Task {n}
                        </th>
                      ))}
                    </>
                  )}

                  <th className="text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={item.registry_id ?? index}>
                      <td className="text-center">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td>
                        {formatSortDateTime(item.registry_dt)}
                      </td>
                      <td>
                        {formatSortDate(item.tanggal_periksa)}
                        <br />
                        {item.kode_booking}
                      </td>
                      <td>
                        {item.mr_code}
                        <br />
                        {item.patient_nm === 'BOOKING'
                          ? item.patient_nm_rill
                            ? `(${item.patient_nm_rill})`
                            : ''
                          : item.patient_nm
                        }
                      </td>
                      <td>
                        {item.nomor_kartu}
                        <br />
                        {item.nik}
                      </td>

                      {!isMobile && (
                        <>
                          <td>
                            {item.srvc_unit_nm}
                            <br />
                            {item.price_group_code || "-"}
                          </td>

                          <td className="text-center">
                            <span
                              className={`badge ${item.check_in === "1"
                                ? "bg-success"
                                : "bg-warning text-dark"
                                }`}
                            >
                              {item.check_in === "1" ? "Check-In" : "Belum"}
                            </span>
                          </td>

                          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                            const value = item[`taskid_${n}`];
                            return (
                              <td key={n} className="text-center">
                                <span
                                  className={`badge ${value === 1 ? "bg-info" : "bg-danger"
                                    }`}
                                >
                                  {value}
                                </span>
                              </td>
                            );
                          })}
                        </>
                      )}

                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => openDetail(item)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isMobile ? 6 : 15}
                      className="text-center py-3"
                    >
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

      {/* MODAL DETAIL */}
      {showDetail && selectedItem && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detail Antrian Pasien</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDetail}
                  />
                </div>

                <div className="modal-body">
                  <table className="table table-sm table-borderless">
                    <tbody>
                      {[
                        ["Kode Booking", <strong>{selectedItem.kode_booking}</strong>],
                        ["Nama Pasien", selectedItem.patient_nm],
                        ["NIK", selectedItem.nik],
                        ["No Kartu", selectedItem.nomor_kartu],
                        ["No HP", selectedItem.handphone],
                        ["NRM", selectedItem.mr_code],
                        ["Penjamin", selectedItem.price_group_code || "-"],
                        ["Poli", selectedItem.srvc_unit_nm],
                        ["Tgl Periksa", formatSortDate(selectedItem.tanggal_periksa)],

                        [
                          "Status Check-In",
                          <span
                            className={`badge ${selectedItem.check_in === "1"
                              ? "bg-success"
                              : "bg-warning text-dark"
                              }`}
                          >
                            {selectedItem.check_in === "1"
                              ? "Sudah Check-In"
                              : "Belum Check-In"}
                          </span>,
                        ],

                        [
                          "Status Dibatalkan",
                          <span
                            className={`badge ${selectedItem.dibatalkan === "1"
                              ? "bg-danger"
                              : "bg-secondary"
                              }`}
                          >
                            {selectedItem.dibatalkan === "1"
                              ? "Sudah Dibatalkan"
                              : "Tidak Dibatalkan"}
                          </span>,
                        ],

                        [
                          "Status Task ID Terakhir",
                          (() => {
                            const status = getPelayananStatus(selectedItem);
                            return (
                              <>
                                <span className={`badge ${status.className} me-2`}>
                                  {status.label}
                                </span>

                                <span className={`badge ${status.className}`}>
                                  Task ID {status.taskID}
                                </span>
                              </>
                            );
                          })(),
                        ],
                      ].map(([label, value], i) => (
                        <tr key={i}>
                          <td width="35%">{label}</td>
                          <td>: {value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={closeDetail}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
};

export default MonitoringAntreanRS;
