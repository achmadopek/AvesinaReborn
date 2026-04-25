import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  saveImportedPenghasilanJPJM,
} from "../../../api/wj_thp/ImportJPJMPegawai";
import FormKomponenJPJM from "./FormKomponenJPJM";
import DataKomponenJPJM from "./DataKomponenJPJM";
import DetailKomponenPenghasilan from "../penghasilan_pegawai/DetailKomponenPenghasilan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

// Form hanya untuk meta input
const initialFormState = {
  periode: "",
  employee_sts: [],
};

const MasterKomponenJPJM = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [importedData, setImportedData] = useState([]); // hasil import Excel
  const [selectedSheet, setSelectedSheet] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const debounceTimeout = useRef(null);

  const { peg_id } = useAuth();

  const [loading, setLoading] = useState(false);

  // Reset form
  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditIndex(null);
    setImportedData([]); // reset juga data import
  }, []);

  // Ambil data sesuai filter
  const loadData = useCallback(
    async (page = 1) => {
      try {
        const result = await fetchPaginatedData(
          page,
          limit,
          form.periode,
          form.employee_sts,
          "tetap" // filter by jenis
        );
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      }
    },
    [limit, form.periode, form.employee_sts]
  );

  // Debounce load data
  useEffect(() => {
    if (isEditing) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadData(currentPage);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, form.periode, form.employee_sts, isEditing, loadData]);

  // Helper untuk membuat row kosong sesuai group pegawai
  const generateZeroRow = (nik) => {
    return {
      nik: nik,
      nama_pegawai: "-",
      jp_bruto: "0",
      pph_5_persen: "0",
      pph_15_persen: "0",
      pot_a: "0",
      pot_b: "0",
      pot_c: "0",
    };
  };

  // revisi handleSubmit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!importedData || importedData.length === 0) {
        toast.error("Tidak ada data import yang bisa disimpan");
        return;
      }

      try {
        setLoading(true);

        // 1. Ambil pegawai dari DB (full list untuk periode ini)
        const dbPegawai = await fetchPaginatedData(
          1,
          10000, // ambil semua
          form.periode,
          form.employee_sts,
          "tetap"
        );

        const dbNikSet = new Set(
          dbPegawai.data.map((p) => (p.nik || p.nip)?.toString().trim())
        );

        // 2. Ambil pegawai dari Excel
        const excelNikSet = new Set(
          importedData.map((item) => (item.nik || item.nip)?.toString().trim())
        );

        // 3. Cari pegawai DB yg tidak ada di Excel
        const missingNik = [...dbNikSet].filter((nik) => !excelNikSet.has(nik));

        if (missingNik.length > 0) {
          const confirmSave = window.confirm(
            `Ada ${missingNik.length} pegawai di DB tetapi tidak ada di Excel.\n` +
              `Data mereka akan disimpan dengan nilai 0.\n\nLanjutkan simpan?`
          );

          if (!confirmSave) {
            setLoading(false);
            return; // user cancel
          }

          // Tambahkan row kosong ke importedData
          const zeroRows = missingNik.map((nik) => generateZeroRow(nik));
          importedData.push(...zeroRows);
        }

        // 4. Payload dasar
        const payload = {
          periode: form.periode ? `${form.periode}-01` : null,
          entried_by: peg_id,
          sheet_type: selectedSheet || null,
          data: [],
        };

        payload.data = importedData.map((item) => ({
          nik: item.nik,
          nama_pegawai: item.nama_pegawai || "-",
          jp_bruto: item.jp_bruto || "0",
          pph_5_persen: item.pph_5_persen || "0",
          pph_15_persen: item.pph_15_persen || "0",
          pot_a: item.pot_a || "0",
          pot_b: item.pot_b || "0",
          pot_c: item.pot_c || "0",
        }));
        await saveImportedPenghasilanJPJM(payload);

        toast.success("Data import berhasil disimpan");
        resetForm();
        loadData(1);

        console.log("Payload disimpan:", payload);
      } catch (err) {
        console.error("Gagal simpan import:", err);
        toast.error("Terjadi kesalahan saat simpan import.");
      } finally {
        setLoading(false);
      }
    },
    [form, peg_id, importedData, resetForm, loadData]
  );

  // Handle perubahan form (khusus periode + employee_sts)
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const updatedForm = { ...prev };

      if (name === "employee_sts") {
        const current = prev.employee_sts || [];
        updatedForm.employee_sts = checked
          ? [...current, value]
          : current.filter((v) => v !== value);
        return updatedForm;
      }

      updatedForm[name] = value;
      return updatedForm;
    });
  }, []);

  // Saat klik pegawai pada daftar, tampilkan detail dan edit form
  const handleSelectKomponen = useCallback(
    (item, index) => {
      setRightContent(
        <>
          <DetailKomponenPenghasilan item={item} />
        </>
      );
    },
    [setRightContent]
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
      {/* Form Input + Upload Excel */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Master Komponen Import JPJM</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormKomponenJPJM
            form={form}
            isMobile={isMobile}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            resetForm={resetForm}
            setForm={setForm}
            loading={loading}
            importedData={importedData} // lempar ke FormKomponenJPJM
            setImportedData={setImportedData} // supaya hasil import masuk ke sini
            setSelectedSheet={setSelectedSheet}
          />
        </div>
      </div>

      {/* Daftar Preview Data */}
      <DataKomponenJPJM
        data={data}
        isMobile={isMobile}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        limit={limit}
        handleSelectKomponen={handleSelectKomponen}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
      />
    </>
  );
};

export default MasterKomponenJPJM;
