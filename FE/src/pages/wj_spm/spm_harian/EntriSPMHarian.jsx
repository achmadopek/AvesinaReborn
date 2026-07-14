import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  fetchRuangan,
  fetchIndikatorByUnit,
  submitSPMHarian,
} from "../../../api/wj_spm/EntriHarian";
import { fetchSPMharianByUnit } from "../../../api/wj_spm/DataSPM";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/AuthContext";

const EntriSPMHarian = () => {
  const { peg_id, username, units } = useAuth();
  const hostname = window.location.hostname;
  const today = new Date().toISOString().split("T")[0];

  const [unitId, setUnitId] = useState("");
  const [tglInput, setTglInput] = useState(today);
  const [ruanganList, setRuanganList] = useState([]);
  const [indikatorGroup, setIndikatorGroup] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const validationTimersRef = useRef({});

  /* ===============================
       SET DEFAULT UNIT ID
  =============================== 
  useEffect(() => {
    // Memastikan units ada, berupa array, dan tidak kosong
    if (Array.isArray(units) && units.length > 0) {
      setUnitId(units[0]); // Mengisi dengan unit pertama
    }
  }, [units]);

  /* ===============================
       LOAD RUANGAN
  =============================== */
  useEffect(() => {
    if (!units || units.length === 0) return;

    const loadRuangan = async () => {
      try {
        const res = await fetchRuangan();
        const ruangan = res.data || [];
        const filtered = ruangan.filter((r) => units.includes(r.srvc_unit_id));
        setRuanganList(filtered);
      } catch (err) {
        console.error("ERROR LOAD RUANGAN:", err);
        toast.error("Gagal load ruangan");
        setRuanganList([]);
      }
    };

    loadRuangan();
  }, [units]);

  /* ===============================
       UNIT MAP
  =============================== */
  const unitMap = useMemo(() => {
    const map = {};
    ruanganList.forEach((r) => {
      map[r.ruangan_id] = r;
    });
    return map;
  }, [ruanganList]);

  /* ===============================
       LOAD INDIKATOR
  =============================== */
  const handleLoadIndikator = async () => {
    if (!unitId) return toast.error("Pilih unit terlebih dahulu");
    if (!tglInput) return toast.error("Tanggal belum diisi");

    setLoading(true);
    try {
      const indikatorRes = await fetchIndikatorByUnit(unitId);
      const indikatorMaster =
        indikatorRes?.data?.data ||
        indikatorRes?.data?.indikator ||
        indikatorRes?.data ||
        [];

      const spmRes = await fetchSPMharianByUnit(unitId, tglInput);
      const existing = spmRes?.data || [];
      const spmMap = {};
      existing.forEach((d) => {
        spmMap[d.indikator_id] = d;
      });

      const merged = indikatorMaster.map((it) => ({
        ...it,
        numerator_value: spmMap[it.id]?.numerator_value ?? "",
        denominator_value: spmMap[it.id]?.denominator_value ?? "",
        is_meet_standard: spmMap[it.id]?.is_meet_standard ?? null,
      }));

      // Grouping
      const grouped = {};
      merged.forEach((it) => {
        if (!grouped[it.group_pelayanan_id]) {
          grouped[it.group_pelayanan_id] = {
            group_id: it.group_pelayanan_id,
            group_nama: it.nama_group,
            indikator: [],
          };
        }
        grouped[it.group_pelayanan_id].indikator.push(it);
      });

      setIndikatorGroup(Object.values(grouped));

      // Cek data existing
      if (existing.length > 0) {
        setHasExistingData(true);
        const result = await Swal.fire({
          title: "Data Sudah Ada",
          text: "Data SPM pada tanggal ini sudah tersedia.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Edit Data",
          cancelButtonText: "Lihat Saja",
          reverseButtons: true,
        });
        setIsEditMode(result.isConfirmed);
      } else {
        setHasExistingData(false);
        setIsEditMode(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal load indikator");
    }
    setLoading(false);
  };

  /* ===============================
       HANDLE INPUT + VALIDASI
  =============================== */
  const isProportionIndicator = (item) => {
    return (
      item?.is_proportion === 1 ||
      item?.is_proportion === true ||
      item?.is_proportion === "1"
    );
  };

  const buildIndicatorValidationState = (item) => {
    const num = Number(item?.numerator_value) || 0;
    const den = Number(item?.denominator_value) || 0;

    let errorMsg = "";

    if (isProportionIndicator(item)) {
      if (den === 0 && num > 0) {
        errorMsg = "Denominator tidak boleh 0";
      } else if (num > den) {
        errorMsg = "Numerator tidak boleh lebih besar dari Denominator";
      } else if (num < 0 || den < 0) {
        errorMsg = "Nilai tidak boleh negatif";
      }
    } else if (num < 0 || den < 0) {
      errorMsg = "Nilai tidak boleh negatif";
    }

    const nilaiRaw = hitungCapaian(num, den, item?.measurement);
    const nilai =
      nilaiRaw === null
        ? null
        : nilaiRaw * Number(item?.conversion_factor || 1);

    const memenuhi = cekStandar(nilai, item?.operator, item?.standart);

    return {
      ...item,
      preview_nilai: nilai,
      preview_meet: memenuhi,
      is_meet_standard: memenuhi,
      error: errorMsg,
      hasError: !!errorMsg,
    };
  };

  const handleChangeValue = (id, field, val) => {
    setIndikatorGroup((prev) =>
      prev.map((group) => ({
        ...group,
        indikator: group.indikator.map((item) => {
          if (item.id !== id) return item;

          return {
            ...item,
            [field]: val,
            preview_nilai: null,
            preview_meet: null,
            is_meet_standard: null,
            error: "",
            hasError: false,
          };
        }),
      })),
    );

    if (validationTimersRef.current[id]) {
      clearTimeout(validationTimersRef.current[id]);
    }

    validationTimersRef.current[id] = window.setTimeout(() => {
      setIndikatorGroup((prev) =>
        prev.map((group) => ({
          ...group,
          indikator: group.indikator.map((item) => {
            if (item.id !== id) return item;
            return buildIndicatorValidationState(item);
          }),
        })),
      );
    }, 180);
  };

  const handleBlurValue = (id) => {
    if (validationTimersRef.current[id]) {
      clearTimeout(validationTimersRef.current[id]);
    }

    setIndikatorGroup((prev) =>
      prev.map((group) => ({
        ...group,
        indikator: group.indikator.map((item) => {
          if (item.id !== id) return item;
          return buildIndicatorValidationState(item);
        }),
      })),
    );
  };

  /* ===============================
       HELPER FUNCTIONS
  =============================== */
  const hasErrorInForm = useMemo(() => {
    return indikatorGroup.some((group) =>
      group.indikator.some((item) => item.hasError),
    );
  }, [indikatorGroup]);

  function hitungCapaian(num, den, measurement) {
    if (!den && measurement !== "jumlah") return null;
    switch (measurement) {
      case "%":
        return (num / den) * 100;
      case "Perseribu":
        return (num / den) * 1000;
      case "Tim":
      case "Orang":
        return num;
      default:
        return num / den;
    }
  }

  const cekStandar = (nilai, operator, standart) => {
    if (nilai === null) return null;
    const std = Number(standart);
    switch (operator) {
      case ">=":
        return nilai >= std;
      case "<=":
        return nilai <= std;
      case ">":
        return nilai > std;
      case "<":
        return nilai < std;
      case "=":
        return nilai === std;
      default:
        return null;
    }
  };

  const downloadPDF = (id) => {
    const url = `${import.meta.env.VITE_API_URL}/api/spm/EntriSPMHarian/download/${id}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `SPM_Harian_${tglInput}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    return () => {
      Object.values(validationTimersRef.current).forEach((timer) =>
        clearTimeout(timer),
      );
      validationTimersRef.current = {};
    };
  }, []);

  /* ===============================
       CANCEL & SUBMIT
  =============================== */
  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Batalkan perubahan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Tidak",
    });
    if (!result.isConfirmed) return;

    setIndikatorGroup([]);
    setIsEditMode(false);
    setHasExistingData(false);
  };

  const handleSubmit = async () => {
    if (!unitId) return toast.error("Unit belum dipilih");
    if (!tglInput) return toast.error("Tanggal belum diisi");

    const result = await Swal.fire({
      title: "Simpan Data?",
      text: "Data akan disimpan dan sistem akan otomatis mendownload bukti PDF.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    const unitName = unitMap[unitId]?.nama_ruangan || "Unit tidak ditemukan";

    const details = indikatorGroup.flatMap((group) =>
      group.indikator.map((it) => ({
        indikator_id: it.id,
        numerator_value: it.numerator_value,
        denominator_value: it.denominator_value,
        is_meet_standard: it.is_meet_standard,
      })),
    );

    try {
      const res = await submitSPMHarian({
        unit_id: unitId,
        tgl_input: tglInput,
        created_by: peg_id,
        hostname,
        username,
        unitName,
        details,
      });

      toast.success("SPM Harian berhasil disimpan");
      downloadPDF(res.harian_id);
      setIndikatorGroup([]);
    } catch (err) {
      toast.error("Gagal menyimpan");
    }
    setLoading(false);
  };

  /* ===============================
       RENDER
  =============================== */
  return (
    <div className="card shadow-sm card-theme">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Entri SPM Harian</h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="mb-3 d-flex align-items-end gap-2 flex-wrap">
          <div className="flex-grow-1" style={{ minWidth: 200 }}>
            <label>Ruangan / Unit</label>
            <select
              className="form-control form-control-sm"
              value={unitId}
              disabled={!ruanganList.length}
              onChange={(e) => setUnitId(e.target.value)}
            >
              <option>Pilih Ruangan</option>
              {ruanganList.map((r) => (
                <option key={r.ruangan_id} value={r.ruangan_id}>
                  {r.kode_ruangan} - {r.nama_ruangan}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 150 }}>
            <label>Tanggal Input</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={tglInput}
              disabled={!ruanganList.length}
              onChange={(e) => setTglInput(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLoadIndikator}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load Indikator"}
          </button>
        </div>

        <hr />

        {indikatorGroup.map((group, gIndex) => (
          <div key={group.group_id} className="mb-4">
            <h6 className="mb-2">
              {gIndex + 1}. {group.group_nama}
            </h6>
            <table className="table table-theme table-bordered">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Indikator / Standar</th>
                  <th>Numerator / Denominator</th>
                  <th>Input Nilai</th>
                  <th>Pencapaian</th>
                  <th>Satuan</th>
                </tr>
              </thead>
              <tbody>
                {group.indikator.map((it, i) => (
                  <React.Fragment key={it.id}>
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          backgroundColor: "#cccccc",
                          height: "4px",
                          padding: 0,
                        }}
                      ></td>
                    </tr>
                    <tr>
                      <td>{i + 1}</td>
                      <td style={{ maxWidth: "300px" }}>
                        <b>{it.judul_indikator}</b>
                      </td>
                      <td style={{ maxWidth: "300px" }}>{it.numerator}</td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${it.hasError ? "is-invalid" : ""}`}
                          value={it.numerator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(
                              it.id,
                              "numerator_value",
                              e.target.value,
                            )
                          }
                          onBlur={() => handleBlurValue(it.id)}
                        />
                        {it.error && (
                          <div className="text-danger small mt-1">
                            {it.error}
                          </div>
                        )}
                      </td>
                      <td
                        rowSpan={2}
                        className="align-middle text-center"
                        style={{ maxWidth: "50px" }}
                      >
                        {/* Pencapaian Preview */}
                        {it.preview_nilai !== undefined &&
                        it.preview_nilai !== null ? (
                          <div
                            className={`p-2 border rounded ${it.preview_meet === true ? "border-success" : it.preview_meet === false ? "border-danger" : "border-secondary"}`}
                          >
                            <b>
                              {Number(it.preview_nilai).toFixed(2)}{" "}
                              {it.measurement}
                            </b>
                            <div>
                              {it.preview_meet === true && (
                                <span className="text-success">
                                  Memenuhi Standar
                                </span>
                              )}
                              {it.preview_meet === false && (
                                <span className="text-danger">
                                  Tidak Memenuhi
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 border border-secondary rounded text-muted">
                            Status pencapaian ?
                          </div>
                        )}
                      </td>
                      <td>{it.satuan_num}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={{ maxWidth: "300px" }}>
                        <small>
                          {it.operator} {it.standart} {it.measurement}
                        </small>
                      </td>
                      <td style={{ maxWidth: "300px" }}>{it.denominator}</td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${it.hasError ? "is-invalid" : ""}`}
                          value={it.denominator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(
                              it.id,
                              "denominator_value",
                              e.target.value,
                            )
                          }
                          onBlur={() => handleBlurValue(it.id)}
                        />
                      </td>
                      <td>{it.satuan_den}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="d-flex gap-2">
          {isEditMode && (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={loading || hasErrorInForm}
            >
              {loading
                ? "Menyimpan..."
                : hasExistingData
                  ? "Update SPM"
                  : "Simpan Semua"}
            </button>
          )}

          {indikatorGroup.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntriSPMHarian;
