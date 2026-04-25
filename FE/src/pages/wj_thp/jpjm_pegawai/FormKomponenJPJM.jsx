import React, { useCallback, useMemo } from "react";
import formatImportJPJM from "../../../assets/formatImportJPJM.png";
import ImportExcelPreviewJPJM from "./ImportExcelPreviewJPJM";
import LoadingOverlay from "../../../components/LoadingOverlay";

const FormKomponenJPJM = ({
  form,
  isMobile,
  handleChange,
  handleSubmit,
  resetForm,
  setForm,
  importedData,
  setImportedData,
  setSelectedSheet,
  loading,
}) => {
  // Label wajib dengan tanda bintang merah
  const RequiredLabel = ({ text }) => (
    <label className="fw-bold">
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );

  // Handler checkbox employee status
  const handleEmployeeStsChange = useCallback(
    (e) => {
      const { value, checked } = e.target;
      setForm((prev) => {
        const updated = checked
          ? [...(prev.employee_sts || []), value]
          : (prev.employee_sts || []).filter((v) => v !== value);
        return { ...prev, employee_sts: updated };
      });
    },
    [setForm]
  );

  // Hasil import dari komponen anak
  const handleExcelImport = useCallback(
    (rows, jpType) => {
      setImportedData(rows);
      setForm((prev) => ({ ...prev, jp_type: jpType }));
    },
    [setImportedData, setForm]
  );

  // Disabled jika belum lengkap
  const isSaveDisabled = useMemo(
    () =>
      loading ||
      !form.periode ||
      (form.employee_sts?.length ?? 0) === 0 ||
      !importedData?.length,
    [loading, form.periode, form.employee_sts, importedData]
  );

  return (
    <form className="form-theme" onSubmit={handleSubmit}>
      {/* === Jenis Pegawai === */}
      <div className="form-group mb-3">
        <RequiredLabel text="Jenis Pegawai" />

        <div
          className="mt-2 p-3 border rounded position-relative"
          style={{ borderColor: "lightgrey" }}
        >
          <span
            className="position-absolute"
            style={{
              top: "-12px",
              left: "16px",
              background: "white",
              fontSize: "10pt",
              padding: "0 8px",
            }}
          >
            Pilih Jenis Pegawai
          </span>

          <div className="mt-2 ms-2">
            {["PNS", "PPPK", "HONORER", "BLUD", "MOU"].map((status) => (
              <label
                key={status}
                className="d-inline-block me-3 mb-0"
                style={{ marginRight: isMobile ? "0" : "20px" }}
              >
                <input
                  type="checkbox"
                  name="employee_sts"
                  value={status}
                  checked={form.employee_sts?.includes(status) || false}
                  onChange={handleEmployeeStsChange}
                />{" "}
                {status}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* === Input Periode === */}
      <div className="form-group mb-3">
        <RequiredLabel text="Periode" />
        <input
          id="periode"
          name="periode"
          type="month"
          className="form-control form-control-sm"
          value={form.periode || ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* === Petunjuk Format Excel === */}
      {form.employee_sts?.length > 0 && (
        <div
          className="border rounded p-3 my-3 position-relative"
          style={{ borderColor: "lightgrey" }}
        >
          <span
            className="position-absolute"
            style={{
              top: "-12px",
              left: "16px",
              background: "white",
              fontSize: "10pt",
              padding: "0 8px",
            }}
          >
            Kolom Excel untuk Komponen JPJM & Potongan (*kode komponen wajib
            sama & lengkap)
          </span>
          <img
            src={formatImportJPJM}
            alt="Format Import JPJM"
            width="100%"
            className="mt-2"
          />
        </div>
      )}

      {/* === Upload + Preview Excel === */}
      <ImportExcelPreviewJPJM
        employeeSts={form.employee_sts}
        onDataImported={handleExcelImport}
        onSheetSelected={setSelectedSheet}
      />

      {/* === Tombol Aksi === */}
      <div className="form-actions mt-3 d-flex gap-2">
        <button
          type="submit"
          disabled={isSaveDisabled}
          className={`btn btn-sm ${loading ? "btn-outline-secondary" : "btn-outline-primary"
            }`}
        >
          {loading ? "Loading..." : "Save Imported"}
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-warning"
          onClick={resetForm}
        >
          Reset
        </button>
      </div>

      <LoadingOverlay show={loading} message="Menyimpan data..." />
    </form>
  );
};

export default FormKomponenJPJM;
