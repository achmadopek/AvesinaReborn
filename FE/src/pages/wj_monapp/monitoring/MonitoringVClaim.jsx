import { useEffect, useState } from "react";
import { fetchPaginatedMonitoringData } from "../../../api/wj_mobay/MonitoringTagihan";

const MonitoringVClaim = ({ isMobile, limit = 10 }) => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  return (
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
  );
};

export default MonitoringVClaim;
