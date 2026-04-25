import { useEffect, useState, useCallback, useRef, useContext } from "react";
import {
  fetchPaginatedData,
  fetchDaftarPoli,
} from "../../../api/wj_monapp/MasterAnjungan";
import AntrianForm from "./FormAntrian";
import DataAntrian from "./DataAntrian";
import DaftarPoli from "./DaftarPoli";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";

const initialFormState = {
  id: null,
  search: "",
  mr_id: "",
  birth_dt: "",
  place_of_birth: "",
  mr_code: "",
  patient_nm: "",
  andress: "",
};

const MasterAnjungan = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]); // data antrian
  const [poliData, setPoliData] = useState([]); // data daftar poli
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

  const { role } = useContext(AuthContext);
  const { notificationCount, loadNotificationCount } = useNotification();

  // ---- Pantau ukuran layar ----
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Reset form ----
  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
  }, []);

  // ---- Load Daftar Poli ----
  const loadDaftarPoli = useCallback(async () => {
    try {
      const result = await fetchDaftarPoli();
      console.log("👉 Hasil fetchDaftarPoli:", result); // sudah array
      setPoliData(result || []); // langsung pakai result
    } catch (err) {
      console.error("Gagal fetch daftar poli:", err);
    }
  }, []);

  useEffect(() => {
    loadDaftarPoli();
  }, [loadDaftarPoli]);

  // ---- Load Data Antrian ----
  const loadData = useCallback(
    async (page = 1, search = "") => {
      if (!search.trim()) return; // jangan fetch kalau kosong
      try {
        const result = await fetchPaginatedData(page, limit, search);
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data antrian:", err);
      }
    },
    [limit]
  );

  // ---- Debounce Search ----
  useEffect(() => {
    if (isEditing) return;
    if (!form.search.trim()) return; // skip kalau search kosong

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage, form.search);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.search, isEditing, loadData]);

  // ---- Handle Input ----
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (!isEditing && name === "search") setCurrentPage(1);
    },
    [isEditing]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("Submit:", form);
    },
    [form]
  );

  // ---- Handle Edit / Select ----
  const handleEdit = useCallback(
    (index) => {
      setForm(data[index]);
      setIsEditing(true);
    },
    [data]
  );

  const handleSelectPegawai = useCallback(
    (item, index) => {
      handleEdit(index);
    },
    [handleEdit]
  );

  // ---- Render ----
  return (
    <>
      {/* Form Input */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Cari Antrian Pasien</h6>
        </div>
        <div className="card-body px-3 py-2">
          <AntrianForm
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

      {/* Kalau belum ada pencarian → tampil daftar poli */}
      {form.search.trim() === "" ? (
        <DaftarPoli
          data={poliData}
          isMobile={isMobile}
          onSelectPoli={(item) =>
            setForm((prev) => ({ ...prev, search: item.kode }))
          }
        />
      ) : (
        <DataAntrian
          data={data}
          isMobile={isMobile}
          currentPage={currentPage}
          totalPages={totalPages}
          limit={limit}
          handleSelectPegawai={handleSelectPegawai}
          handlePrevPage={() =>
            currentPage > 1 && setCurrentPage(currentPage - 1)
          }
          handleNextPage={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          setCurrentPage={setCurrentPage}
        />
      )}
    </>
  );
};

export default MasterAnjungan;
