import { formatNumber } from "../../../utils/FormatNumber";
import { formatDate } from "../../../utils/FormatDate";

// Komponen DataPegawai menampilkan daftar pegawai dengan pagination dan responsif (mobile vs desktop).
// - Saat mobile, kolom tambahan disembunyikan untuk tampilan yang lebih ringkas.
// - Tombol pagination dengan range dinamis dan titik-titik (...) untuk navigasi halaman yang mudah.
// - Klik nama pegawai akan memicu fungsi handleSelectPegawai untuk menampilkan detail/edit data.

const DataKomponenGaji = ({
  data,
  isMobile,
  currentPage,
  limit,
  handleSelectKomponen,
  handlePrevPage,
  handleNextPage,
  totalPages,
  setCurrentPage,
}) => {
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
        <h6 className="mb-0">Data Komponen Penghasilan Gaji</h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="table-responsive">
          <table className="table table-theme table-sm table-bordered">
            <thead>
              <tr>
                <th style={{ paddingLeft: "10px" }}>No</th>
                <th>Periode</th>
                <th>Daftar Penghasilan & Potongan</th>
                <th>Nama Pegawai</th>
                <th>Status</th>
                <th>Total Nilai</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.penghasilan_code || index}>
                    <td style={{ paddingLeft: "10px" }}>
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td>
                      <span
                        className="text-primary"
                        role="button"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectKomponen(item, index)}
                      >
                        {formatDate(item.periode)}
                      </span>
                    </td>
                    <td>
                      {item.daftar_penghasilan}
                      <br />
                      {item.daftar_potongan}
                    </td>
                    <td>{item.employee_nm}</td>
                    <td>
                      {Array.isArray(item.employee_sts)
                        ? item.employee_sts.join(", ")
                        : item.employee_sts || "-"}
                    </td>
                    <td className="text-right">
                      {formatNumber(item.total_penghasilan)}
                      <br />
                      {formatNumber(item.total_potongan)}
                      <hr className="p-0 m-0" />
                      <b>{formatNumber(item.thp)}</b>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
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

export default DataKomponenGaji;
