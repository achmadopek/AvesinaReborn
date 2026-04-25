import React from "react";
import { formatDate } from "../../../../utils/FormatDate";
import { useAuth } from "../../../../context/AuthContext";

// Komponen DataPegawai menampilkan daftar pegawai dengan pagination dan responsif (mobile vs desktop).
// - Saat mobile, kolom tambahan disembunyikan untuk tampilan yang lebih ringkas.
// - Tombol pagination dengan range dinamis dan titik-titik (...) untuk navigasi halaman yang mudah.
// - Klik nama pegawai akan memicu fungsi handleSelectPegawai untuk menampilkan detail/edit data.

const DataPegawai = ({
  data,
  isMobile,
  currentPage,
  limit,
  handleSelectPegawai,
  handlePrevPage,
  handleNextPage,
  totalPages,
  setCurrentPage,
}) => {
  const { role } = useAuth();

  // Fungsi untuk menghasilkan halaman pagination dengan titik-titik "..." untuk pemendekan
  const renderPageNumbers = () => {
    const delta = 1; // jarak halaman di kiri dan kanan halaman aktif
    const range = (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    // Fungsi untuk menyisipkan titik-titik (...) jika ada jeda halaman
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

    // Halaman awal, akhir, dan tengah yang ingin ditampilkan
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
        <h6 className="mb-0">Data Pegawai</h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="table-responsive">
          <table className="table table-theme table-sm table-bordered">
            <thead>
              <tr>
                <th style={{ paddingLeft: "10px" }}>No</th>
                <th>NIK</th>
                <th>Nama Pegawai</th>
                {!isMobile && <th>Tgl Lahir</th>}
                {!isMobile && <th>Tempat Lahir</th>}
                {!isMobile && <th>Pendidikan</th>}
                {!isMobile && <th>Status</th>}
                <th>Ver-Val</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.nik || index}>
                    <td style={{ paddingLeft: "10px" }}>
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td>{item.nik}</td>
                    <td>
                      <span
                        className="text-primary"
                        role="button"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectPegawai(item, index)}
                      >
                        {item.employee_nm}
                      </span>
                    </td>
                    {!isMobile && (
                      <td>{formatDate(item.birth_dt?.substring(0, 10))}</td>
                    )}
                    {!isMobile && <td>{item.place_of_birth}</td>}
                    {!isMobile && <td>{item.education}</td>}
                    {!isMobile && <td>{item.employee_sts}</td>}
                    <td>
                      {item.verified_by ? (
                        <span style={{ color: "green", fontSize: "8pt" }}>
                          ✅
                        </span>
                      ) : (
                        <span style={{ color: "red", fontSize: "8pt" }}>
                          ❌
                        </span>
                      )}
                      -
                      {item.validated_by ? (
                        <span style={{ color: "green", fontSize: "8pt" }}>
                          ✅
                        </span>
                      ) : (
                        <span style={{ color: "red", fontSize: "8pt" }}>
                          ❌
                        </span>
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

        {/* Navigasi halaman */}
        <div className="pagination-controls mt-2 px-3 py-2 d-flex justify-content-between align-items-center">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="btn btn-outline-secondary btn-sm"
          >
            &laquo; Prev
          </button>

          <div>{renderPageNumbers()}</div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="btn btn-outline-secondary btn-sm"
          >
            Next &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPegawai;
