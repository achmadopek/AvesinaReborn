import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  createPresensi,
  updatePresensi,
} from "../../../api/wj_sdm/PresensiPegawai";
import { formatNumber, extractRawNumber } from "../../../utils/FormatNumber";
import {
  formatDateToPeriode,
  formatDateToPeriodeYYYYMM,
} from "../../../utils/FormatDate";

import FormPresensi from "./FormPresensi";
import DataPresensi from "./DataPresensi";
import HistoryPresensi from "./HistoryPresensi";

import { useNotification } from "../../../context/NotificationContext";

import { toast } from "react-toastify";

const initialFormState = {
  peg_id: "",
  periode: "",
  prosentase_alpha: "",
  nilai: "",
  _raw_nilai: "", // <- nilai asli
};

const PresensiPegawai = ({ setRightContent, defaultRightContent }) => {
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

  // --- Reset RightContent ke default saat mount ---
  useEffect(() => {
    setRightContent(defaultRightContent);
  }, [setRightContent, defaultRightContent]);

  // Pantau perubahan ukuran jendela untuk toggle mode mobile/tablet
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditIndex(null);
  }, []);

  const loadData = useCallback(
    async (page = 1, searchNama = "") => {
      try {
        const result = await fetchPaginatedData(page, limit, searchNama);
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (isEditing) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage, form.pegawai_nm);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.pegawai_nm, isEditing, loadData]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (!isEditing && name === "pegawai_nm") {
        setCurrentPage(1);
      }

      // Format default_nilai (e.g. "2400000" -> "2.400.000")
      if (name === "nilai") {
        const raw = extractRawNumber(value);
        const formatted = formatNumber(raw);
        setForm((prev) => ({ ...prev, [name]: formatted, _raw_nilai: raw }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    },
    [isEditing]
  );

  const handleEdit = useCallback(
    (index) => {
      const selected = data[index];
      setForm({
        ...selected,
        periode: formatDateToPeriodeYYYYMM(selected.periode),
      });
      setIsEditing(true);
      setEditIndex(index);
    },
    [data]
  );

  // Pilih kegiatan untuk menampilkan peserta
  const handleSelectPresensi = useCallback(
    (item, index) => {
      handleEdit(index);
      setRightContent(<HistoryPresensi pegId={item.peg_id} />);
    },
    [handleEdit, setRightContent]
  );

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const payload = {
        ...form,
        periode:
          form.periode.length === 7 ? `${form.periode}-01` : form.periode,
        nilai: extractRawNumber(form._raw_nilai) || "0",
      };

      try {
        if (isEditing) {
          await updatePresensi(form.id, payload);
          toast.success("Data presensi berhasil diperbarui");
        } else {
          await createPresensi(payload);
          toast.success("Data presensi berhasil ditambahkan");
        }

        resetForm();
        await loadData(currentPage);

        loadNotificationCount();
      } catch (err) {
        console.error("Gagal menyimpan presensi:", err);
        toast.error("Terjadi kesalahan saat menyimpan.");
      }
    },
    [form, isEditing, resetForm, loadData, currentPage]
  );

  return (
    <>
      {/* Formulir Presensi */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Formulir Presensi Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormPresensi
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            fetchData={loadData}
            resetForm={resetForm}
            setForm={setForm}
          />
        </div>
      </div>

      {/* Tabel Presensi */}
      <DataPresensi
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        handleEdit={handleEdit}
        handleSelectPresensi={handleSelectPresensi}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default PresensiPegawai;
