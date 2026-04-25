import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import {
  fetchPaginatedData,
  fetchPresensiById,
  verifyPresensi,
  validityPresensi,
} from "../../../api/wj_sdm/PresensiPegawai";
import SearchSelectPegawai from "../../../components/search/SearchSelectPegawai";
import { formatDateToPeriodeYYYYMM } from "../../../utils/FormatDate";
import { toast } from "react-toastify";

const FormPresensi = ({
  form,
  handleChange,
  handleSubmit,
  isEditing,
  resetForm,
  fetchData,
  setForm,
}) => {
  const { role, peg_id } = useContext(AuthContext);
  const [listPegawai, setListPegawai] = useState([]);
  const { notificationCount, loadNotificationCount } = useNotification();

  useEffect(() => {
    fetchPaginatedData(1, 1000)
      .then((res) => {
        setListPegawai(res.data || []);
      })
      .catch(console.error);
  }, []);

  const handleVerify = async () => {
    try {
      await verifyPresensi(form.id, peg_id);
      toast.success("Berhasil Verifikasi Presensi");
      fetchData();
      const updated = await fetchPresensiById(form.id);
      setForm((prev) => ({
        ...prev,
        ...updated,
        periode: formatDateToPeriodeYYYYMM(updated.periode),
        nama_pegawai:
          updated.nama_pegawai ||
          updated.pegawai?.nama_pegawai ||
          prev.nama_pegawai,
      }));
      loadNotificationCount();
    } catch (err) {
      console.error(err);
      toast.error("Gagal verifikasi presensi");
    }
  };

  const handleCancelVerification = async () => {
    if (!form.verified_by) return;

    if (form.validated_by) {
      toast.warn(
        "Data sudah divalidasi dan tidak dapat dibatalkan verifikasinya."
      );
      return;
    }

    try {
      await verifyPresensi(form.id, null);
      toast.success("Verifikasi dibatalkan");
      fetchData();
      const updated = await fetchPresensiById(form.id);
      setForm((prev) => ({
        ...prev,
        ...updated,
        periode: formatDateToPeriodeYYYYMM(updated.periode),
        nama_pegawai:
          updated.nama_pegawai ||
          updated.pegawai?.nama_pegawai ||
          prev.nama_pegawai,
      }));
      loadNotificationCount();
    } catch (err) {
      console.error("Batal verifikasi error:", err);
      toast.error("Gagal membatalkan verifikasi");
    }
  };

  const handleValidity = async () => {
    try {
      await validityPresensi(form.id, peg_id);
      toast.success("Data berhasil divalidasi");
      fetchData();
      const updated = await fetchPresensiById(form.id);
      setForm({
        ...updated,
        periode: formatDateToPeriodeYYYYMM(updated.periode),
      });
      loadNotificationCount();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memvalidasi data");
    }
  };

  const handleCancelValidity = async () => {
    try {
      await validityPresensi(form.id, null);
      toast.success("Validasi sukses dibatalkan");
      fetchData();
      const updated = await fetchPresensiById(form.id);
      setForm({
        ...updated,
        periode: formatDateToPeriodeYYYYMM(updated.periode),
      });
      loadNotificationCount();
    } catch (err) {
      console.error("Batal validasi error:", err);
      toast.error("Gagal membatalkan validasi");
    }
  };

  const requiredLabel = (text) => (
    <label>
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );

  return (
    <form className="form-theme" onSubmit={handleSubmit}>
      <div className="row">

        {/* Pegawai */}
        <div className="col-md-6 mb-3">
          {requiredLabel("Cari Pegawai")}
          <SearchSelectPegawai
            value={
              form.peg_id
                ? { value: form.peg_id, label: form.nama_pegawai }
                : null
            }
            onChange={(option) =>
              setForm((prev) => ({
                ...prev,
                peg_id: option?.value || "",
                nama_pegawai: option?.label || "",
              }))
            }
            isDisabled={role === "keuangan"} // 🔥 biasanya props react-select
          />
        </div>

        {/* Periode */}
        <div className="col-md-3 mb-3">
          {requiredLabel("Periode")}
          <input
            type="month"
            className="form-control form-control-sm"
            name="periode"
            value={form.periode || ""}
            onChange={handleChange}
            required
            disabled={role === "keuangan"}
          />
        </div>

        {/* Prosentase */}
        <div className="col-md-3 mb-3">
          {requiredLabel("Prosentase Alpha (%)")}
          <input
            type="number"
            className="form-control form-control-sm"
            name="prosentase_alpha"
            value={form.prosentase_alpha || ""}
            onChange={handleChange}
            placeholder="Contoh: 10"
            min={0}
            max={100}
            required
            disabled={role === "keuangan"}
          />
        </div>

        {/* Nilai */}
        <div className="col-md-6 mb-3">
          {requiredLabel("Nilai Potongan (Rp)")}
          <input
            className="form-control form-control-sm"
            name="nilai"
            type="text"
            value={form.nilai || ""}
            onChange={handleChange}
            placeholder="Contoh: 50.000"
            required
            disabled={role === "keuangan"}
          />
        </div>

      </div>

      {/* ACTION */}
      <div className="d-flex flex-wrap gap-2 mt-3">

        {role !== "keuangan" && (
          <button type="submit" className="btn btn-primary btn-sm">
            {isEditing ? "Update" : "Tambah"}
          </button>
        )}

        {isEditing && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              Batal
            </button>

            {role !== "keuangan" && !form.verified_by && (
              <button
                type="button"
                className="btn btn-info btn-sm"
                onClick={handleVerify}
              >
                Verifikasi
              </button>
            )}

            {role !== "keuangan" && form.verified_by && !form.validated_by && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleCancelVerification}
              >
                Batal Verifikasi
              </button>
            )}

            {role === "keuangan" && (
              <>
                {!form.validated_by && form.verified_by && (
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={handleValidity}
                  >
                    Validasi
                  </button>
                )}

                {form.validated_by && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleCancelValidity}
                  >
                    Batal Validasi
                  </button>
                )}
              </>
            )}
          </>
        )}

      </div>
    </form>
  );
};

export default FormPresensi;
