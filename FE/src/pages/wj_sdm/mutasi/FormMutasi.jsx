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
        "Data sudah divalidasi dan tidak dapat dibatalkan verifikasinya."
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
      {/* Pegawai */}
      <div className="form-group">
        {requiredLabel("Cari Pegawai")}
        <SearchSelectPegawai
          value={
            form.peg_id
              ? { value: form.peg_id, label: form.nama_pegawai || "" }
              : null
          }
          onChange={(option) =>
            setForm((prev) => ({
              ...prev,
              peg_id: option?.value || "",
              nama_pegawai: option?.label || "", // simpan nama pegawai
            }))
          }
        />
      </div>

      {role === "kepegawaian" && (
        <>
          {/* Tanggal Mutasi */}
          <div className="form-group">
            {requiredLabel("Tanggal Mutasi")}
            <input
              type="date"
              name="mutation_dt"
              value={formatDateInput(form.mutation_dt) || ""}
              onChange={handleChange}
              required
            />
          </div>

          {/* Nama Unit */}
          <div className="form-group">
            {requiredLabel("Nama Unit")}
            <SearchSelectUnit
              value={
                form.unit_id
                  ? { value: form.unit_id, label: form.unit_nm }
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
          <div className="form-group">
            {requiredLabel("Jabatan")}
            <input
              type="text"
              name="jabatan"
              value={form.jabatan || ""}
              onChange={handleChange}
              placeholder="Contoh: Kepala Bagian"
              required
            />
          </div>
        </>
      )}

      {/* Tombol Aksi */}
      <div className="form-actions mt-3">
        {role !== "keuangan" && (
          <button type="submit" className="btn btn-sm btn-outline-primary me-2">
            {isEditing ? "Update" : "Tambah"}
          </button>
        )}

        {isEditing && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={resetForm}
            >
              Batal
            </button>

            {role !== "keuangan" && !form.verified_by && (
              <button
                type="button"
                className="btn btn-sm btn-outline-info me-2"
                onClick={handleVerify}
              >
                Verifikasi
              </button>
            )}

            {role !== "keuangan" && form.verified_by && !form.validated_by && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
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
                    className="btn btn-sm btn-outline-warning me-2"
                    onClick={handleValidity}
                  >
                    Validasi
                  </button>
                )}

                {form.validated_by && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
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

export default FormMutasi;
