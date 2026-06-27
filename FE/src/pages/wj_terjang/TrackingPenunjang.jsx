import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  fetchTrackingPenunjangData,
  fetchTrackingPenunjangSummary,
  requestTrackingPenunjang,
} from "../../api/wj_terjang/TrackingPenunjang";

const initialForm = {
  request_type: "xray",
  patient_name: "",
  mr_code: "",
  unit_origin: "",
  physician: "",
  diagnosis: "",
  request_note: "",
  cito_sts: "N",
  specimen_1: "",
  specimen_2: "",
  problematic: "",
};

const TrackingPenunjang = ({ setRightContent = false }) => {
  const { role, peg_id } = useAuth();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tgl, setTgl] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    if (!tgl) return;

    setLoading(true);
    try {
      const [dataRes, summaryRes] = await Promise.all([
        fetchTrackingPenunjangData({ tgl, role, employee_id: peg_id }),
        fetchTrackingPenunjangSummary({ tgl }),
      ]);

      setData(dataRes.data || []);
      setSummary(summaryRes.summary || null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data WJ-TERJANG");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (setRightContent) setRightContent(true);
    const today = new Date().toISOString().split("T")[0];
    setTgl(today);
  }, [setRightContent]);

  useEffect(() => {
    if (tgl) loadData();
  }, [tgl, role, peg_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await requestTrackingPenunjang(form);
      if (res.success) {
        toast.success(res.message || "Permintaan tersimpan");
        setForm(initialForm);
        await loadData();
      } else {
        toast.error(res.message || "Gagal menyimpan permintaan");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim permintaan penunjang");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body">
          <h5 className="fw-bold mb-2">Formulir Permintaan Penunjang</h5>
          <p className="text-muted mb-3">
            Modul awal untuk pengajuan pemeriksaan radiologi dan laboratorium.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Jenis Permintaan</label>
                <select
                  className="form-select"
                  name="request_type"
                  value={form.request_type}
                  onChange={handleChange}
                >
                  <option value="xray">X-Ray</option>
                  <option value="lab">Laboratorium</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Nama Pasien</label>
                <input
                  type="text"
                  className="form-control"
                  name="patient_name"
                  value={form.patient_name}
                  onChange={handleChange}
                  placeholder="Nama pasien"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">No. MR</label>
                <input
                  type="text"
                  className="form-control"
                  name="mr_code"
                  value={form.mr_code}
                  onChange={handleChange}
                  placeholder="MR / registrasi"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Unit / Ruang</label>
                <input
                  type="text"
                  className="form-control"
                  name="unit_origin"
                  value={form.unit_origin}
                  onChange={handleChange}
                  placeholder="IGD / Rawat Inap / Poli"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Dokter Pengirim</label>
                <input
                  type="text"
                  className="form-control"
                  name="physician"
                  value={form.physician}
                  onChange={handleChange}
                  placeholder="Nama dokter"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Prioritas</label>
                <select
                  className="form-select"
                  name="cito_sts"
                  value={form.cito_sts}
                  onChange={handleChange}
                >
                  <option value="N">Reguler</option>
                  <option value="Y">Cito</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">
                  Diagnosa / Alasan Pemeriksaan
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Tuliskan indikasi pemeriksaan"
                />
              </div>

              {form.request_type === "lab" && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Spesimen 1</label>
                    <input
                      type="text"
                      className="form-control"
                      name="specimen_1"
                      value={form.specimen_1}
                      onChange={handleChange}
                      placeholder="Contoh: Darah"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Spesimen 2</label>
                    <input
                      type="text"
                      className="form-control"
                      name="specimen_2"
                      value={form.specimen_2}
                      onChange={handleChange}
                      placeholder="Contoh: Urin"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Masalah / Catatan Khusus
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      name="problematic"
                      value={form.problematic}
                      onChange={handleChange}
                      placeholder="Catatan khusus pemeriksaan lab"
                    />
                  </div>
                </>
              )}

              <div className="col-12">
                <label className="form-label">
                  Catatan / Permintaan Tambahan
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="request_note"
                  value={form.request_note}
                  onChange={handleChange}
                  placeholder="Catatan tambahan"
                />
              </div>

              <div className="col-12">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Ajukan Permintaan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <small className="text-muted">Total X-Ray</small>
                  <h4 className="mb-0">{summary?.totalXRay ?? 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <small className="text-muted">Total Lab</small>
                  <h4 className="mb-0">{summary?.totalLab ?? 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <small className="text-muted">Pending</small>
                  <h4 className="mb-0">{summary?.pending ?? 0}</h4>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Memuat...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Jenis</th>
                    <th>Pasien</th>
                    <th>Unit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        Belum ada data permintaan penunjang.
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <tr key={item.request_id || index}>
                        <td>{index + 1}</td>
                        <td>
                          {item.request_type === "xray"
                            ? "X-Ray"
                            : "Laboratorium"}
                        </td>
                        <td>{item.patient_name || "-"}</td>
                        <td>{item.unit_origin || "-"}</td>
                        <td>{item.status || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPenunjang;
