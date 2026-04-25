import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchPesertaMCU } from "../../../api/wj_mcu/DataPasienMCU";
import { saveMirrorMCU } from "../../../api/wj_mcu/MirrorMCU";
import { getToday } from "../../../utils/DateUtils";

import HasilPemeriksaan from "../data_mcu/HasilPemeriksaan";
import SaveMirrorMCU from "../mirror_mcu/FormMCU";
import HasilAkhirMCU from "../data_mcu/CetakMCU";

const PesertaMCU = () => {
  const [tgl, setTgl] = useState(getToday());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showHasil, setShowHasil] = useState(false);
  const [showSave, setShowSave] = useState(false);

  const [selectedPasien, setSelectedPasien] = useState(null);
  const [payloadMCU, setPayloadMCU] = useState(null);

  const [showPrint, setShowPrint] = useState(null);

  const navigate = useNavigate();

  const handleLoad = async () => {
    if (!tgl) {
      toast.warn("Tanggal periksa wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchPesertaMCU(tgl);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pasien MCU");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoad();
  }, []);

  const handlePilihPasien = (row) => {
    navigate(
      `/mcu/HasilPemeriksaan/${row.nrm}/${row.tgl_periksa.slice(0, 10)}?tgl_param=${tgl}`
    );
  };

  const STATUS = {
    null: { label: "BELUM", color: "secondary" },
    'DRAFT': { label: "DRAFT", color: "warning" },
    'FINAL': { label: "FINAL", color: "success" },
  };

  // EKSEKUSI SIMPAN MCU
  const [saving, setSaving] = useState(false);

  const handleSaveMCU = async () => {
    if (!payloadMCU) return;

    try {
      setSaving(true);
      await saveMirrorMCU(payloadMCU);
      toast.success("MCU berhasil disimpan");
      setShowSave(false);
      handleLoad(); // reload list
    } catch (err) {
      toast.error("Gagal menyimpan MCU");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ================= MODAL HASIL MCU ================= */}
      {showHasil && (
        <>
          <div className="modal-backdrop fade show" />

          <div className="modal fade show d-block" tabIndex="-1">
            <div
              className="modal-dialog modal-xl"
              style={{ maxWidth: "95vw" }}
            >
              <div className="modal-content" style={{ height: "90vh" }}>

                <div className="modal-header">
                  <h6 className="modal-title">Hasil Pemeriksaan MCU</h6>
                  <button
                    className="btn-close"
                    onClick={() => setShowHasil(false)}
                  />
                </div>

                <div className="modal-body p-0" style={{ overflowY: "auto" }}>
                  {selectedPasien && (
                    <HasilPemeriksaan
                      nrm={selectedPasien.nrm}
                      tgl={selectedPasien.tgl}
                      onLoaded={(payload) => setPayloadMCU(payload)}
                    />
                  )}
                </div>

                {/* FOOTER DI PARENT */}
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowHasil(false)}
                  >
                    Tutup
                  </button>

                  {payloadMCU?.header?.status_mcu === 'FINAL' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setShowHasil(false);
                        setShowPrint(true);
                      }}
                    >
                      Cetak Hasil Pemeriksaan
                    </button>
                  )}

                  {payloadMCU?.header?.status_mcu === 'DRAFT' && (
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setShowHasil(false);
                        setShowSave(true);
                      }}
                    >
                      Lanjutkan MCU
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL PDF ================= */}
      {showPrint && (
        <>
          <div className="modal-backdrop fade show" />

          <div className="modal fade show d-block modal-fullscreen">
            <div className="modal-dialog modal-fullscreen">
              <div className="modal-content">
                <div className="modal-body">
                  <HasilAkhirMCU
                    data={payloadMCU}
                    autoPrint={true}
                    onDone={() => setShowPrint(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================ MODAL SIMPAN MCU ================= */}
      {showSave && (
        <>
          <div className="modal-backdrop fade show" />

          <div className="modal fade show d-block" tabIndex="-1">
            <div
              className="modal-dialog modal-xl"
              style={{ maxWidth: "95vw" }}
            >
              <div className="modal-content">

                <div className="modal-header">
                  <h6 className="modal-title">Form MCU</h6>
                  <button
                    className="btn-close"
                    onClick={() => setShowSave(false)}
                  />
                </div>

                <div
                  className="modal-body"
                  style={{
                    maxHeight: "calc(100vh - 180px)",
                    overflowY: "auto",
                  }}
                >
                  <SaveMirrorMCU
                    payload={payloadMCU}
                    onChange={setPayloadMCU}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowSave(false)}
                  >
                    Batal
                  </button>

                  <button
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={handleSaveMCU}
                  >
                    {saving ? "Menyimpan..." : "Simpan MCU"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      <div className="card shadow-sm card-theme">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Daftar Pasien MCU</h6>
        </div>

        <div className="card-body px-3 py-3 modal-body-custom">

          {/* FILTER */}
          <div className="row g-2 mb-3 align-items-end">
            <div className="col-12 col-sm-4">
              <label className="form-label mb-1 fw-semibold">
                Tanggal Periksa
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
              />
            </div>

            <div className="col-12 col-sm-auto">
              <button
                className="btn btn-outline-primary w-100"
                onClick={handleLoad}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th>No</th>
                  <th>No. RM</th>
                  <th>NIK</th>
                  <th>Nama</th>
                  <th>Umur</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      Belum ada data
                    </td>
                  </tr>
                )}

                {data.map((row, i) => {
                  const status = STATUS[row.status_mcu == null ? null : row.status_mcu];

                  return (
                    <tr key={row.no_daftar}>
                      <td className="text-center">{i + 1}</td>
                      <td>{row.nrm}</td>
                      <td>{row.nik}</td>
                      <td className="fw-semibold">{row.nama}</td>
                      <td className="text-center">{row.umur}</td>
                      <td>{row.alamat}</td>

                      {/* STATUS */}
                      <td className="text-center">
                        <span className={`badge bg-${status.color}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="text-center">
                        {row.status_mcu == null && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handlePilihPasien(row)}
                          >
                            Proses MCU
                          </button>
                        )}

                        {row.status_mcu === 'DRAFT' && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handlePilihPasien(row)}
                          >
                            Lanjutkan Draft
                          </button>
                        )}

                        {row.status_mcu === 'FINAL' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handlePilihPasien(row)}
                          >
                            Lihat Hasil
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
};

export default PesertaMCU;
