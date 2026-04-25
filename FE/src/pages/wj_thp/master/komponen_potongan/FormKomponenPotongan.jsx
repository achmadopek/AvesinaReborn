import { fetchPaginatedData } from "../../../../api/wj_thp/KomponenPenghasilan";
import SelectKomponen from "../komponen_penghasilan/SelectKomponenPenghasilan";

/**
 * Catatan Penting:
 * - Pastikan context AuthContext menyediakan `role` dan `peg_id`.
 * - Fungsi fetchPaginatedData digunakan untuk cek duplikasi NIK/Nama.
 * - Fungsi verifyPegawai dipakai untuk verifikasi dan batal verifikasi data pegawai.
 * - Fungsi fetchPegawaiById dipakai untuk refresh data form setelah update.
 * - Pangkat/Golongan hanya aktif untuk status pegawai PNS dan PPPK.
 * - Komponen ini meng-handle form pegawai dengan validasi dan aksi verifikasi.
 */

const FormKomponenPotongan = ({
  form,
  handleChange,
  handleSubmit,
  isEditing,
  resetForm,
  fetchData,
  setForm,
}) => {
  // Label wajib isi dengan tanda bintang
  const requiredLabel = (text) => (
    <label>
      {text}
      <span style={{ color: "red" }}> *</span>
    </label>
  );
  const unrequiredLabel = (text) => <label>{text}</label>;

  const isJenisDipilih =
    form.jenis === "tetap" ||
    form.jenis === "presensi" ||
    form.jenis === "gaji";

  const fetchKomponenOptions = async () => {
    const jenis = "kegiatan";
    const response = await fetchPaginatedData(1, 1000); // Ambil semua jenis kegaitan
    return response.data; // hanya array-nya saja
  };

  return (
    <>
      <form className="form-theme" onSubmit={handleSubmit}>
        {/* Jenis Komponen */}
        <div className="form-group">
          {requiredLabel("Jenis Komponen")}
          <label style={{ display: "block", marginTop: "1px" }}>
            <input
              type="radio"
              name="jenis"
              value="gaji"
              checked={form.jenis === "gaji"}
              onChange={handleChange}
            />{" "}
            Pot. Komponen Gaji
          </label>
          <label style={{ display: "block", marginTop: "1px" }}>
            <input
              type="radio"
              name="jenis"
              value="tetap"
              checked={form.jenis === "tetap"}
              onChange={handleChange}
            />{" "}
            Pot. Komponen Tetap
          </label>
          <label style={{ display: "block", marginTop: "1px" }}>
            <input
              type="radio"
              name="jenis"
              value="presensi"
              checked={form.jenis === "presensi"}
              onChange={handleChange}
            />{" "}
            Pot. Presensi/Kegiatan
          </label>
        </div>

        {/* Komponen Code */}
        <div className="form-group">
          {requiredLabel("Kode Komponen")}
          <input
            id="potongan_code"
            name="potongan_code"
            value={form.potongan_code}
            onChange={handleChange}
            required
            placeholder="Contoh: BPJS, PPH21, PPN, dll"
            disabled={!isJenisDipilih}
          />
        </div>

        {/* Nama */}
        <div className="form-group">
          {requiredLabel("Nama Komponen")}
          <input
            id="potongan_nm"
            name="potongan_nm"
            value={form.potongan_nm}
            onChange={handleChange}
            required
            disabled={!isJenisDipilih}
          />
        </div>

        <div className="form-group">
          {requiredLabel("Berlaku Untuk")}
          <div>
            {["PNS", "PPPK", "HONORER", "BLUD", "MOU"].map((status) => (
              <label
                key={status}
                style={{ display: "block", marginBottom: "4px" }}
              >
                <input
                  type="checkbox"
                  name="employee_sts"
                  value={status}
                  checked={form.employee_sts?.includes(status) || false}
                  onChange={handleChange}
                  disabled={!isJenisDipilih}
                />{" "}
                {status}
              </label>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            border: "1px solid lightgrey",
            borderRadius: "2px",
            padding: "16px",
            margin: "20px 0",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "-12px",
              left: "16px",
              backgroundColor: "white",
              fontSize: "10pt",
              padding: "0 8px",
            }}
          >
            Kriteria Spesifik (kosongi jika berlaku umum)
          </span>

          {/* Golongan untuk PNS/PPPK */}
          {form.employee_sts?.includes("PNS") ||
          form.employee_sts?.includes("PPPK") ? (
            <div className="form-group">
              {unrequiredLabel("Golongan")}
              <select
                id="golongan"
                name="golongan"
                value={form.golongan}
                onChange={handleChange}
                disabled={!isJenisDipilih}
              >
                <option value="">Pilih Golongan</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="I/P3K">I/P3K</option>
                <option value="II/P3K">II/P3K</option>
                <option value="III/P3K">III/P3K</option>
                <option value="IV/P3K">IV/P3K</option>
              </select>
            </div>
          ) : null}

          {/* Pendidikan untuk HONORER/BLUD/MOU */}
          {form.employee_sts?.some((sts) =>
            ["HONORER", "BLUD", "MOU"].includes(sts)
          ) && (
            <div className="form-group">
              {unrequiredLabel("Pendidikan Terakhir")}
              <select
                id="education"
                name="education"
                value={form.education}
                onChange={handleChange}
                disabled={!isJenisDipilih}
              >
                <option value="">Pilih</option>
                <option value="SD">SD</option>
                <option value="SLTP">SLTP</option>
                <option value="SLTA">SLTA</option>
                <option value="D1-Medis">D1 Medis</option>
                <option value="D2-Medis">D2 Medis</option>
                <option value="D3-Medis">D3 Medis</option>
                <option value="D4-Medis">D4 Medis</option>
                <option value="S1-Medis">S1 Medis</option>
                <option value="S2-Medis">S2 Medis</option>
                <option value="S3-Medis">S3 Medis</option>
                <option value="D1-Umum">D1 Umum</option>
                <option value="D2-Umum">D2 Umum</option>
                <option value="D3-Umum">D3 Umum</option>
                <option value="D4-Umum">D4 Umum</option>
                <option value="S1-Umum">S1 Umum</option>
                <option value="S2-Umum">S2 Umum</option>
                <option value="S3-Umum">S3 Umum</option>
                <option value="Tenakun">Tenakun</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          )}
        </div>

        {/* Komponen Potongan dari penghasilan */}
        <SelectKomponen
          label={requiredLabel("Potongan Dari")}
          id="penghasilan_id"
          name="penghasilan_id"
          value={form.penghasilan_id}
          onChange={handleChange}
          fetchOptions={fetchKomponenOptions}
          disabled={!isJenisDipilih}
        />

        {/* Satuan data */}
        <div className="form-group">
          {requiredLabel("Satuan Nilai")}
          <select
            id="satuan"
            name="satuan"
            value={form.satuan}
            onChange={handleChange}
            required
            disabled={!isJenisDipilih}
          >
            <option value="">Pilih Satuan</option>
            <option value="rupiah">Rupiah (Rp.)</option>
            <option value="persen">Persen (%)</option>
          </select>
        </div>

        {/* Nama */}
        <div className="form-group">
          {unrequiredLabel("Nilai Default")}
          <input
            id="default_nilai"
            name="default_nilai"
            value={form.default_nilai}
            onChange={handleChange}
            required
            disabled={!isJenisDipilih}
          />
        </div>

        {/* Tombol aksi */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-sm btn-outline-primary"
            disabled={!isJenisDipilih}
          >
            {isEditing ? "Update" : "Tambah"}
          </button>

          {isEditing && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={resetForm}
              >
                Batal
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
};

export default FormKomponenPotongan;
