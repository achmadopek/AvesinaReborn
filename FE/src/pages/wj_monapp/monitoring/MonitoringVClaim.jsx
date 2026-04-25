import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPaginatedData } from "../../../api/wj_monapp/MasterAnjungan"; // ganti sesuai API kamu

const MonitoringVClaim = ({ isMobile, limit = 10 }) => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const kodePoli = searchParams.get("kode");

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Ambil data dari backend setiap kali page/kode poli berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchPaginatedData({
          page: currentPage,
          limit,
          kode_poli: kodePoli, // filter poli langsung dari query
        });

        setData(res.data || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error("Gagal ambil data:", err);
        setData([]);
      }
    };

    fetchData();
  }, [currentPage, limit, kodePoli]);

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
          className={`btn btn-sm mx-1 ${
            currentPage === page
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
    <div className="card shadow-sm card-theme mt-3">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">
          Daftar Antrian Pasien{" "}
          {kodePoli ? `(POLI ${kodePoli})` : "(Semua Poli)"}
        </h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="table-responsive">
          <table className="table table-theme table-lg table-bordered table-besar">
            <thead>
              <tr>
                <th style={{ paddingLeft: "10px" }}>No</th>
                <th>Kode Booking</th>
                <th>NRM</th>
                <th>Nama Pasien</th>
                {!isMobile && <th>Alamat</th>}
                {!isMobile && <th>Poli</th>}
                {!isMobile && <th>No Antrian</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.nik || index}>
                    <td>{(currentPage - 1) * limit + index + 1}</td>
                    <td>{item.kode_booking}</td>
                    <td>{item.no_rm}</td>
                    <td>{item.patient_nm}</td>
                    {!isMobile && <td>{item.address}</td>}
                    {!isMobile && <td>POLI KLINIK {item.nama_poli}</td>}
                    <td className="text-center">
                      {item.kode_poli}-{item.angka_antrian_num}
                    </td>
                    <td>
                      {item.verified_by ? (
                        <span className="btn btn-lg btn-warning">CHECK-IN</span>
                      ) : (
                        <span className="btn btn-lg btn-success">PRINT</span>
                      )}
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
