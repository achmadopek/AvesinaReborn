import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchPaginatedData,
  saveImportedPenghasilan,
  saveImportedPenghasilanNonASN,
} from "../../../api/wj_thp/ImportGajiPegawai";
import FormKomponenGaji from "./FormKomponenGaji";
import DataKomponenGaji from "./DataKomponenGaji";
import DetailKomponenPenghasilan from "../penghasilan_pegawai/DetailKomponenPenghasilan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

// Form hanya untuk meta input
const initialFormState = {
  periode: "",
  employee_sts: [],
};

const MasterKomponenGaji = ({ setRightContent, defaultRightContent }) => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [importedData, setImportedData] = useState([]); // hasil import Excel

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
          "gaji" // filter by jenis
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
  const generateZeroRow = (employee_group, nik) => {
    if (employee_group === "ASN") {
      return {
        nip: nik,
        nama_pegawai: "-",
        gaji_pokok: "0",
        tunj_anak: "0",
        tunj_beras: "0",
        tunj_bpjs_kes_4: "0",
        tunj_eselon: "0",
        tunj_fung_umum: "0",
        tunj_fungsional: "0",
        tunj_istri_smi: "0",
        tunj_jkk: "0",
        tunj_jkm: "0",
        tunj_khusus: "0",
        tunj_pajak: "0",
        tunj_tapera_pk: "0",
        tunj_terpencil: "0",
        tunj_tkd: "0",
        pembulatan_gaji: "0",
        pot_bpjs_kes: "0",
        pot_bulog: "0",
        pot_hutang: "0",
        pot_iwp_1: "0",
        pot_iwp_8: "0",
        pot_jkk: "0",
        pot_jkm: "0",
        pot_pajak: "0",
        pot_sewa_rumah: "0",
        pot_taperum: "0",
      };
    } else {
      return {
        nik: nik,
        nama_pegawai: "-",
        gaji_kotor: "0",
        siwa_kpri: "0",
        angs_kpri: "0",
        angs_ibi: "0",
        pot_bpjs: "0",
        pot_idi: "0",
        pot_ibi: "0",
      };
    }
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
          "gaji"
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
          const zeroRows = missingNik.map((nik) =>
            generateZeroRow(form.employee_group, nik)
          );
          importedData.push(...zeroRows);
        }

        // 4. Payload dasar
        const payload = {
          periode: form.periode ? `${form.periode}-01` : null,
          entried_by: peg_id,
          data: [],
        };

        if (form.employee_group === "ASN") {
          payload.data = importedData.map((item) => ({
            nip: item.nip,
            nama_pegawai: item.nama_pegawai || "-",
            gaji_pokok: item.gaji_pokok || "0",
            tunj_anak: item.tunj_anak || "0",
            tunj_beras: item.tunj_beras || "0",
            tunj_bpjs_kes_4: item.tunj_bpjs_kes_4 || "0",
            tunj_eselon: item.tunj_eselon || "0",
            tunj_fung_umum: item.tunj_fung_umum || "0",
            tunj_fungsional: item.tunj_fungsional || "0",
            tunj_istri_smi: item.tunj_istri_smi || "0",
            tunj_jkk: item.tunj_jkk || "0",
            tunj_jkm: item.tunj_jkm || "0",
            tunj_khusus: item.tunj_khusus || "0",
            tunj_pajak: item.tunj_pajak || "0",
            tunj_tapera_pk: item.tunj_tapera_pk || "0",
            tunj_terpencil: item.tunj_terpencil || "0",
            tunj_tkd: item.tunj_tkd || "0",
            pembulatan_gaji: item.pembulatan_gaji || "0",
            pot_bpjs_kes: item.pot_bpjs_kes || "0",
            pot_bulog: item.pot_bulog || "0",
            pot_hutang: item.pot_hutang || "0",
            pot_iwp_1: item.pot_iwp_1 || "0",
            pot_iwp_8: item.pot_iwp_8 || "0",
            pot_jkk: item.pot_jkk || "0",
            pot_jkm: item.pot_jkm || "0",
            pot_pajak: item.pot_pajak || "0",
            pot_sewa_rumah: item.pot_sewa_rumah || "0",
            pot_taperum: item.pot_taperum || "0",
          }));
          await saveImportedPenghasilan(payload);
        } else if (form.employee_group === "Non ASN") {
          payload.data = importedData.map((item) => ({
            nik: item.nik,
            nama_pegawai: item.nama_pegawai || "-",
            gaji_kotor: item.gaji_kotor || "0",
            siwa_kpri: item.siwa_kpri || "0",
            angs_kpri: item.angs_kpri || "0",
            angs_ibi: item.angs_ibi || "0",
            pot_bpjs: item.pot_bpjs || "0",
            pot_idi: item.pot_idi || "0",
            pot_ibi: item.pot_ibi || "0",
          }));
          await saveImportedPenghasilanNonASN(payload);
        }

        toast.success("Data import berhasil disimpan");
        resetForm();
        loadData(1);
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
        <div className="card-header text-white py-2 px-3">
          <h6 className="mb-0">Master Komponen Import Gaji</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormKomponenGaji
            form={form}
            isMobile={isMobile}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            resetForm={resetForm}
            setForm={setForm}
            loading={loading}
            importedData={importedData} // lempar ke FormKomponenGaji
            setImportedData={setImportedData} // supaya hasil import masuk ke sini
          />
        </div>
      </div>

      {/* Daftar Preview Data */}
      <DataKomponenGaji
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

export default MasterKomponenGaji;
