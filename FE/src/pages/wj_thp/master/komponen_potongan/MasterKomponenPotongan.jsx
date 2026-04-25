import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  createKomponen,
  updateKomponen,
} from "../../../../api/wj_thp/KomponenPotongan";
import FormKomponenPotongan from "./FormKomponenPotongan";
import DetailKomponenPotongan from "./DetailKomponenPotongan";
import DataKomponenPotongan from "./DataKomponenPotongan";
import { formatNumber, extractRawNumber } from "../../../../utils/FormatNumber";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";

// Catatan Penting:
// - initialFormState berisi struktur form default kosong.
// - Debounce digunakan untuk mengurangi frekuensi fetch saat input NIK/nama berubah.
// - Mode editing mengatur tampilan dan fungsi form untuk tambah/ubah data.
// - Komponen ini menangani pagination data pegawai dan update data lewat form.
// - Resize window dipantau untuk menyesuaikan tampilan mobile pada DataPegawai.

const initialFormState = {
  id: null,
  potongan_code: "",
  potongan_nm: "",
  employee_sts: [],
  penghasilan_id: "",
  default_nilai: "",
  satuan: "",
  _raw_default_nilai: "", // <- nilai asli
  education: "",
  golongan: "",
  jenis: "",
};

const MasterKomponenPotongan = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

  const { peg_id } = useAuth();

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

  // Reset form dan keluar mode edit
  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditIndex(null);
  }, []);

  // Ambil data pegawai sesuai halaman dan filter nik/nama
  const loadData = useCallback(
    async (page = 1, potongan_code = "", potongan_nm = "") => {
      try {
        const result = await fetchPaginatedData(
          page,
          limit,
          potongan_code,
          potongan_nm
        );
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      }
    },
    [limit]
  );

  // Debounce fetch data saat filter nik/nama berubah dan bukan mode edit
  useEffect(() => {
    if (isEditing) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage, form.potongan_code, form.potongan_nm);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.potongan_code, form.potongan_nm, isEditing, loadData]);

  // Update state form saat input berubah
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      // Handle checkbox multiple: employee_sts
      if (name === "employee_sts") {
        setForm((prev) => {
          const current = prev.employee_sts || [];
          let updated;

          if (checked) {
            updated = [...current, value];
          } else {
            updated = current.filter((v) => v !== value);
          }

          return { ...prev, employee_sts: updated };
        });
        return;
      }

      // Format default_nilai (e.g. "2400000" -> "2.400.000")
      if (name === "default_nilai") {
        const raw = extractRawNumber(value);
        const formatted = formatNumber(raw);
        setForm((prev) => ({
          ...prev,
          [name]: formatted,
          _raw_default_nilai: raw,
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }

      if (!isEditing && (name === "potongan_code" || name === "potongan_nm")) {
        setCurrentPage(1);
      }
    },
    [isEditing]
  );

  // Submit form untuk tambah atau update data
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!form.employee_sts || form.employee_sts.length === 0) {
        toast.error("Pilih minimal satu status pegawai");
        return;
      }

      // Validasi: employee_sts wajib diisi
      if (!form.employee_sts || form.employee_sts.length === 0) {
        toast.error("Status kepegawaian wajib dipilih");
        return;
      }

      try {
        const payload = {
          ...form,
          employee_sts: (form.employee_sts || []).join(",") + ",", // hasil akhir di DB: "PNS,PPPK,"
          default_nilai: extractRawNumber(form._raw_default_nilai) || "0",
          entried_by: peg_id,
        };

        if (isEditing) {
          await updateKomponen(form.id, payload);
          toast.success("Data berhasil diperbarui");
        } else {
          await createKomponen(payload);
          toast.success("Data berhasil ditambahkan");
        }

        resetForm();
        await loadData(currentPage);
      } catch (err) {
        console.error("Gagal submit:", err);
        toast.error("Terjadi kesalahan saat simpan.");
      }
    },
    [form, isEditing, resetForm, loadData, currentPage]
  );

  const handleEdit = useCallback(
    (index) => {
      const item = data[index];
      const raw = extractRawNumber(item.default_nilai);
      const formatted = formatNumber(raw);

      setForm({
        ...item,
        employee_sts: item.employee_sts?.split(",").filter(Boolean) || [],
        default_nilai: formatted,
        _raw_default_nilai: raw,
      });

      setIsEditing(true);
      setEditIndex(index);
    },
    [data]
  );

  // Saat klik pegawai pada daftar, tampilkan detail dan edit form
  const handleSelectKomponen = useCallback(
    (item, index) => {
      handleEdit(index);
      setRightContent(
        <>
          <DetailKomponenPotongan item={item} />
        </>
      );
    },
    [handleEdit, setRightContent]
  );

  // Navigasi halaman sebelumnya
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  // Navigasi halaman berikutnya
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  return (
    <>
      {/* Form Input Pegawai */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Master Komponen Potongan</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormKomponenPotongan
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

      {/* Daftar Pegawai */}
      <DataKomponenPotongan
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        handleSelectKomponen={handleSelectKomponen}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default MasterKomponenPotongan;
