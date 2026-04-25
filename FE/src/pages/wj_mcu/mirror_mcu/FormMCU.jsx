import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchHasilPemeriksaan } from "../../../api/wj_mcu/DataMCU";
import { saveMirrorMCU } from "../../../api/wj_mcu/MirrorMCU";
import { fetchMirrorMCUById } from "../../../api/wj_mcu/MirrorMCU";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";

const FormMCU = () => {
  const { nrm, tgl } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [isAvailable, setIsAvailable] = useState(false);

  const { role } = useAuth();

  const isUser = role === "user_mcu";
  const isDokter = role === "dokter_mcu";
  const isApprover = role === "approver_mcu";

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchHasilPemeriksaan(nrm, tgl);
        if (!res?.success || !res.data) return;

        let finalData;

        if (res.data.header?.mcu_id) {
          const mirror = await fetchMirrorMCUById(res.data.header.mcu_id);
          if (mirror?.success) {
            finalData = mirror.data;
            setIsAvailable(true);
          }
        }

        if (!finalData) {
          finalData = {
            header: res.data.header || {},
            visits: res.data.visits || []
          };
        }

        setData(finalData);

      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [nrm, tgl]);

  /* ================= SAVE ================= */
  const handleSaveDraft = async () => {
    if (!header.nomor_surat) {
      toast.warning("Nomor surat wajib diisi");
      return false;
    }

    try {
      const res = await saveMirrorMCU({
        header: { ...data.header, status_mcu: 'DRAFT' },
        visits: data.visits,
      });

      toast.success("Data MCU berhasil disimpan (DRAFT)");

      setSaving(true);

      setIsAvailable(true);

      reloadFromDB(res.mcu_id);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan MCU");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (isFinal) return;

    if (!header.nomor_surat) {
      toast.warning("Nomor surat wajib diisi sebelum finalisasi");
      return false;
    }

    const result = await Swal.fire({
      title: "⚠️ Konfirmasi Finalisasi",
      text: "Setelah difinalisasi, data MCU tidak dapat diubah kembali.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Finalisasi Sekarang",
      cancelButtonText: "Batalkan",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (!result.isConfirmed) return;

    try {
      setFinalizing(true);

      const res = await saveMirrorMCU({
        header: { ...data.header, status_mcu: 'FINAL' },
        visits: data.visits,
      });

      toast.success("MCU berhasil difinalisasi");

      setIsAvailable(true);

      await reloadFromDB(res.mcu_id);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Gagal finalisasi MCU");
    } finally {
      setFinalizing(false);
    }
  };

  if (!data) return <div>Loading...</div>;

  const { header, visits } = data;

  const allowedStatus = ["DRAFT", "FINAL", "CETAK", "BATAL"];

  const statusMCU = allowedStatus.includes(header?.status_mcu)
    ? header.status_mcu
    : "BELUM_DIPROSES";

  const isFinal = statusMCU === "FINAL";
  const isCetak = statusMCU === "CETAK";
  const isBatal = statusMCU === "BATAL";

  const isLocked = isFinal || isCetak || isBatal || finalizing;

  const canEditHeader = !isLocked && isUser;
  const canEditVisit = !isLocked && isDokter && isAvailable;
  const canEditFinal = !isLocked && isApprover && isAvailable;

  /* =============== RELOAD DATA DR MIRRO ============ */
  const reloadFromDB = async (mcuId) => {
    try {
      const res = await fetchMirrorMCUById(mcuId);
      if (res?.success) {
        setData({
          header: res.data.header,
          visits: res.data.visits,
        });
      }
    } catch (err) {
      console.error("reloadFromDB:", err);
      toast.error("Gagal memuat ulang data MCU");
    }
  };

  /* ================= HANDLERS ================= */
  const handleHeaderChange = (field, value) => {
    setData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value,
      },
    }));
  };

  const handleAnamnesisChange = (visitIdx, anamIdx, value) => {
    setData(prev => {
      const visits = prev.visits.map((v, i) => {
        if (i !== visitIdx) return v;

        const anamnesa = Array.isArray(v.anamnesa) ? [...v.anamnesa] : [];

        // jika belum ada item → buat baru
        if (!anamnesa[anamIdx]) {
          anamnesa.push({ master: value });
        } else {
          anamnesa[anamIdx] = {
            ...anamnesa[anamIdx],
            master: value,
          };
        }

        return { ...v, anamnesa };
      });

      return { ...prev, visits };
    });
  };

  const handleDiagnosaChange = (visitIdx, diagIdx, value) => {
    setData(prev => {
      const visits = prev.visits.map((v, i) => {
        if (i !== visitIdx) return v;

        const diagnosa = Array.isArray(v.diagnosa) ? [...v.diagnosa] : [];

        if (!diagnosa[diagIdx]) {
          diagnosa.push({ detail: value });
        } else {
          diagnosa[diagIdx] = {
            ...diagnosa[diagIdx],
            detail: value,
          };
        }

        return { ...v, diagnosa };
      });

      return { ...prev, visits };
    });
  };

  const handleVisitFieldChange = (visitIdx, field, value) => {
    setData(prev => {
      const visits = prev.visits.map((v, i) =>
        i !== visitIdx ? v : { ...v, [field]: value }
      );
      return { ...prev, visits };
    });
  };

  const previewNomorSurat = () => {
    if (!header.nomor_surat || !header.format_nomor) return "";
    return header.format_nomor
      .replace(/{nomor}/g, header.nomor_surat)
      .replace(/{tahun}/g, new Date().getFullYear());
  };

  const isEmptyLabItem = (item) =>
    !item.result &&
    !item.unit &&
    !item.normal;

  const statusColors = {
    FINAL: "bg-danger",
    DRAFT: "bg-warning text-dark",
    CETAK: "bg-primary",
    BATAL: "bg-dark",
    BELUM_DIPROSES: "bg-secondary"
  };

  const canSaveDraft = (isUser && !isAvailable) || ((isUser || isDokter) && isAvailable);

  const canFinalize = isApprover && isAvailable;

  console.log("==== MCU DEBUG ====");
  console.log("role:", role);
  console.log("isUser:", isUser);
  console.log("isDokter:", isDokter);
  console.log("isAvailable:", isAvailable);
  console.log("statusMCU:", statusMCU);
  console.log("canSaveDraft:", canSaveDraft);
  console.log("saving:", saving);
  console.log("finalizing:", finalizing);

  /* ================= RENDER ================= */

  return (
    <>
      {/* ===== STATUS ===== */}
      <div className="mb-3">
        <span className={`badge ${statusColors[statusMCU]}`}>
          {statusMCU === "BELUM_DIPROSES" ? "BELUM DIPROSES" : statusMCU}
        </span>
      </div>

      {/* ================= DATA PASIEN ================= */}
      <div className="card mb-3">
        <div className="card-header">Data Pasien</div>
        <div className="card-body row g-2">
          <div className="col-md-4">
            <label>Nama</label>
            <input
              className="form-control form-control-sm"
              value={header.nama || ""}
              disabled={!canEditHeader}
              onChange={e => handleHeaderChange("nama", e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label>Umur</label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={header.umur || ""}
              disabled={!canEditHeader}
              onChange={e => handleHeaderChange("umur", e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label>Alamat</label>
            <input
              className="form-control form-control-sm"
              value={header.alamat || ""}
              disabled={!canEditHeader}
              onChange={e => handleHeaderChange("alamat", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ================= DOKUMEN ================= */}
      <div className="card mb-3">
        <div className="card-header">Dokumen / Surat</div>
        <div className="card-body row g-2">

          <div className="col-md-2">
            <label className="fw-semibold">Nomor Surat</label>
            <input
              className="form-control form-control-sm"
              value={header.nomor_surat || "DRAFT"}
              disabled={!canEditHeader}
              onChange={e => {
                const nomor = e.target.value;
                setData(prev => ({
                  ...prev,
                  header: {
                    ...prev.header,
                    nomor_surat: nomor,
                    // JANGAN generate final di sini
                    format_nomor:
                      prev.header.format_nomor ||
                      "404/{nomor}/426.102.35/{tahun}",
                  },
                }));
              }}
            />
          </div>

          <div className="col-md-6">
            <label className="fw-semibold">Format Nomor Surat</label>
            <input
              className="form-control form-control-sm"
              value={header.format_nomor || ""}
              disabled={!canEditHeader}
              placeholder="404/{nomor}/426.102.35/{tahun}"
              onChange={e =>
                handleHeaderChange("format_nomor", e.target.value)
              }
            />
            <div className="form-text">
              Gunakan <code>{"{nomor}"}</code> dan <code>{"{tahun}"}</code>
            </div>
          </div>

          <div className="col-md-4 text-md-end">
            <div className="mt-1 text-muted">
              Preview nomor surat: <strong>{previewNomorSurat()}</strong>
            </div>
            <div className="form-text">
              jangan Hapus <code>{"{nomor}"}</code> dan <code>{"{tahun}"}</code>
            </div>
          </div>

        </div>
      </div>

      {/* ================= VISITS ================= */}
      {visits.map((v, vIdx) => (
        <div key={vIdx} className="card mb-3">
          <div className="card-header fw-bold">
            {v.unit_name} ({v.unit_code})
          </div>

          <div className="card-body">
            {/* ===== ANAMNESIS ===== */}
            <div className="mb-3">
              <div className="fw-semibold mb-2">Anamnesa</div>

              {(v.anamnesa?.length ? v.anamnesa : [{}]).map((a, aIdx) => (
                <textarea
                  key={aIdx}
                  className="form-control form-control-smmb-2"
                  rows={2}
                  placeholder="Isi disini..."
                  value={a.master || ""}
                  disabled={!canEditVisit}
                  onChange={e =>
                    handleAnamnesisChange(vIdx, aIdx, e.target.value)
                  }
                />
              ))}
            </div>

            {/* ===== DIAGNOSA ===== */}
            <div className="mb-3">
              <div className="fw-semibold mb-2">Diagnosa</div>

              {(v.diagnosa?.length ? v.diagnosa : [{}]).map((d, dIdx) => (
                <textarea
                  key={dIdx}
                  className="form-control form-control-smmb-2"
                  rows={2}
                  placeholder="Isi disini..."
                  value={d.detail || d.master || ""}
                  disabled={!canEditVisit}
                  onChange={e =>
                    handleDiagnosaChange(vIdx, dIdx, e.target.value)
                  }
                />
              ))}
            </div>

            {/* ===== LAB ===== */}
            {v.unit_code === "LB001" && (
              <>
                <div className="fw-semibold mb-2">Hasil Laboratorium</div>

                {Array.isArray(v.hasil) && v.hasil.length ? (
                  v.hasil.map((group, gIdx) => (
                    <div key={gIdx} className="mb-4">
                      <div className="fw-bold text-primary mb-1">
                        {group.medical_service_name}
                      </div>

                      {group.desc_ms && (
                        <div className="text-muted fst-italic mb-2">
                          {group.desc_ms}
                        </div>
                      )}

                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Pemeriksaan</th>
                            <th>Hasil</th>
                            <th>Satuan</th>
                            <th>Nilai Normal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items
                            ?.filter(i => !isEmptyLabItem(i))
                            .map((item, iIdx) => (
                              <tr key={item.lab_srvc_id || iIdx}>
                                <td>{iIdx + 1}</td>
                                <td>{item.lab_srvc_nm}</td>
                                <td>{item.result || "-"}</td>
                                <td>{item.unit || "-"}</td>
                                <td>{item.normal || "-"}</td>
                              </tr>
                            ))}

                          {!group.items?.filter(i => !isEmptyLabItem(i)).length && (
                            <tr>
                              <td colSpan={5} className="text-center text-muted">
                                Tidak ada detail hasil
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <em className="text-muted">Tidak ada hasil laboratorium</em>
                )}
              </>
            )}

            {/* ===== RADIOLOGI ===== */}
            {v.unit_code === "RA001" && (
              <>
                <div className="fw-semibold mb-2">Hasil Radiologi</div>

                {Array.isArray(v.hasil) && v.hasil.length ? (
                  v.hasil.map((r, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="fw-bold text-primary mb-1">
                        {r.medical_service_name}
                      </div>

                      {r.photo_reading && (
                        <div className="mb-2">
                          <strong>Hasil Pemeriksaan:</strong>
                          <div
                            className="border rounded p-2 mt-1"
                            style={{ whiteSpace: "pre-line" }}
                          >
                            {r.photo_reading}
                          </div>
                        </div>
                      )}

                      {r.description && (
                        <div>
                          <strong>Kesimpulan:</strong>
                          <div
                            className="border rounded p-2 mt-1 bg-light"
                            style={{ whiteSpace: "pre-line" }}
                          >
                            {r.description}
                          </div>
                        </div>
                      )}

                      {!r.photo_reading && !r.description && (
                        <div className="text-muted fst-italic">
                          Tidak ada hasil radiologi
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <em className="text-muted">Tidak ada hasil radiologi</em>
                )}
              </>
            )}

            {/* ===== KESIMPULAN & SARAN UNIT ===== */}
            <div className="row mt-3">
              <div className="col-md-6">
                <label className="fw-semibold">
                  Kesimpulan {v.unit_name}
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  disabled={!canEditVisit}
                  value={v.kesimpulan || ""}
                  onChange={e =>
                    handleVisitFieldChange(
                      vIdx,
                      "kesimpulan",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="fw-semibold">
                  Saran {v.unit_name}
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  disabled={!canEditVisit}
                  value={v.saran || ""}
                  onChange={e =>
                    handleVisitFieldChange(
                      vIdx,
                      "saran",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

          </div>
        </div>
      ))}

      {/* ================= FINAL ================= */}
      <div className="card mb-3">
        <div className="card-header">Kesimpulan & Rekomendasi Final</div>
        <div className="card-body">
          <textarea
            className="form-control form-control-smmb-2"
            rows={3}
            disabled={isLocked || role !== 'approver_mcu' || !isAvailable}
            placeholder="Kesimpulan"
            value={header.kesimpulan || ""}
            onChange={e =>
              handleHeaderChange("kesimpulan", e.target.value)
            }
          />
          <textarea
            className="form-control form-control-sm"
            rows={3}
            disabled={isLocked || role !== 'approver_mcu' || !isAvailable}
            placeholder="Rekomendasi"
            value={header.rekomendasi || ""}
            onChange={e =>
              handleHeaderChange("rekomendasi", e.target.value)
            }
          />
        </div>
      </div>

      {/* ================= ACTION ================= */}
      <div className="d-flex justify-content-start gap-2 mb-0">

        {/* KEMBALI */}
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          disabled={saving || finalizing}
        >
          Kembali
        </button>

        {(isDokter || isUser) && (
          canSaveDraft ? (
            <button
              className="btn btn-success"
              onClick={handleSaveDraft}
              disabled={saving || finalizing}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          ) : isDokter ? (
            <button
              className="btn btn-info"
              onClick={() => navigate(-1)}
              disabled={saving || finalizing}
            >
              Data belum diproses oleh User MCU
            </button>
          ) : null
        )}

        {isApprover && !isFinal && (
          canFinalize ? (
            <button
              className="btn btn-danger"
              onClick={handleFinalize}
              disabled={saving || finalizing}
            >
              {finalizing ? "Memfinalisasi..." : "Finalisasi MCU"}
            </button>
          ) : (
            <button
              className="btn btn-info"
              onClick={() => navigate(-1)}
              disabled={saving || finalizing}
            >
              Data belum diproses oleh Dokter MCU
            </button>
          )
        )}

        {/* FINAL MODE */}
        {(isFinal || isCetak) && header.mcu_id && (
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/mcu/CetakMCU/${header.mcu_id}`)}
          >
            Cetak Suket
          </button>
        )}

      </div>

    </>
  );
};

export default FormMCU;
