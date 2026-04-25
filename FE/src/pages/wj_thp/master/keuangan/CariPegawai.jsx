import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { fetchPaginatedData } from "../../../../api/wj_sdm/MasterPegawai";

/**
 * Catatan Penting:
 * - Pastikan context AuthContext menyediakan `role` dan `peg_id`.
 * - Fungsi fetchPaginatedData digunakan untuk cek duplikasi NIK/Nama.
 * - Fungsi verifyPegawai dipakai untuk verifikasi dan batal verifikasi data pegawai.
 * - Fungsi fetchPegawaiById dipakai untuk refresh data form setelah update.
 * - Pangkat/Golongan hanya aktif untuk status pegawai PNS dan PPPK.
 * - Komponen ini meng-handle form pegawai dengan validasi dan aksi verifikasi.
 */

const CariPegawai = ({
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
      <form className="form-theme" onSubmit={handleSubmit}>
        {/* NIK */}
        <div className="form-group">
          <label>Cari ID (NIK)</label>
          <input
            id="nik"
            name="nik"
            value={form.nik}
            onChange={handleChange}
            required
            placeholder="Masukkan NIK"
          />
        </div>

        {/* Nama */}
        <div className="form-group">
          <label>Cari Nama Pegawai</label>
          <input
            id="employee_nm"
            name="employee_nm"
            value={form.employee_nm}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tombol aksi */}
        <div className="form-actions">
          {isEditing && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={resetForm}
              >
                Reset
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
};

export default CariPegawai;
