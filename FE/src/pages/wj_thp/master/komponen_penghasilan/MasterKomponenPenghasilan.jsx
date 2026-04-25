import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  createKomponen,
  updateKomponen,
} from "../../../../api/wj_thp/KomponenPenghasilan";
import FormKomponenPenghasilan from "./FormKomponenPenghasilan";
import DetailKomponenPenghasilan from "./DetailKomponenPenghasilan";
import DataKomponenPenghasilan from "./DataKomponenPenghasilan";
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
  id: "",
  penghasilan_code: "",
  penghasilan_nm: "",
  default_nilai: "",
  _raw_default_nilai: "", // <- nilai asli
  employee_sts: [],
  education: "",
  golongan: "",
  job_sts: "",
  unit_id: "",
  jenis: "",
};

const MasterKomponenPenghasilan = ({
  setRightContent,
  defaultRightContent,
}) => {
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
    async (page = 1, penghasilan_code = "", penghasilan_nm = "") => {
      try {
        const result = await fetchPaginatedData(
          page,
          limit,
          penghasilan_code,
          penghasilan_nm
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
      loadData(currentPage, form.penghasilan_code, form.penghasilan_nm);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [
    currentPage,
    form.penghasilan_code,
    form.penghasilan_nm,
    isEditing,
    loadData,
  ]);

  // Update state form saat input berubah
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      setForm((prev) => {
        const updatedForm = { ...prev };

        // Checkbox multiple (employee_sts)
        if (name === "employee_sts") {
          const current = prev.employee_sts || [];
          updatedForm.employee_sts = checked
            ? [...current, value]
            : current.filter((v) => v !== value);
          return updatedForm;
        }

        // Radio jenis
        if (name === "jenis") {
          updatedForm.jenis = value;
          updatedForm.isHonorKegiatan = value === "kegiatan";
          if (value === "kegiatan") {
            updatedForm.default_nilai = "0";
            updatedForm._raw_default_nilai = "0";
          }
          return updatedForm;
        }

        // Format nilai uang
        if (name === "default_nilai") {
          const raw = extractRawNumber(value);
          updatedForm.default_nilai = formatNumber(raw);
          updatedForm._raw_default_nilai = raw;
          return updatedForm;
        }

        // Default
        updatedForm[name] = value;
        return updatedForm;
      });

      // Reset halaman jika input tertentu berubah saat sedang tambah
      if (
        !isEditing &&
        (name === "penghasilan_code" || name === "penghasilan_nm")
      ) {
        setCurrentPage(1);
      }
    },
    [isEditing]
  );

  // Handle otomatisasi saat jenis dipilih
  useEffect(() => {
    if (form.jenis === "kegiatan") {
      // Atur default_nilai ke 0 dan _raw-nya juga
      setForm((prev) => ({
        ...prev,
        default_nilai: formatNumber(0),
        _raw_default_nilai: "0",
      }));
    } else if (form.jenis === "tetap") {
      // Reset nilai default jika kembali ke tetap (biarkan kosong)
      setForm((prev) => ({
        ...prev,
        default_nilai: "",
        _raw_default_nilai: "",
      }));
    } else if (form.jenis === "gaji") {
      // Reset nilai default jika kembali ke gaji (biarkan kosong)
      setForm((prev) => ({
        ...prev,
        default_nilai: "",
        _raw_default_nilai: "",
      }));
    }
  }, [form.jenis]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validasi pilihan: employee_sts harus dipilih minimal satu
      if (!form.employee_sts || form.employee_sts.length === 0) {
        toast.error("Pilih minimal satu status pegawai");
        return;
      }

      try {
        const payload = {
          ...form,
          employee_sts: (form.employee_sts || []).join(",") + ",", // hasil: "PNS,PPPK," dst.
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

  // Set form dan mode edit berdasarkan data yang dipilih dari list
  const handleEdit = useCallback(
    (index) => {
      const item = data[index];
      const raw = extractRawNumber(item.default_nilai);
      const formatted = formatNumber(raw);

      const isKegiatan = item.jenis === "kegiatan";

      setForm({
        ...item,
        employee_sts: item.employee_sts?.split(",").filter(Boolean) || [],
        default_nilai: isKegiatan ? formatNumber(0) : formatted,
        _raw_default_nilai: isKegiatan ? "0" : raw,
        education: item.education || "",
        golongan: item.golongan || "",
        job_sts: item.job_sts || "",
        unit_id: item.unit_id || "",
        unit_nm: item.unit_nm || "",
        isHonorKegiatan: isKegiatan,
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
          <DetailKomponenPenghasilan item={item} />
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
          <h6 className="mb-0">Master Komponen Penghasilan</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormKomponenPenghasilan
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
      <DataKomponenPenghasilan
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

export default MasterKomponenPenghasilan;
