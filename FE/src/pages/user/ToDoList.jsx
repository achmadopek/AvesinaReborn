import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchPaginatedData } from "../../api/Notification";

const ToDoList = ({ onClose }) => {
  const { role, peg_id } = useAuth();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [data, setData] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Pantau perubahan ukuran jendela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ambil data notification di backend
  const loadData = useCallback(
    async (page = 1) => {
      try {
        const result = await fetchPaginatedData(page, limit, role, peg_id);
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      }
    },
    [limit, role, peg_id]
  );

  // Fetch pertama kali
  useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Navigasi halaman sebelumnya
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  // Navigasi halaman berikutnya
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  // Klik item → redirect ke route
  const handleSelectItem = (route) => {
    navigate(`/${route}`);
    if (onClose) onClose(); // panggil fungsi close dari Topbar
  };

  // Fungsi untuk pagination
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
    <>
      <table className="table table-theme table-sm table-bordered">
        <thead>
          <tr>
            <th style={{ paddingLeft: "10px" }}>No</th>
            <th>Notifikasi</th>
            <th>Halaman</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.pegID || index}>
                <td style={{ paddingLeft: "10px" }}>
                  {(currentPage - 1) * limit + index + 1}
                </td>
                <td style={{ whiteSpace: "pre-line" }}>
                  <span style={{ color: "red" }}>
                    <i className="fa fw fa-info-circle"></i>
                    &nbsp;
                    {item.judul}
                    <br />({item.object})
                  </span>
                </td>
                <td>
                  <span
                    className="text-primary"
                    role="button"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectItem(item.route)}
                  >
                    {item.route}
                  </span>
                </td>
                {!isMobile && item.status ? (
                  <td style={{ whiteSpace: "pre-line" }}>{item.status}</td>
                ) : (
                  <td style={{ whiteSpace: "pre-line" }}>
                    Belum terverifikasi, <br />
                    segera hubungi Kepegawaian
                  </td>
                )}
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
    </>
  );
};

export default ToDoList;
