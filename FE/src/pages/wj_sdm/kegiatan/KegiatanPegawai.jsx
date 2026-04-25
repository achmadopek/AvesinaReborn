import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  createKegiatan,
  updateKegiatan,
} from "../../../api/wj_sdm/KegiatanPegawai";
import PesertaKegiatan from "./PesertaKegiatan";
import FormKegiatan from "./FormKegiatan";
import DataKegiatan from "./DataKegiatan";

import { useNotification } from "../../../context/NotificationContext";
import { toast } from "react-toastify";

const initialFormState = {
  event_code: "",
  event_nm: "",
  event_dt: "",
  location_nm: "",
  penghasilan_id: "",
};

const KegiatanPegawai = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

  const { notificationCount, loadNotificationCount } = useNotification();

  // --- Responsif ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Reset RightContent ke default saat mount ---
  useEffect(() => {
    setRightContent(defaultRightContent);
  }, [setRightContent, defaultRightContent]);

  // --- Reset form ---
  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditIndex(null);
    setRightContent(defaultRightContent); // reset RightContent ke default
  }, [defaultRightContent, setRightContent]);

  // --- Load data dari API ---
  const loadData = useCallback(
    async (page = 1, event_nm = "") => {
      try {
        const result = await fetchPaginatedData(page, limit, event_nm);
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      }
    },
    [limit]
  );

  // --- Debounce saat pencarian ---
  useEffect(() => {
    if (isEditing) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage, form.event_nm);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.event_nm, isEditing, loadData]);

  // --- Input handler ---
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (!isEditing && name === "event_nm") setCurrentPage(1);
    },
    [isEditing]
  );

  // --- Edit data ---
  const handleEdit = useCallback(
    (index) => {
      setForm(data[index]);
      setIsEditing(true);
      setEditIndex(index);
    },
    [data]
  );

  // --- Pilih kegiatan, tampilkan peserta di RightContent ---
  const handleSelectKegiatan = useCallback(
    (item, index) => {
      handleEdit(index);
      setRightContent(<PesertaKegiatan item={item} />);
    },
    [handleEdit, setRightContent]
  );

  // --- Pagination ---
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  // --- Submit form ---
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (isEditing) {
          await updateKegiatan(form.id, form);
          toast.success("Data kegiatan berhasil diperbarui");
        } else {
          await createKegiatan(form);
          toast.success("Data kegiatan berhasil ditambahkan");
        }
        resetForm();
        await loadData(currentPage);

        loadNotificationCount();
      } catch (err) {
        console.error("Gagal menyimpan kegiatan:", err);
        toast.error("Terjadi kesalahan saat menyimpan.");
      }
    },
    [form, isEditing, resetForm, loadData, currentPage]
  );

  return (
    <>
      {/* Formulir Kegiatan */}
      <div className="card shadow-sm card-theme mb-3">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Formulir Kegiatan</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormKegiatan
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            resetForm={resetForm}
            fetchData={loadData}
            setForm={setForm}
          />
        </div>
      </div>

      {/* Data Kegiatan */}
      <DataKegiatan
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        handleSelectKegiatan={handleSelectKegiatan}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default KegiatanPegawai;
