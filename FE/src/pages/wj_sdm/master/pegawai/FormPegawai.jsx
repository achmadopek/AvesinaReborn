import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { useNotification } from "../../../../context/NotificationContext";
import { formatDateInput } from "../../../../utils/FormatDate";
import {
  verifyPegawai,
  validityPegawai,
  fetchPaginatedData,
  fetchPegawaiById,
} from "../../../../api/wj_sdm/MasterPegawai";
import { toast } from "react-toastify";

/**
 * Catatan Penting:
 * - Pastikan context AuthContext menyediakan `role` dan `peg_id`.
 * - Fungsi fetchPaginatedData digunakan untuk cek duplikasi NIK/Nama.
 * - Fungsi verifyPegawai dipakai untuk verifikasi dan batal verifikasi data pegawai.
 * - Fungsi fetchPegawaiById dipakai untuk refresh data form setelah update.
 * - Pangkat/Golongan hanya aktif untuk status pegawai PNS dan PPPK.
 * - Komponen ini meng-handle form pegawai dengan validasi dan aksi verifikasi.
 */

// Daftar pilihan Pangkat/Golongan berdasarkan status pegawai
const pangkatOptions = {
  PNS: [
    { value: "I|I/a - Juru Muda" },
    { value: "I|I/b - Juru" },
    { value: "I|I/c - Juru Tingkat I" },
    { value: "I|I/d - Juru Utama" },
    { value: "II|II/a - Pengatur Muda" },
    { value: "II|II/b - Pengatur Muda Tk. I" },
    { value: "II|II/c - Pengatur" },
    { value: "II|II/d - Pengatur Tk. I" },
    { value: "III|III/a - Penata Muda" },
    { value: "III|III/b - Penata Muda Tk. I" },
    { value: "III|III/c - Penata" },
    { value: "III|III/d - Penata Tk. I" },
    { value: "IV|IV/a - Pembina" },
    { value: "IV|IV/b - Pembina Tk. I" },
    { value: "IV|IV/c - Pembina Utama Muda" },
    { value: "IV|IV/d - Pembina Utama Madya" },
    { value: "IV|IV/e - Pembina Utama" },
  ],
  PPPK: [
    { value: "I/P3K|Pelaksana Pemula" },
    { value: "I/P3K|Pelaksana" },
    { value: "II/P3K|Pelaksana Lanjutan" },
    { value: "II/P3K|Terampil" },
    { value: "III/P3K|Mahir" },
    { value: "III/P3K|Penyelia" },
    { value: "III/P3K|Ahli Pertama" },
    { value: "III/P3K|Ahli Muda" },
    { value: "IV/P3K|Ahli Madya" },
    { value: "IV/P3K|Ahli Utama" },
  ],
};

