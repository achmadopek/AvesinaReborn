import { useEffect, useState, useCallback, useRef } from "react";
import { fetchPaginatedData } from "../../../../api/wj_thp/MasterKeuangan";
import DetailPegawai from "../../../wj_sdm/master/pegawai/DetailPegawai";
import RekeningPegawai from "./RekeningPegawai";
import DataPegawai from "../../../wj_sdm/master/pegawai/DataPegawai";
import CariPegawai from "./CariPegawai";

// Catatan Penting:
// - initialFormState berisi struktur form default kosong.
// - Debounce digunakan untuk mengurangi frekuensi fetch saat input NIK/nama berubah.
// - Mode editing mengatur tampilan dan fungsi form untuk tambah/ubah data.
// - Komponen ini menangani pagination data pegawai dan update data lewat form.
// - Resize window dipantau untuk menyesuaikan tampilan mobile pada DataPegawai.

const initialFormState = {
  id: null,
  nik: "",
  employee_nm: "",
  birth_dt: "",
  place_of_birth: "",
  nip: "",
  golongan: "",
  mkg: "",
  npwp: "",
  education: "",
  employee_sts: "",
  doctor_sts: "",
};

const MasterKeuangan = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

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
    async (page = 1, nik = "", nama = "") => {
      try {
        const result = await fetchPaginatedData(page, limit, nik, nama);
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
      loadData(currentPage, form.nik, form.employee_nm);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.nik, form.employee_nm, isEditing, loadData]);

  // Update state form saat input berubah
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));

      if (!isEditing && (name === "nik" || name === "employee_nm")) {
        setCurrentPage(1);
      }
    },
    [isEditing]
  );

  // Set form dan mode edit berdasarkan data yang dipilih dari list
  const handleEdit = useCallback(
    (index) => {
      setForm(data[index]);
      setIsEditing(true);
      setEditIndex(index);
    },
    [data]
  );

  // Saat klik pegawai pada daftar, tampilkan detail dan edit form
  const handleSelectPegawai = useCallback(
    (item, index) => {
      handleEdit(index);
      setRightContent(
        <>
          <DetailPegawai item={item} />
          <br />
          <RekeningPegawai item={item} />
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
          <h6 className="mb-0">Rekening Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          <CariPegawai
            form={form}
            handleChange={handleChange}
            isEditing={isEditing}
            resetForm={resetForm}
            fetchData={loadData}
            setForm={setForm}
          />
        </div>
      </div>

      {/* Daftar Pegawai */}
      <DataPegawai
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        handleSelectPegawai={handleSelectPegawai}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default MasterKeuangan;
