import formatImport from "../../../assets/format-import1.png";
import formatImport2 from "../../../assets/format-import2.png";
import ImportExcelPreviewASN from "./ImportExcelPreviewASN";
import ImportExcelPreviewNonASN from "./ImportExcelPreviewNonASN";

import LoadingOverlay from "../../../components/LoadingOverlay";

const FormKomponenGaji = ({
  form,
  isMobile,
  handleChange,
  handleSubmit,
  resetForm,
  setForm,
  importedData,
  loading,
  setImportedData,
}) => {
  const requiredLabel = (text) => (
    <label className="fw-bold">
      {text} <span style={{ color: "red" }}>*</span>
    </label>
  );

  // kondisi tombol save
  const isSaveDisabled =
    loading ||
    !form.periode ||
    !form.employee_group ||
    form.employee_sts?.length === 0 ||
    !importedData;

  return (
    <form className="form-theme" onSubmit={handleSubmit}>
      {/* Pilih Jenis Pegawai */}
      <div className="form-group mb-3">
        {requiredLabel("Jenis Pegawai")}

        <div
          style={{
            position: "relative",
            border: "1px solid lightgrey",
            borderRadius: "4px",
            padding: "16px",
            marginTop: "10px",
            width: "100%",
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
            {/* Radio ASN / Non ASN */}
            <div>
              {["ASN", "Non ASN"].map((jenis) => (
                <label
                  key={jenis}
                  className={isMobile ? "d-block" : "d-inline-block"}
                  style={{ marginRight: isMobile ? "0px" : "20px" }}
                >
                  <input
                    type="radio"
                    name="employee_group"
                    value={jenis}
                    checked={form.employee_group === jenis}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        employee_group: e.target.value,
                        employee_sts: [], // reset sub pilihan tiap ganti group
                        importedData: null,
                      });
                      setImportedData(null);
                    }}
                  />{" "}
                  {jenis}
                </label>
              ))}
            </div>
          </span>

          {/* Sub-radio sesuai pilihan */}
          {form.employee_group === "ASN" && (
            <div className="mt-2 ms-3">
              {["PNS", "PPPK"].map((status) => (
                <label
                  key={status}
                  className={isMobile ? "d-block" : "d-inline-block"}
                  style={{
                    marginRight: isMobile ? "0px" : "20px",
                    marginBottom: "0px",
                  }}
                >
                  <input
                    type="checkbox"
                    name="employee_sts"
                    value={status}
                    checked={form.employee_sts?.includes(status) || false}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      const updated = checked
                        ? [...(form.employee_sts || []), value]
                        : (form.employee_sts || []).filter((v) => v !== value);
                      setForm({ ...form, employee_sts: updated });
                    }}
                  />{" "}
                  {status}
                </label>
              ))}
            </div>
          )}

          {form.employee_group === "Non ASN" && (
            <div className="mt-2 ms-3">
              {["HONORER", "BLUD", "MOU"].map((status) => (
                <label
                  key={status}
                  className="d-inline-block"
                  style={{
                    marginRight: isMobile ? "0px" : "20px",
                    marginBottom: "0px",
                  }}
                >
                  <input
                    type="checkbox"
                    name="employee_sts"
                    value={status}
                    checked={form.employee_sts?.includes(status) || false}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      const updated = checked
                        ? [...(form.employee_sts || []), value] // tambah ke array
                        : (form.employee_sts || []).filter((v) => v !== value); // hapus dari array
                      setForm({ ...form, employee_sts: updated });
                    }}
                  />{" "}
                  {status}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Periode */}
      <div className="form-group mb-3">
        {requiredLabel("Periode")}
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

      {/* Format Import Excel */}
      {form.employee_group && (
        <div
          style={{
            position: "relative",
            border: "1px solid lightgrey",
            borderRadius: "4px",
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
            Kolom Excel untuk Komponen Gaji & Potongan (*kode komponen wajib
            sama & lengkap)
          </span>

          <img
            src={form.employee_group === "ASN" ? formatImport : formatImport2}
            alt="Format Import Gaji"
            width="100%"
            className="m-1"
          />
        </div>
      )}

      {/* Upload + Preview Excel */}
      <div>
        {form.employee_group === "ASN" ? (
          <ImportExcelPreviewASN
            employeeSts={form.employee_sts}
            onDataImported={(data) => {
              setForm((prev) => ({ ...prev, importedData: data }));
              setImportedData(data);
            }}
          />
        ) : form.employee_group === "Non ASN" ? (
          <ImportExcelPreviewNonASN
            employeeSts={form.employee_sts}
            onDataImported={(data) => {
              setForm((prev) => ({ ...prev, importedData: data }));
              setImportedData(data);
            }}
          />
        ) : null}
      </div>

      {/* Tombol Aksi */}
      <div className="form-actions mt-3">
        <button
          type="submit"
          onClick={handleSubmit}
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

        <LoadingOverlay show={loading} message="Menyimpan data..." />
      </div>
    </form>
  );
};

export default FormKomponenGaji;
