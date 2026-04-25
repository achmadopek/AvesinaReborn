import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/AuthContext";
import SkeletonTable from "../../../utils/skeletonTable";

import {
  generatePotonganPegawai,
  simpanPotonganPegawai,
  endrollPotonganPegawai,
} from "../../../api/wj_thp/PotonganPegawai";

import DataPotonganGrid from "./DataPotonganGrid";
import FormPotonganPegawai from "./FormPotonganPegawai";

/**
 * Komponen utama untuk mengelola Potongan pegawai:
 * - Menyediakan form untuk memilih status pegawai & periode
 * - Generate data berdasarkan status dan periode
 * - Menampilkan data dalam bentuk grid
 * - Menyimpan nilai yang diubah
 * - Endroll untuk mengunci data
 */

const PotonganPegawai = ({ setRightContent, defaultRightContent }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

  // Generate potongan pegawai
  const handleGenerate = async () => {
    if (!periode) {
      toast.warning("Pilih periode dahulu!");
      return;
    }

    setIsLoadingGenerate(true);
    try {
      const result = await generatePotonganPegawai(employeeSts, periode);

      // Tambahkan pengecekan apakah result adalah array
      if (!Array.isArray(result)) {
        // Jika response bukan array, berarti error atau warning dari backend
        toast.warning(result.message || "Data tidak dapat di-generate.");
        setGeneratedData([]);
        return;
      }

      if (result.length === 0) {
        toast.warning("Data belum tersedia untuk status pegawai tersebut.");
        setGeneratedData([]);
        return;
      }

      setGeneratedData(result);
    } catch (err) {
      console.error(err);
      toast.error("Gagal generate data.");
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
          potongan_id: komp.potongan_id,
          peg_id: row.peg_id,
          periode: `${periode}-01`,
          nilai: komp.nilai,
          presensi_id: row.presensi_id,
          penghasilan_pegawai_id: komp.penghasilan_pegawai_id,
          entried_by: userPegId || null,
        }))
      );

      await simpanPotonganPegawai(flattenedData);
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
      await endrollPotonganPegawai({ data: endrollData });
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
        acc[k.potongan_code] = k.nilai;
        return acc;
      }, {});
      return {
        ...item,
        ...komponenValues,
      };
    });
  };

  // Mengumpulkan daftar semua kode komponen potongan
  const flattenComponentMapping = (data) => {
    const codes = new Set();
    data.forEach((item) => {
      item.komponen?.forEach((k) => {
        if (k.potongan_code) codes.add(k.potongan_code);
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
          <h6 className="mb-0">Filter Potongan Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormPotonganPegawai
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
          <h6 className="mb-0">Generated Potongan Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          {isLoadingGenerate ? (
            <SkeletonTable rows={15} cols={5} responsive={true} />
          ) : generatedData.length > 0 ? (
            <DataPotonganGrid
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

export default PotonganPegawai;
