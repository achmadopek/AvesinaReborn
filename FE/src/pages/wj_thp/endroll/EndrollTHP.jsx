import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/AuthContext";
import SkeletonTable from "../../../utils/skeletonTable";

import {
  generateTHP,
  simpanTHP,
  endrollTHP,
} from "../../../api/wj_thp/EndrollTHP";

import DataEndrollGrid from "./DataEndrollGrid";
import FormEndrollTHP from "./FormEndrollTHP";

const EndrollTHP = ({ setRightContent, defaultRightContent }) => {
  const { peg_id: userPegId } = useAuth();

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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // === Generate data THP ===
  const handleGenerate = async () => {
    if (!periode) {
      toast.warning("Periode belum diisi...");
      return;
    }

    setIsLoadingGenerate(true);
    try {
      const result = await generateTHP(employeeSts, periode);

      if (!Array.isArray(result)) {
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

  // === Simpan draft (kalau memang mau simpan hasil generate) ===
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await simpanTHP(
        generatedData.map((row) => ({
          peg_id: row.peg_id,
          periode: row.periode,
          total_penghasilan: row.total_penghasilan,
          total_potongan: row.total_potongan,
          thp: row.thp,
          entried_by: userPegId || null,
        }))
      );
      toast.success("Draft berhasil disimpan.");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // === Endroll (lock) ===
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
      await endrollTHP(
        generatedData.map(({ peg_id }) => ({
          peg_id,
          periode,
        }))
      );
      toast.success("Data berhasil dikunci.");
      handleGenerate(); // reload data
    } catch (err) {
      console.error(err);
      toast.error("Gagal endroll.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLockedData =
    generatedData.length > 0 &&
    generatedData.every((row) => row.is_locked === 1);

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Filter Take Home Pay</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormEndrollTHP
            employeeSts={employeeSts}
            setEmployeeSts={setEmployeeSts}
            periode={periode}
            setPeriode={setPeriode}
            handleGenerate={handleGenerate}
            isLoadingGenerate={isLoadingGenerate}
          />
        </div>
      </div>

      <div className="card shadow-sm card-theme mt-3">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Generated Take Home Pay</h6>
        </div>
        <div className="card-body px-3 py-2">
          {isLoadingGenerate ? (
            <SkeletonTable rows={15} cols={5} responsive={true} />
          ) : generatedData.length > 0 ? (
            <DataEndrollGrid
              data={generatedData}
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

export default EndrollTHP;
