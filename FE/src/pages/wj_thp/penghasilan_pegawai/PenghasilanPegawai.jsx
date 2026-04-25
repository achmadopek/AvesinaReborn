import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/AuthContext";
import SkeletonTable from "../../../utils/skeletonTable";

import {
  generatePenghasilanPegawai,
  simpanPenghasilanPegawai,
  endrollPenghasilanPegawai,
} from "../../../api/wj_thp/PenghasilanPegawai";

import DataPenghasilanGrid from "./DataPenghasilanGrid";
import FormPenghasilanPegawai from "./FormPenghasilanPegawai";

/**
 * Komponen utama untuk mengelola penghasilan pegawai:
 * - Menyediakan form untuk memilih status pegawai & periode
 * - Generate data berdasarkan status dan periode
 * - Menampilkan data dalam bentuk grid
 * - Menyimpan nilai yang diubah
 * - Endroll untuk mengunci data
 */

const PenghasilanPegawai = () => {
  const { peg_id: userPegId } = useAuth();

  // State
  const [employeeSts, setEmployeeSts] = useState("");
  const [periode, setPeriode] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // getMonth() dimulai dari 0
    return `${year}-${month}`;
  });
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [generatedData, setGeneratedData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = () => {
    inputRef.current?.showPicker?.(); // Untuk browser yang support
    inputRef.current?.focus(); // Fallback untuk lainnya
  };

  // Generate penghasilan pegawai
  const handleGenerate = async () => {
    if (!periode === "") {
      toast.warning("Periode harus diisi.");
    }

    setIsLoadingGenerate(true);
    try {
      const result = await generatePenghasilanPegawai(employeeSts, periode);

      const dataArray = result.data || [];
      const message = result.message || "";

      if (message) {
        toast.warning(message); // tampilkan peringatan dari backend
      }

      if (dataArray.length === 0) {
        toast.warning("Data belum tersedia untuk status pegawai tersebut.");
        setGeneratedData([]);
        return;
      }

      setGeneratedData(dataArray);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Gagal generate data";
      toast.error(message);
    } finally {
      setIsLoadingGenerate(false);
    }
  };

  // Simpan nilai-nilai hasil edit
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const flattenedData = generatedData.flatMap((row) =>
        row.komponen.map((komp) => ({
          penghasilan_id: komp.penghasilan_id,
          peg_id: row.peg_id,
          periode: `${periode}-01`,
          nilai: komp.nilai,
          event_id: komp.event_id,
          entried_by: userPegId || null,
          jenis: komp.jenis,
        }))
      );

      await simpanPenghasilanPegawai(flattenedData);
      toast.success("Data berhasil disimpan.");
    } catch (err) {
      console.error("Gagal simpan:", err);
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // Endroll (mengunci data)
  const handleEndroll = async () => {
    const confirm = await Swal.fire({
      title: "Konfirmasi Endroll",
      text: "Setelah endroll, data tidak dapat diedit. Lanjutkan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Lanjutkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    setIsSaving(true);
    try {
      const endrollData = generatedData.map(({ peg_id }) => ({
        peg_id,
        periode,
      }));
      await endrollPenghasilanPegawai({ data: endrollData });
      toast.success("Data berhasil dikunci.");
      handleGenerate(); // reload ulang agar grid menjadi readonly
    } catch (err) {
      console.error(err);
      toast.error("Gagal endroll.");
    } finally {
      setIsSaving(false);
    }
  };

  // Menyusun data komponen per baris menjadi satu objek
  const flattenGeneratedData = (data) => {
    return data.map((item) => {
      const komponenValues = item.komponen?.reduce((acc, k) => {
        let uniqueCode = k.penghasilan_code;
        if (k.event_nm) {
          uniqueCode += `_${k.event_nm}`;
        }
        acc[uniqueCode] = k.nilai;
        return acc;
      }, {});
      return {
        ...item,
        ...komponenValues,
      };
    });
  };

  // Mengumpulkan daftar semua kode komponen penghasilan
  const flattenComponentMapping = (data) => {
    const codes = new Set();
    data.forEach((item) => {
      item.komponen?.forEach((k) => {
        let uniqueCode = k.penghasilan_code;
        if (k.event_nm) {
          uniqueCode += `_${k.event_nm}`;
        }
        codes.add(uniqueCode);
      });
    });
    return [...codes].map((code) => ({ code }));
  };

  const komponenMapping = useMemo(
    () => flattenComponentMapping(generatedData),
    [generatedData]
  );
  const flattenedData = useMemo(
    () => flattenGeneratedData(generatedData),
    [generatedData]
  );

  const isLockedData = useMemo(() => {
    if (!generatedData.length) return false;
    return generatedData.every((row) =>
      row.komponen.every((k) => k.is_locked == 1)
    );
  }, [generatedData]);

  return (
    <>
      {/* Form Filter */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Filter Penghasilan Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormPenghasilanPegawai
            employeeSts={employeeSts}
            setEmployeeSts={setEmployeeSts}
            periode={periode}
            setPeriode={setPeriode}
            handleGenerate={handleGenerate}
            isLoadingGenerate={isLoadingGenerate}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="card shadow-sm card-theme mt-3">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Generated Penghasilan Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          {isLoadingGenerate ? (
            <SkeletonTable rows={15} cols={5} responsive={true} />
          ) : generatedData.length > 0 ? (
            <DataPenghasilanGrid
              rawData={generatedData}
              data={flattenedData}
              komponenMapping={komponenMapping}
              onSave={handleSave}
              onEndroll={handleEndroll}
              isSaving={isSaving}
              isLocked={isLockedData}
            />
          ) : (
            <SkeletonTable rows={15} cols={5} animated={false} />
          )}
        </div>
      </div>
    </>
  );
};

export default PenghasilanPegawai;
