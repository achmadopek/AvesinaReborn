import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import { formatDateInput } from "../../../utils/FormatDate";
import {
  verifyKegiatan,
  validityKegiatan,
  fetchKegiatanById,
} from "../../../api/wj_sdm/KegiatanPegawai";
import { toast } from "react-toastify";

import { fetchPenghasilanByJenis } from "../../../api/wj_thp/KomponenPenghasilan";
import SelectKomponen from "../../wj_thp/master/komponen_penghasilan/SelectKomponenPenghasilan";

/**
 * Komponen Form Entri Kegiatan:
 * - Field: event_nm, event_dt, location_nm
 * - Tidak menyertakan event_id (karena AUTO_INCREMENT)
 * - Tombol validasi tersedia hanya untuk role "keuangan"
 */

const FormKegiatan = ({
  form,
  handleChange,
  handleSubmit,
  isEditing,
  resetForm,
  fetchData,
  setForm,
}) => {
  const { role, peg_id } = useContext(AuthContext);
  const { notificationCount, loadNotificationCount } = useNotification();

  const handleVerify = async () => {
    try {
      await verifyKegiatan(form.id, peg_id);
      toast.success("Berhasil Verifikasi Kegiatan");
      fetchData();
      loadNotificationCount();
    } catch (err) {
      console.error(err);
      toast.error("Gagal verifikasi kegiatan");
    }

    try {
      const updated = await fetchKegiatanById(form.id);
      setForm((prev) => ({
        ...prev, // biar field lama tetap ada kalau nggak dikirim
        ...updated,
        nama_pegawai:
          updated.nama_pegawai ||
          updated.pegawai?.nama_pegawai ||
          prev.nama_pegawai,
      }));
    } catch (err) {
      console.error("Verifikasi eror: ", err);
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
      await verifyKegiatan(form.id, null);
      toast.success("Verifikasi dibatalkan");
      fetchData();
      loadNotificationCount();
    } catch (err) {
      console.error("Batal verifikasi error:", err);
      toast.error("Gagal membatalkan verifikasi");
    }

    try {
      const updated = await fetchKegiatanById(form.id);
      setForm((prev) => ({
        ...prev, // biar field lama tetap ada kalau nggak dikirim
        ...updated,
        nama_pegawai:
          updated.nama_pegawai ||
          updated.pegawai?.nama_pegawai ||
          prev.nama_pegawai,
      }));
    } catch (err) {
      console.error("Batal verifikasi error:", err);
    }
  };

  const handleValidity = async () => {
    try {
      await validityKegiatan(form.id, peg_id);
      toast.success("Data berhasil divalidasi");
      fetchData();
      const updated = await fetchKegiatanById(form.id);
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
      await validityKegiatan(form.id, null);
      toast.success("Validasi suskes dibatalkan");
      fetchData();
      const updated = await fetchKegiatanById(form.id);
      setForm(updated);
      loadNotificationCount();
    } catch (err) {
      console.error("Batal validasi error:", err);
      toast.error("Gagal membatalkan validasi");
      loadNotificationCount();
    }
  };

  // Label dengan tanda wajib (*)
  const requiredLabel = (text) => (
    <label>
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );

  const fetchKomponenOptions = async () => {
    const response = await fetchPenghasilanByJenis("kegiatan"); // Ambil semua komponen penghasilan yg jenisnya kegiatan
    return response; // langsung array komponen
  };

  return (
    <form className="form-theme" onSubmit={handleSubmit}>
      <div className="row">

        {/* Kode Kegiatan */}
        <div className="col-md-4 mb-3">
          {requiredLabel("Kode Kegiatan")}
          <input
            type="text"
            className="form-control form-control-sm"
            name="event_code"
            value={form.event_code}
            onChange={handleChange}
            placeholder="Contoh: HR-SPI, AMBULANCE"
            required
          />
        </div>

        {/* Nama Kegiatan */}
        <div className="col-md-8 mb-3">
          {requiredLabel("Nama Kegiatan")}
          <input
            type="text"
            className="form-control form-control-sm"
            name="event_nm"
            value={form.event_nm}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tanggal */}
        <div className="col-md-4 mb-3">
          {requiredLabel("Tanggal Kegiatan")}
          <input
            type="date"
            className="form-control form-control-sm"
            name="event_dt"
            value={formatDateInput(form.event_dt) || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* Komponen */}
        <div className="col-md-8 mb-3">
          {requiredLabel("Komponen Penghasilan")}
          <SelectKomponen
            id="penghasilan_id"
            name="penghasilan_id"
            value={form.penghasilan_id}
            onChange={handleChange}
            fetchOptions={fetchKomponenOptions}
          />
        </div>

        {/* Lokasi */}
        <div className="col-md-12 mb-3">
          {requiredLabel("Lokasi Kegiatan")}
          <input
            type="text"
            className="form-control form-control-sm"
            name="location_nm"
            value={form.location_nm}
            onChange={handleChange}
            placeholder="Contoh: Aula Dinas Pendidikan"
            required
          />
        </div>

      </div>

      {/* ACTION */}
      <div className="d-flex flex-wrap gap-2 mt-3">

        {role !== "keuangan" && (
          <button className="btn btn-primary btn-sm">
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

export default FormKegiatan;
