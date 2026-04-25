import { formatDate } from "../../../utils/FormatDate";

const DataMutasi = ({
  data,
  isMobile,
  currentPage,
  limit,
  handleSelectMutasi,
  handlePrevPage,
  handleNextPage,
  totalPages,
  setCurrentPage,
}) => {
  // Sama seperti DataPresensi
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
        <h6 className="mb-0">Data Mutasi Pegawai</h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="table-responsive">
          <table className="table table-theme table-sm table-bordered">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Pegawai</th>
                <th>Unit Saat Ini</th>
                <th>Jabatan</th>
                {!isMobile && <th>Tgl Mutasi</th>}
                <th>Ver-Val</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: "10px" }}>
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td>
                      <span
                        className="text-primary"
                        role="button"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectMutasi(item, index)}
                      >
                        {item.nama_pegawai}
                      </span>
                    </td>
                    <td>{item.unit_nm}</td>
                    <td>{item.jabatan}</td>
                    {!isMobile && <td>{formatDate(item.mutation_dt)}</td>}
                    <td>
                      {item.verified_by ? "✅" : "❌"} -{" "}
                      {item.validated_by ? "✅" : "❌"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination sama seperti DataPresensi */}
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

export default DataMutasi;
