import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import { formatDateInput } from "../../../utils/FormatDate";
import {
  fetchPaginatedData,
  fetchMutasiById,
  verifyMutasi,
  validityMutasi,
} from "../../../api/wj_sdm/MutasiPegawai";
import SearchSelectPegawai from "../../../components/search/SearchSelectPegawai";
import SearchSelectUnit from "./SearchSelectUnit";
import { toast } from "react-toastify";

const FormMutasi = ({
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
      await verifyMutasi(form.id, peg_id);
      toast.success("Data berhasil diverifikasi");
      fetchData();
      const updated = await fetchMutasiById(form.id);
      setForm((prev) => ({
        ...prev, // biar field lama tetap ada kalau nggak dikirim
        ...updated,
        nama_pegawai:
          updated.nama_pegawai ||
          updated.pegawai?.nama_pegawai ||
          prev.nama_pegawai,
      }));
      loadNotificationCount();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memverifikasi data");
    }
  };
  // Fungsi untuk membatalkan verifikasi data pegawai
  const handleCancelVerification = async () => {
    if (!form.verified_by) return;

    if (form.validated_by) {
      toast.warn(
        "Data sudah divalidasi dan tidak dapat dibatalkan verifikasinya.",
      );
      return;
    }

    try {
      await verifyMutasi(form.id, null);
      toast.success("Verifikasi dibatalkan");
      fetchData();

      const updated = await fetchMutasiById(form.id);
      setForm((prev) => ({
        ...prev, // biar field lama tetap ada kalau nggak dikirim
        ...updated,
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
      await validityMutasi(form.id, peg_id);
      toast.success("Data berhasil divalidasi");
      fetchData();
      const updated = await fetchMutasiById(form.id);
      setForm(updated);
      loadNotificationCount();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memvalidasi data");
    }
  };

  const handleCancelValidity = async () => {
    /*if (form.validated_by) {
      toast.warning("Data sudah divalidasi dan tidak dapat dibatalkan.");
      return;
    }*/
    try {
      await validityMutasi(form.id, null);
      toast.success("Validasi berhasil dibatalkan");
      fetchData();
      const updated = await fetchMutasiById(form.id);
      setForm(updated);
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
          {requiredLabel("Pegawai")}
          <SearchSelectPegawai
            value={
              form.peg_id
                ? {
                    value: form.peg_id,
                    label: form.nama_pegawai || "",
                  }
                : null
            }
            onChange={(option) =>
              setForm((prev) => ({
                ...prev,
                peg_id: option?.value || "",
                nama_pegawai: option?.label || "",
              }))
            }
          />
        </div>

        {(role === "kepegawaian" || role === "admin") && (
          <>
            {/* Tanggal Mutasi */}
            <div className="col-md-6 mb-3">
              {requiredLabel("Tanggal Mutasi")}
              <input
                type="date"
                className="form-control"
                name="mutation_dt"
                value={formatDateInput(form.mutation_dt) || ""}
                onChange={handleChange}
                required
              />
            </div>

            {/* Unit */}
            <div className="col-md-6 mb-3">
              {requiredLabel("Unit Tujuan")}
              <SearchSelectUnit
                value={
                  form.unit_id
                    ? {
                        value: form.unit_id,
                        label: form.unit_nm,
                      }
                    : null
                }
                onChange={(option) =>
                  setForm((prev) => ({
                    ...prev,
                    unit_id: option?.value || "",
                    unit_nm: option?.raw?.nama || "",
                  }))
                }
              />
            </div>

            {/* Jabatan */}
            <div className="col-md-6 mb-3">
              {requiredLabel("Jabatan")}
              <input
                type="text"
                className="form-control"
                name="jabatan"
                value={form.jabatan || ""}
                onChange={handleChange}
                placeholder="Contoh: Kepala Ruangan"
                required
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-3 d-flex flex-wrap gap-2">
        {role !== "keuangan" && (
          <button type="submit" className="btn btn-primary btn-sm">
            {isEditing ? "💾 Update" : "➕ Simpan"}
          </button>
        )}

        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetForm}
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
};

export default FormMutasi;
