import { useEffect } from "react";
import SearchSelectUnit from "../../../wj_sdm/mutasi/SearchSelectUnit";

const FormKomponenPenghasilan = ({
  form,
  handleChange,
  handleSubmit,
  isEditing,
  resetForm,
  setForm,
}) => {
  const requiredLabel = (text) => (
    <label>
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );
  const unrequiredLabel = (text) => <label>{text}</label>;

  const isJenisDipilih =
    form.jenis === "tetap" ||
    form.jenis === "kegiatan" ||
    form.jenis === "gaji";

  // Reset otomatis field yang tidak relevan
  useEffect(() => {
    if (
      form.employee_sts?.includes("PNS") ||
      form.employee_sts?.includes("PPPK")
    ) {
      setForm((prev) => ({ ...prev, education: "" }));
    } else if (
      form.employee_sts?.some((sts) => ["HONORER", "BLUD", "MOU"].includes(sts))
    ) {
      setForm((prev) => ({ ...prev, golongan: "" }));
    }
  }, [form.employee_sts, setForm]);

  // Otomatis set nilai default ke 0 jika jenis === kegiatan
  useEffect(() => {
    if (form.jenis === "kegiatan" || form.jenis === "gaji") {
      setForm((prev) => ({ ...prev, default_nilai: 0 }));
    }
  }, [form.jenis, setForm]);

  // Handle checkbox employee_sts
  const handleStatusChange = (e) => {
    const { value, checked } = e.target;
    const updated = checked
      ? [...(form.employee_sts || []), value]
      : (form.employee_sts || []).filter((v) => v !== value);
    setForm({ ...form, employee_sts: updated });
  };

  return (
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
          Komponen Gaji
        </label>
        <label style={{ display: "block", marginTop: "1px" }}>
          <input
            type="radio"
            name="jenis"
            value="tetap"
            checked={form.jenis === "tetap"}
            onChange={handleChange}
          />{" "}
          Komponen Tetap
        </label>
        <label style={{ display: "block", marginTop: "1px" }}>
          <input
            type="radio"
            name="jenis"
            value="kegiatan"
            checked={form.jenis === "kegiatan"}
            onChange={handleChange}
          />{" "}
          Komponen Honor
        </label>
      </div>

      {/* Kode Komponen */}
      <div className="form-group">
        {requiredLabel("Kode Komponen")}
        <input
          id="penghasilan_code"
          name="penghasilan_code"
          value={form.penghasilan_code}
          onChange={handleChange}
          required
          placeholder="Contoh: JP-UMUM, JP-JKN, HONOR-SENAM, DLL"
          disabled={!isJenisDipilih}
        />
      </div>

      {/* Nama Komponen */}
      <div className="form-group">
        {requiredLabel("Nama Komponen")}
        <input
          id="penghasilan_nm"
          name="penghasilan_nm"
          value={form.penghasilan_nm}
          onChange={handleChange}
          required
          disabled={!isJenisDipilih}
        />
      </div>

      {/* Berlaku Untuk */}
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
                onChange={handleStatusChange}
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

        {/* Golongan */}
        {(form.employee_sts?.includes("PNS") ||
          form.employee_sts?.includes("PPPK")) && (
          <div className="form-group">
            {unrequiredLabel("Golongan")}
            <select
              id="golongan"
              name="golongan"
              value={form.golongan || ""}
              onChange={handleChange}
              disabled={!isJenisDipilih}
            >
              <option value="">Semua</option>
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
        )}

        {/* Pendidikan */}
        <div className="form-group">
          {unrequiredLabel("Pendidikan Terakhir")}
          <select
            id="education"
            name="education"
            value={form.education || ""}
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

        {/* Job Status */}
        <div className="form-group">
          {unrequiredLabel("Job Tittle")}
          <select
            id="job_sts"
            name="job_sts"
            value={form.job_sts || ""}
            onChange={handleChange}
            disabled={!isJenisDipilih}
          >
            <option value="">Semua</option>
            <option value="Dokter Umum">Dokter Umum</option>
            <option value="Dokter Spesialis">Dokter Spesialis</option>
            <option value="Tenaga Medis">Tenaga Medis</option>
            <option value="Tenaga Non Medis">Tenaga Non Medis</option>
            <option value="Manajemen">Manajemen</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Nama Unit */}
        <div className="form-group">
          {unrequiredLabel("Nama Unit")}
          <SearchSelectUnit
            value={
              form.unit_id ? { value: form.unit_id, label: form.unit_nm } : null
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
      </div>

      {/* Nilai Default */}
      <div className="form-group">
        {requiredLabel("Nilai Default")}
        <input
          id="default_nilai"
          name="default_nilai"
          type="text"
          value={form.default_nilai || null}
          onChange={handleChange}
          required
          disabled={!isJenisDipilih}
        />
      </div>

      {/* Tombol Aksi */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-sm btn-outline-primary"
          disabled={!isJenisDipilih}
        >
          {isEditing ? "Update" : "Tambah"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={resetForm}
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
};

export default FormKomponenPenghasilan;
