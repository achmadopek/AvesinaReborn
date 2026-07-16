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
    filter: { startDate: "2025-01-01", endDate: "" },
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

  // Ambil ringkasan hutang - TANPA KIRIM PARAMETER start
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const today = new Date().toISOString().slice(0, 10);

        // BACKEND akan menggunakan default 2025-01-01
        const res = await getSummaryUtangPiutang({
          end: today, // Kirim end saja
          status: "",
          units: [1, 2, 3, 4, 5],
        });

        setSummary(
          res || {
            detail: [],
            total: { diajukan: 0, dibayar: 0, saldo: 0 },
            filter: { startDate: "2025-01-01", endDate: today },
          },
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
    const filter = summary.filter || { startDate: "2025-01-01" };

    // Ambil data AVESINA
    const avesinaData = detail.filter((d) => d.sumber === "AVESINA");
    const langsungData = detail.filter(
      (d) => d.sumber === "PEMBELIAN LANGSUNG",
    );

    // Hitung total pembelian langsung
    const totalLangsung = langsungData.reduce((sum, d) => sum + d.diajukan, 0);

    // Format periode
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    return (
      <div className="row">
        {/* === SUMMARY CARDS === */}
        <div className="col-12 mb-3">
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <div className="card bg-primary text-white">
                <div className="card-body py-2">
                  <small>Total Tagihan</small>
                  <h6 className="mb-0">{formatCurrency(total.diajukan)}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card bg-success text-white">
                <div className="card-body py-2">
                  <small>Total Dibayar</small>
                  <h6 className="mb-0">{formatCurrency(total.dibayar)}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card bg-danger text-white">
                <div className="card-body py-2">
                  <small>Sisa Hutang</small>
                  <h6 className="mb-0">{formatCurrency(total.saldo)}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card bg-warning text-dark">
                <div className="card-body py-2">
                  <small>Pembelian Langsung</small>
                  <h6 className="mb-0">{formatCurrency(totalLangsung)}</h6>
                </div>
              </div>
            </div>
          </div>
          <small className="text-muted d-block mt-1">
            Periode: {formatDate(filter.startDate)} -{" "}
            {formatDate(filter.endDate)}
          </small>
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

                    {/* Separator */}
                    {langsungData.length > 0 && (
                      <tr className="table-secondary">
                        <td colSpan="4" className="text-center fw-bold py-1">
                          ─── PEMBELIAN LANGSUNG ───
                        </td>
                      </tr>
                    )}

                    {/* Pembelian Langsung */}
                    {langsungData.map((row, idx) => (
                      <tr key={`langsung-${idx}`}>
                        <td>
                          <span className="badge bg-success me-1">
                            LANGSUNG
                          </span>
                          {row.kategori}
                          {row.saldo === 0 && (
                            <span className="badge bg-secondary ms-2">
                              Rp 0
                            </span>
                          )}
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

      {/* === DAFTAR TAGIHAN === */}
      <div className="card shadow-sm card-theme mt-3">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Daftar Tagihan Mobay</h6>
        </div>
        <div className="card-body px-3 py-2">
          <div className="table-responsive">
            <table className="table table-theme table-lg table-bordered table-besar">
              <thead>
                <tr>
                  <th style={{ paddingLeft: "10px" }}>No</th>
                  <th>Pengajuan</th>
                  <th>Invoice</th>
                  <th>Provider</th>
                  {!isMobile && <th>Status</th>}
                  {!isMobile && <th>Total Diajukan</th>}
                  <th>Tanggal PO</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={item.pengajuan_id || item.po_acce_id || index}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td>{item.pengajuan_id || "-"}</td>
                      <td>{item.invoice_no || "-"}</td>
                      <td>{item.prvdr_str || "-"}</td>
                      {!isMobile && <td>{item.status_pengolahan || "-"}</td>}
                      {!isMobile && (
                        <td>
                          {Number(item.total_diajukan || 0).toLocaleString(
                            "id-ID",
                          )}
                        </td>
                      )}
                      <td>
                        {item.tgl_po
                          ? new Date(item.tgl_po).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="pagination-controls mt-2 px-3 py-2 d-flex justify-content-between align-items-center">
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
    </div>
  );
};

export default MonitoringMobay;