const PegawaiForm = ({
  form,
  handleChange,
  handleSubmit,
  isEditing,
  resetForm,
  fetchData,
  setForm,
}) => {
  const [searchMatch, setSearchMatch] = useState(null);
  const { role, peg_id } = useContext(AuthContext);
  const isPNSorPPPK =
    form.employee_sts === "PNS" || form.employee_sts === "PPPK";

  const { notificationCount, loadNotificationCount } = useNotification();

  // Label wajib isi dengan tanda bintang
  const requiredLabel = (text) => (
    <label>
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );
  const unrequiredLabel = (text) => <label>{text}</label>;

  // Fungsi untuk memverifikasi data pegawai
  const handleVerify = async () => {
    try {
      await verifyPegawai(form.id, peg_id);
      toast.success("Data berhasil diverifikasi");
      fetchData();
      loadNotificationCount();

      const updated = await fetchPegawaiById(form.id);
      setForm(updated);
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
      await verifyPegawai(form.id, null);
      toast.success("Verifikasi dibatalkan");
      fetchData();

      const updated = await fetchPegawaiById(form.id);
      setForm(updated);
      loadNotificationCount();
    } catch (err) {
      console.error("Batal verifikasi error:", err);
      toast.error("Gagal membatalkan verifikasi");
    }
  };

  const handleValidity = async () => {
    try {
      await validityPegawai(form.id, peg_id);
      toast.success("Data berhasil divalidasi");
      fetchData();
      const updated = await fetchPegawaiById(form.id);
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
      await validityPegawai(form.id, null);
      toast.success("Validasi suskes dibatalkan");
      fetchData();
      const updated = await fetchPegawaiById(form.id);
      setForm(updated);
      loadNotificationCount();
    } catch (err) {
      console.error("Batal validasi error:", err);
      toast.error("Gagal membatalkan validasi");
    }
  };

  // Reset pencarian duplikasi NIK/Nama
  const handleClearSearch = () => {
    setForm((prev) => ({
      ...prev,
      nik: "",
      employee_nm: "",
    }));
    setSearchMatch(null);
    resetForm();
  };

  // Effect untuk cek duplikasi data berdasarkan NIK/Nama
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const nik = form.nik?.trim();
      const nama = form.employee_nm?.trim();

      if (nik || nama) {
        try {
          const { data } = await fetchPaginatedData(1, 10);
          const match = data.find((item) => {
            const sameNik = nik && item.nik === nik;
            const sameNama = nama && item.employee_nm === nama;
            const notSelf = item.id !== form.id;
            return (sameNik || sameNama) && notSelf;
          });

          setSearchMatch(match || null);
        } catch (err) {
          console.error("Gagal cek data match:", err);
        }
      } else {
        setSearchMatch(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [form.nik, form.employee_nm]);

  return (
    <>
      {searchMatch && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center">
          <div>
            Data dengan NIK atau Nama ini sudah ada.
            <br />
            <strong>
              {searchMatch.nik} - {searchMatch.employee_nm}
            </strong>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary ml-3"
            onClick={handleClearSearch}
            type="button"
          >
            Clear Search
          </button>
        </div>
      )}

      <form className="form-theme" onSubmit={handleSubmit}>
        <div className="row">

          {/* NIK */}
          <div className="col-md-6 mb-3">
            {requiredLabel("ID (NIK)")}
            <input
              className="form-control form-control-sm"
              id="nik"
              name="nik"
              value={form.nik}
              onChange={handleChange}
              required
              placeholder="Masukkan NIK"
            />
          </div>

          {/* Nama */}
          <div className="col-md-6 mb-3">
            {requiredLabel("Nama Pegawai")}
            <input
              className="form-control form-control-sm"
              id="employee_nm"
              name="employee_nm"
              value={form.employee_nm}
              onChange={handleChange}
              required
            />
          </div>

          {/* Tempat lahir */}
          <div className="col-md-6 mb-3">
            <label>Tempat Lahir</label>
            <input
              className="form-control form-control-sm"
              name="place_of_birth"
              value={form.place_of_birth}
              onChange={handleChange}
            />
          </div>

          {/* Tanggal lahir */}
          <div className="col-md-6 mb-3">
            <label>Tgl Lahir</label>
            <input
              type="date"
              className="form-control form-control-sm"
              name="birth_dt"
              value={formatDateInput(form.birth_dt)}
              onChange={handleChange}
            />
          </div>

          {/* Status Pegawai */}
          <div className="col-md-4 mb-3">
            {requiredLabel("Status Pegawai")}
            <select
              className="form-control form-control-sm"
              name="employee_sts"
              value={form.employee_sts}
              onChange={handleChange}
              required
            >
              <option value="">Pilih</option>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="HONORER">HONORER</option>
              <option value="BLUD">BLUD</option>
              <option value="MOU">MOU</option>
            </select>
          </div>

          {/* Pangkat */}
          <div className="col-md-4 mb-3">
            {requiredLabel("Pangkat/Golongan")}
            <select
              className="form-control form-control-sm"
              name="pangkatGolongan"
              value={form.pangkatGolongan}
              onChange={handleChange}
              disabled={!isPNSorPPPK}
            >
              <option value="">Pilih</option>
              {(pangkatOptions[form.employee_sts] || []).map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </select>
          </div>

          {/* MKG */}
          <div className="col-md-4 mb-3">
            <label>Masa Kerja (MKG)</label>
            <input
              className="form-control form-control-sm"
              name="mkg"
              value={form.mkg}
              onChange={handleChange}
              disabled={!isPNSorPPPK}
            />
          </div>

          {/* NIP */}
          <div className="col-md-6 mb-3">
            <label>NIP</label>
            <input
              className="form-control form-control-sm"
              name="nip"
              value={form.nip}
              onChange={handleChange}
              disabled={!isPNSorPPPK}
            />
          </div>

          {/* NPWP */}
          <div className="col-md-6 mb-3">
            <label>NPWP</label>
            <input
              className="form-control form-control-sm"
              name="npwp"
              value={form.npwp}
              onChange={handleChange}
            />
          </div>

          {/* Pendidikan */}
          <div className="col-md-6 mb-3">
            {requiredLabel("Pendidikan")}
            <select
              className="form-control form-control-sm"
              name="education"
              value={form.education}
              onChange={handleChange}
            >
              <option value="">Pilih</option>
              <option value="SMA">SMA</option>
              <option value="D3">D3</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
          </div>

          {/* Job */}
          <div className="col-md-6 mb-3">
            {requiredLabel("Job Title")}
            <select
              className="form-control form-control-sm"
              name="job_sts"
              value={form.job_sts || ""}
              onChange={handleChange}
            >
              <option value="">Pilih</option>
              <option value="Dokter Umum">Dokter Umum</option>
              <option value="Dokter Spesialis">Dokter Spesialis</option>
              <option value="Tenaga Medis">Tenaga Medis</option>
            </select>
          </div>

          {/* Dokter spesialis */}
          {form.job_sts?.includes("Dokter Spesialis") && (
            <div className="col-md-6 mb-3">
              {requiredLabel("Status Dokter")}
              <select
                className="form-control form-control-sm"
                name="doctor_sts"
                value={form.doctor_sts}
                onChange={handleChange}
                required
              >
                <option value="">Pilih</option>
                <option value="Bedah">Bedah</option>
                <option value="Non Bedah">Non Bedah</option>
              </select>
            </div>
          )}

        </div>

        {/* ACTION */}
        <div className="d-flex gap-2 mt-3 flex-wrap">
          {role !== "keuangan" && (
            <button className="btn btn-primary btn-sm">
              {isEditing ? "Update" : "Tambah"}
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
    </>
  );
};

export default PegawaiForm;
