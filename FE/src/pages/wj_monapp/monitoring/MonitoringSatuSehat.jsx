import { useEffect, useState } from "react";
import {
  fetchPaginatedDataMonitoringSatuSehat,
  kirimSpecimenSatuSehat,
} from "../../../api/wj_monapp/MasterMonitoring";
import { formatSortDateTime } from "../../../utils/FormatDate";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";

const MonitoringSatuSehat = ({ isMobile, limit = 10 }) => {
  // State for data and pagination
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Date handling (set to local time zone)
  const localToday = new Date();
  localToday.setHours(0, 0, 0, 0); // Set time to 00:00:00 for startDate

  const localTomorrow = new Date(localToday);
  localTomorrow.setHours(23, 59, 59, 999); // Set time to 23:59:59 for endDate

  const [startDate, setStartDate] = useState(
    localToday.toLocaleDateString("en-CA")
  );
  const [endDate, setEndDate] = useState(
    localTomorrow.toLocaleDateString("en-CA")
  );

  // WebSocket URL from environment variables
  const WS_URL = import.meta.env.VITE_WS_URL;

  // State for current day, to trigger reload when day changes
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toLocaleDateString("en-CA");
  });

  // Role-based access
  const { role } = useAuth();

  // =======================
  // LOAD DATA UTAMA
  // =======================
  const loadData = async () => {
    if (!startDate || !endDate) {
      setData([]);
      setTotalPages(1);
      return;
    }

    try {
      const res = await fetchPaginatedDataMonitoringSatuSehat({
        page: currentPage,
        limit,
        startDate,
        endDate,
      });

      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Error fetch monitoring:", err);
      setData([]);
      setTotalPages(1);
    }
  };

  // Ambil data saat filter berubah
  useEffect(() => {
    loadData();
  }, [currentPage, limit, startDate, endDate]);

  // =======================
  // WEBSOCKET LISTENER
  // =======================
  useEffect(() => {
    let ws;

    const connectWS = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => console.log("WS Connected: Monitoring SatuSehat");

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === "satusehat-updated") {
            console.log("WS update → reload data");
            loadData();
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WS closed — reconnecting in 5s...");
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();
    return () => ws && ws.close();
  }, []);

  // =======================
  // RENDER PAGE NUMBER
  // =======================
  const renderPageNumbers = () => {
    const delta = 1;
    const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

    const pages = [];
    let prev;
    const addWithDots = (list) => {
      list.forEach((p) => {
        if (prev && p - prev > 1) pages.push("...");
        pages.push(p);
        prev = p;
      });
    };

    addWithDots(range(1, Math.min(2, totalPages)));
    addWithDots(
      range(
        Math.max(currentPage - delta, 3),
        Math.min(currentPage + delta, totalPages - 2)
      )
    );
    addWithDots(range(Math.max(totalPages - 1, 3), totalPages));

    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`dots-${idx}`}>...</span>
      ) : (
        <button
          key={`page-${p}-${idx}`}
          onClick={() => setCurrentPage(p)}
          className={`btn btn-sm mx-1 ${currentPage === p ? "btn-outline-primary" : "btn-outline-secondary"
            }`}
        >
          {p}
        </button>
      )
    );
  };

  const handleKirim = async (item) => {
    try {
      const data = await kirimSpecimenSatuSehat(item.lab_srvc_id);

      toast.success(`Berhasil dikirim: ${data.message}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim data");
    }
  };

  const handleReset = (item) => {
    // contoh: buka modal
    setSelectedItem(item);
    setShowEditModal(true);

    setStartDate(localToday.toLocaleDateString("en-CA"));
    setEndDate(localTomorrow.toLocaleDateString("en-CA"));
  };

  const handleSet = (item) => {
    setSelectedItem(item);
    setShowSetModal(true);
  };

  // =======================
  // RENDER UI
  // =======================
  return (
    <>
      {/* FILTER */}
      <div className="row mb-2 p-2">
        <div className="col-md-4 mb-0">
          <label className="form-label">Tanggal Dari</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-0">
          <label className="form-label">Tanggal Hingga</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-0">
          {/* Action Buttons */}
          <label className="form-label">Tanggal Hingga</label>
          <div className="d-flex gap-2" style={{ marginRight: "10px" }}>
            <button
              className={`btn ${role === "admin" ? "btn-sm" : "btn-lg"
                } btn-secondary flex-fill`}
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* TABEL */}
      <div className="card-theme ms-2 me-2 mb-2 p-2">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring Bridging SatuSehat Laboratorium </h6>
        </div>

        <div className="card-body px-0 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm">
              <thead>
                <tr>
                  <th rowSpan={1}>No</th>

                  {/* IDENTITY */}
                  <th colSpan={1}>IDENTITY</th>

                  {/* REGISTRY */}
                  <th colSpan={1}>REGISTRY</th>

                  {/* LAB REQUEST */}
                  <th colSpan={1}>LAB REQUEST</th>

                  {/* SPECIMEN */}
                  <th colSpan={1}>SPECIMEN</th>

                  {/* OBSERVATION */}
                  <th colSpan={1}>OBSERVATION</th>

                  <th rowSpan={1}>STATUS</th>
                  <th rowSpan={1}>ACTION</th>
                </tr>

              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, i) => (
                    <tr key={i}>
                      <>
                        <td>{(currentPage - 1) * limit + (i + 1)}</td>

                        {/* IDENTITY */}
                        <td>
                          {item.mr_code} <br />
                          {item.patient_nm}
                        </td>

                        {/* REGISTRY */}
                        <td>
                          {item.registry_id || "-"} <br />
                          {formatSortDateTime(item.registry_dt)}
                        </td>

                        {/* LAB REQUEST */}
                        <td>
                          {item.request_service_uuid || "-"} <br />
                          {item.performer_ihs_number || "-"}
                        </td>

                        {/* SPECIMEN */}
                        <td>
                          {item.speciment_uuid || "-"} <br />
                          {formatSortDateTime(item.sample_dt)}
                        </td>

                        {/* OBSERVATION */}
                        <td>
                          {formatSortDateTime(item.measured_dt)} <br />
                          {formatSortDateTime(item.result_dt)}
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`badge ${item.status_kirim === "success"
                              ? "bg-success"
                              : item.status_kirim === "partial"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                              }`}
                          >
                            {item.status_kirim === "success"
                              ? "Selesai"
                              : item.status_kirim === "partial"
                                ? "Sebagian"
                                : "Belum"}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="text-center">
                          <button
                            onClick={() => handleSet(item)}
                            className="btn btn-warning btn-sm ms-1"
                            style={{ fontSize: "10px" }}
                          >
                            Set
                          </button>

                          <button
                            onClick={() => handleReset(item)}
                            className="btn btn-secondary btn-sm ms-1"
                            style={{ fontSize: "10px" }}
                          >
                            Reset
                          </button>

                          <button
                            onClick={() => handleKirim(item)}
                            className="btn btn-primary btn-sm ms-1"
                            style={{ fontSize: "10px" }}
                            disabled={!item.snomed_code} // penting
                          >
                            Kirim
                          </button>
                        </td>
                      </>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="20" align="center">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-outline-secondary btn-sm"
            >
              « Prev
            </button>
            <div>{renderPageNumbers()}</div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-outline-secondary btn-sm"
            >
              Next »
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringSatuSehat;
