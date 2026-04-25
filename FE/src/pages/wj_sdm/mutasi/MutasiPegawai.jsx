import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  createMutasi,
  updateMutasi,
} from "../../../api/wj_sdm/MutasiPegawai";
import { formatNumber, extractRawNumber } from "../../../utils/FormatNumber";

import FormMutasi from "./FormMutasi";
import DataMutasi from "./DataMutasi";
import HistoryMutasi from "./HistoryMutasi";
import { toast } from "react-toastify";

import { useNotification } from "../../../context/NotificationContext";

const initialFormState = {
  mutation_dt: "",
  peg_id: "",
  nama_pegawai: "",
  unit_id: "",
  unit_nm: "",
  keterangan: "",
  nilai: "",
};

const MutasiPegawai = ({ setRightContent, defaultRightContent }) => {
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
      loadData(currentPage, form.peg_nm); // pencarian case-insensitive nanti di API
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.peg_nm, isEditing, loadData]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      // format angka
      if (name === "nilai") {
        const raw = extractRawNumber(value);
        const formatted = formatNumber(raw);
        setForm((prev) => ({
          ...prev,
          [name]: formatted,
          _raw_default_nilai: raw,
        }));
        return;
      }

      setForm((prev) => ({ ...prev, [name]: value }));

      // reset page saat ganti nama pegawai
      if (!isEditing && name === "peg_nm") {
        setCurrentPage(1);
      }
    },
    [isEditing]
  );

  // untuk handle pilihan SearchSelectPegawai
  const handleSelectPegawai = useCallback((option) => {
    setForm((prev) => ({
      ...prev,
      peg_id: option?.value || "",
      peg_nm: option?.label || "",
    }));
  }, []);

  // untuk handle pilihan SearchSelectUnit
  const handleSelectUnit = useCallback((option) => {
    setForm((prev) => ({
      ...prev,
      unit_id: option?.value || "",
      unit_nm: option?.label || "",
    }));
  }, []);

  const handleEdit = useCallback(
    (index) => {
      const row = data[index];
      setForm({
        ...row,
        nilai: row.nilai ? formatNumber(row.nilai) : "",
      });
      setIsEditing(true);
      setEditIndex(index);
    },
    [data]
  );

  const handleSelectMutasi = useCallback(
    (item, index) => {
      handleEdit(index);
      setRightContent(<HistoryMutasi pegId={item.peg_id} />);
    },
    [handleEdit]
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
      try {
        if (isEditing) {
          await updateMutasi(form.id, {
            ...form,
            nilai: extractRawNumber(form.nilai),
          });
          toast.success("Data mutasi berhasil diperbarui");
        } else {
          await createMutasi({
            ...form,
            nilai: extractRawNumber(form.nilai),
          });
          toast.success("Data mutasi berhasil ditambahkan");
        }

        resetForm();
        await loadData(currentPage);

        loadNotificationCount();
      } catch (err) {
        console.error("Gagal menyimpan mutasi:", err);
        toast.error("Terjadi kesalahan saat menyimpan.");
      }
    },
    [form, isEditing, resetForm, loadData, currentPage]
  );

  return (
    <>
      {/* Formulir Mutasi */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Formulir Mutasi Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormMutasi
            form={form}
            handleChange={handleChange}
            handleSelectPegawai={handleSelectPegawai}
            handleSelectUnit={handleSelectUnit}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            fetchData={loadData}
            resetForm={resetForm}
            setForm={setForm}
          />
        </div>
      </div>

      {/* Tabel Mutasi */}
      <DataMutasi
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        handleEdit={handleEdit}
        handleSelectMutasi={handleSelectMutasi}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default MutasiPegawai;
