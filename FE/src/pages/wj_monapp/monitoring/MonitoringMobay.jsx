import { useEffect, useState } from "react";
import { fetchPaginatedMonitoringData } from "../../../api/wj_mobay/MonitoringTagihan";
import { getSummaryUtangPiutang } from "../../../api/wj_mobay/DashboardMobay";
import { formatCurrency } from "../../../utils/FormatNumber";

const MonitoringMobay = ({ isMobile, limit = 10 }) => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State untuk ringkasan hutang
  const [summary, setSummary] = useState({
    detail: [],
    total: { diajukan: 0, dibayar: 0, saldo: 0 },
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Ambil data dari backend setiap kali page berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetchPaginatedMonitoringData({
          page: currentPage,
          limit,
          start: today,
          end: today,
          typeTglFilter: "tgl_po",
        });

        setData(res.data || []);
        setTotalPages(
          res.totalGroup && limit > 0
            ? Math.max(1, Math.ceil(res.totalGroup / limit))
            : 1,
        );
      } catch (err) {
        console.error("Gagal ambil data Mobay:", err);
        setData([]);
      }
    };

    fetchData();
  }, [currentPage, limit]);

  // Ambil ringkasan hutang
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const today = new Date().toISOString().slice(0, 10);
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1); // 1 bulan terakhir
        const startDate = start.toISOString().slice(0, 10);

        const res = await getSummaryUtangPiutang({
          start: startDate,
          end: today,
          status: "",
          units: [1, 2, 3, 4, 5],
        });

        setSummary(
          res || { detail: [], total: { diajukan: 0, dibayar: 0, saldo: 0 } },
        );
      } catch (err) {
        console.error("Gagal ambil ringkasan hutang:", err);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
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

  // ==========================
  // RENDER RINGKASAN HUTANG
  // ==========================
  const renderSummary = () => {
    if (loadingSummary) {
      return (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    const total = summary.total || { diajukan: 0, dibayar: 0, saldo: 0 };
    const detail = summary.detail || [];

    // Ambil data AVESINA
    const avesinaData = detail.filter((d) => d.sumber === "AVESINA");
    const langsungData = detail.filter(
      (d) => d.sumber === "PEMBELIAN LANGSUNG",
    );

    return (
      <div className="row">
        {/* === SUMMARY CARDS === */}
        <div className="col-12 mb-3">
          <div className="row g-2">
            <div className="col-md-4 col-6">
              <div className="card bg-primary text-white">
                <div className="card-body py-2">
                  <small>Total Tagihan</small>
                  <h6 className="mb-0">{formatCurrency(total.diajukan)}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-6">
              <div className="card bg-success text-white">
                <div className="card-body py-2">
                  <small>Total Dibayar</small>
                  <h6 className="mb-0">{formatCurrency(total.dibayar)}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-6">
              <div className="card bg-danger text-white">
                <div className="card-body py-2">
                  <small>Total Hutang</small>
                  <h6 className="mb-0">{formatCurrency(total.saldo)}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === DETAIL TABEL RINGKASAN === */}
        <div className="col-12 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h6 className="mb-0">Ringkasan Hutang per Kategori</h6>
              <small>Tagihan AVESINA - Pembayaran MOBAY</small>
            </div>
            <div className="card-body p-2">
              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "180px" }}>Kategori</th>
                      <th className="text-end">Tagihan</th>
                      <th className="text-end">Dibayar</th>
                      <th className="text-end">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* AVESINA Data */}
                    {avesinaData.length > 0 ? (
                      avesinaData.map((row, idx) => (
                        <tr key={`avesina-${idx}`}>
                          <td>
                            <span className="badge bg-info me-1">AVESINA</span>
                            {row.kategori}
                          </td>
                          <td className="text-end">
                            {formatCurrency(row.diajukan)}
                          </td>
                          <td className="text-end">
                            {formatCurrency(row.dibayar)}
                          </td>
                          <td
                            className={`text-end fw-bold ${row.saldo > 0 ? "text-danger" : "text-success"}`}
                          >
                            {formatCurrency(row.saldo)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          Tidak ada data AVESINA
                        </td>
                      </tr>
                    )}

                    {/* Separator 
                    {langsungData.length > 0 && (
                      <tr className="table-secondary">
                        <td colSpan="4" className="text-center fw-bold py-1">
                          ─── PEMBELIAN LANGSUNG ───
                        </td>
                      </tr>
                    )}*/}

                    {/* Pembelian Langsung */}
                    {langsungData.map((row, idx) => (
                      <tr key={`langsung-${idx}`}>
                        <td>
                          <span className="badge bg-success me-1">
                            LANGSUNG
                          </span>
                          {row.kategori}
                        </td>
                        <td className="text-end">
                          {formatCurrency(row.diajukan)}
                        </td>
                        <td className="text-end text-muted">
                          {formatCurrency(row.dibayar)}
                        </td>
                        <td
                          className={`text-end fw-bold ${row.saldo > 0 ? "text-danger" : "text-muted"}`}
                        >
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-primary fw-bold">
                      <td>TOTAL</td>
                      <td className="text-end">
                        {formatCurrency(total.diajukan)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(total.dibayar)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(total.saldo)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================
  // RENDER UTAMA
  // ==========================
  return (
    <div className="container-fluid">
      {/* === RINGKASAN HUTANG === */}
      {renderSummary()}
    </div>
  );
};

export default MonitoringMobay;
