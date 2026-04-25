import { useEffect, useState } from "react";
import {
  fetchPaginatedDataBugarr,
  fetchDetailBugarr
} from "../../api/wj_bugarr/MonitoringBugarr";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import { formatDate } from "../../utils/FormatDate";

const MonitoringBugarr = () => {
  const { role } = useAuth();

  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [bulanIni, setBulan] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // -----------------------
  // PAGINATION
  // -----------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // -----------------------
  // LOAD DATA
  // -----------------------
  const loadData = async (page = 1, bulan = bulanIni) => {

    setLoading(true);

    try {

      const res = await fetchPaginatedDataBugarr({
        page,
        limit,
        tgl: bulan
      });

      setData(res.data || []);

      // jika backend kirim totalPages
      setTotalPages(res.totalPages || 1);

      setCurrentPage(page);

    } catch (err) {

      console.error(err);
      toast.error("Gagal memuat data");
      setData([]);

    } finally {

      setLoading(false);

    }
  };

  const handleLoadData = () => {

    if (!bulanIni) {
      toast.warn("Pilih periode bulan dulu");
      return;
    }

    loadData(1, bulanIni);

  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadData(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadData(currentPage + 1);
    }
  };

  // -----------------------
  // MODAL DETAIL
  // -----------------------
  const openModalDetail = async (row) => {

    try {

      const res = await fetchDetailBugarr(row.id);

      if (res.success) {

        setSelectedDetail({
          ...row,
          bugarr: res.data
        });

        setShowDetailModal(true);

      }

    } catch (err) {

      console.error(err);
      toast.error("Gagal memuat detail BUGARR");

    }

  };

  // -----------------------
  // HELPER
  // -----------------------
  const hitungCapaian = (row) => {
    return `${row.upload_foto || 0} / ${row.total_elemen || 6}`;
  };

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
          onClick={() => loadData(page)}
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

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= MODAL DETAIL ================= */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        backdrop="static"
        size="xl"
        dialogClassName="modal-theme"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Detail BUGARR - {selectedDetail?.nama_ruangan}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="row">

            {selectedDetail?.bugarr?.map((val, i) => (

              <div className="col-md-4 mb-3" key={i}>

                <div className="card h-100 shadow-sm">

                  {val?.foto && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${val.foto}`}
                      className="card-img-top"
                      style={{
                        height: "160px",
                        objectFit: "cover"
                      }}
                    />
                  )}

                  <div className="card-body p-2">

                    <strong>
                      {val.nama}
                    </strong>

                    <p style={{ fontSize: "9pt" }}>
                      {val.keterangan || "-"}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDetailModal(false)}
          >
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">

        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring BUGARR</h6>
        </div>

        <div className="card-body px-3 py-3">

          {/* ================= FILTER ================= */}
          <div className="d-flex flex-wrap align-items-end mb-3">

            <div className="me-2">
              <label className="form-label fw-semibold mb-1">
                Bulan Laporan
              </label>

              <input
                type="month"
                className="form-control form-control-sm"
                value={bulanIni}
                onChange={(e) => setBulan(e.target.value)}
              />
            </div>

            <div className="mt-3 mt-sm-0">
              <button
                onClick={handleLoadData}
                className="btn btn-sm btn-outline-primary ms-sm-2"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>

          </div>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">

              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal Laporan</th>
                  <th>Nama Ruangan</th>
                  <th>Kepala Ruangan</th>
                  <th>Capaian Upload</th>
                  <th>Rating Polling</th>
                  <th>Rangking</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>

                {data.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      Tidak ada data
                    </td>
                  </tr>
                )}

                {data.map((row, i) => (
                  <tr key={row.id || i}>
                    <td>{(currentPage - 1) * limit + i + 1}</td>
                    <td>{formatDate(row.tanggal_laporan)}</td>
                    <td>{row.nama_ruangan}</td>
                    <td>{row.kepala_ruangan}</td>
                    <td className="text-center">
                      <span className="badge bg-info">
                        {hitungCapaian(row)}
                      </span>
                    </td>
                    <td className="text-center">
                      {row.rating_polling ? (
                        <span className="badge bg-success">
                          {row.rating_polling}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      {row.rangking ? (
                        <span className="badge bg-warning text-dark">
                          #{row.rangking}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openModalDetail(row)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

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
      </div>
    </>
  );
};

export default MonitoringBugarr;