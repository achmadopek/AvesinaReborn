import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchHasilPemeriksaan } from "../../../api/wj_mcu/DataMCU";

const HasilPemeriksaan = () => {
  const { nrm, tgl } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [visits, setVisits] = useState([]);

  const [params] = useSearchParams();

  const mcuFieldMap = {
    tb: { label: "Tinggi Badan", unit: "cm" },
    bb: { label: "Berat Badan", unit: "kg" },
    tda: { label: "Tekanan Darah Sistolik", unit: "mmHg" },
    tdb: { label: "Tekanan Darah Diastolik", unit: "mmHg" },
    nadi: { label: "Nadi", unit: "x/menit" },
    suhu: { label: "Suhu Tubuh", unit: "°C" }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchHasilPemeriksaan(nrm, tgl);
        if (res?.success) {
          setHeader(res.data.header);
          setVisits(res.data.visits || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [nrm, tgl]);

  if (loading) return <div>Loading...</div>;
  if (!header) return <div>Data tidak ditemukan</div>;

  return (
    <>
      <div className="card shadow-sm card-theme mb-3">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Hasil Pemeriksaan Medis</h6>
        </div>

        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="fw-bold mb-1 text-primary">
                {header.nama}
              </h5>
              <div className="small text-muted mb-2">
                <span className="me-3">
                  <strong>NRM:</strong> {header.nrm}
                </span>
                <span className="me-3">
                  <strong>NIK:</strong> {header.nik}
                </span>
                <span>
                  <strong>Umur:</strong> {header.umur} th
                </span>
              </div>
              <div className="text-secondary">
                <i className="bi bi-geo-alt me-1"></i>
                {header.alamat}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs">
        {visits.map((v, i) => (
          <li className="nav-item" key={v.unit_visit_id}>
            <button
              className={`nav-link ${i === 0 ? "active" : ""}`}
              data-bs-toggle="tab"
              data-bs-target={`#tab-${i}`}
              type="button"
            >
              {v.unit_name}
            </button>
          </li>
        ))}
      </ul>

      <div className="tab-content border border-top-0 p-3">
        {visits.map((v, i) => {
          const { anamnesa = [], diagnosa = [], hasil } = v;

          return (
            <div
              key={v.unit_visit_id}
              id={`tab-${i}`}
              className={`tab-pane fade ${i === 0 ? "show active" : ""}`}
            >
              {/* ================= ANAMNESA ================= */}
              <h6>Anamnesa</h6>
              <ul>
                {anamnesa.length > 0 ? (
                  anamnesa.map((a, idx) => (
                    <li key={idx}>{a.detail || a.master || "-"}</li>
                  ))
                ) : (
                  <li className="text-muted fst-italic">Tidak ada anamnesa</li>
                )}
              </ul>

              {/* ================= DIAGNOSA ================= */}
              <h6>Diagnosa</h6>
              <ul>
                {diagnosa.length > 0 ? (
                  diagnosa.map((d, idx) => (
                    <li key={idx}>{d.detail || d.master || "-"}</li>
                  ))
                ) : (
                  <li className="text-muted fst-italic">Tidak ada diagnosa</li>
                )}
              </ul>

              {/* =====================================================
                  =============== HASIL PEMERIKSAAN ==================
                  ===================================================== */}

              {/* ===== LABORATORIUM ===== */}
              {v.unit_code === "LB001" && (
                <>
                  <h6>Hasil Laboratorium</h6>

                  {Array.isArray(hasil) && hasil.length ? (
                    hasil.map((group, gIdx) => (
                      <div key={group.medical_service_id || gIdx} className="mb-3">
                        <div className="fw-semibold text-success">
                          {group.medical_service_name}
                        </div>

                        {group.desc_ms && (
                          <div className="text-muted fst-italic mb-1">
                            {group.desc_ms}
                          </div>
                        )}

                        <ul>
                          {(group.items || []).map((item, idx) => (
                            <li key={idx} className="mb-1">
                              <strong>{item.lab_srvc_nm}</strong>
                              {" : "}
                              {item.result ?? "-"} {item.unit || ""}

                              {item.normal && (
                                <span className="text-muted">
                                  {" "}({item.normal})
                                </span>
                              )}

                              {item.analisis && (
                                <div className="small fst-italic">
                                  Catatan: {item.analisis}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
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
                  <h6>Hasil Radiologi</h6>

                  {Array.isArray(hasil) && hasil.length ? (
                    hasil.map((r, idx) => (
                      <div key={idx} className="mb-4">
                        <div className="fw-bold text-primary mb-1">
                          {r.medical_service_name}
                        </div>

                        {r.photo_reading ? (
                          <div
                            className="border rounded p-2"
                            style={{ whiteSpace: "pre-line" }}
                          >
                            {r.photo_reading}
                          </div>
                        ) : (
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

              {/* ===== HASIL UMUM (BUKAN LAB & RADIOLOGI) ===== */}
              {v.unit_code !== "LB001" &&
                v.unit_code !== "RA001" &&
                hasil && (
                  <>
                    <h6>Hasil Pemeriksaan</h6>

                    {typeof hasil === "object" ? (
                      <ul>
                        {Object.entries(hasil)
                          .filter(([key]) => key !== "registry_id")
                          .map(([key, val], idx) => (
                            <li key={idx}>
                              <strong>{key}</strong> : {val ?? "-"}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <em className="text-muted">Tidak ada hasil</em>
                    )}
                  </>
                )}

              {/* ================= KESIMPULAN & SARAN ================= */}
              {(v.kesimpulan || v.saran) && (
                <>
                  <h6>Kesimpulan & Saran</h6>

                  {v.kesimpulan && (
                    <p>
                      <strong>Kesimpulan:</strong><br />
                      <span style={{ whiteSpace: "pre-line" }}>
                        {v.kesimpulan}
                      </span>
                    </p>
                  )}

                  {v.saran && (
                    <p>
                      <strong>Saran:</strong><br />
                      <span style={{ whiteSpace: "pre-line" }}>
                        {v.saran}
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* tombol aksi */}
      <div className="d-flex gap-2 mb-3 mt-3">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          Kembali
        </button>


        <button
          className="btn btn-success"
          onClick={() =>
            navigate(`/mcu/FormMCU/${header.nrm}/${header.tgl_periksa.slice(0, 10)}`)
          }
        >
          {header.status_mcu === 'DRAFT' ? "Lanjutkan MCU" : "Proses MCU"}
        </button>


        {header.status_mcu === 'FINAL' && (
          <button
            className="btn btn-primary"
            onClick={() =>
              navigate(`/mcu/CetakMCU/${header.mcu_id}`)
            }
          >
            Cetak Suket
          </button>
        )}
      </div>

    </>
  );
};

export default HasilPemeriksaan;