import React, { useState, useEffect, useMemo } from "react";
import {
  fetchRuangan,
  fetchIndikatorByUnit,
  submitSPMHarian
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

  /* ===============================
     LOAD RUANGAN
  =============================== */

  useEffect(() => {

    if (!units || units.length === 0) return;

    const loadRuangan = async () => {

      try {

        const res = await fetchRuangan();

        //console.log("FULL RESPONSE:", res.data);

        const ruangan = res.data || [];

        //console.log("RUANGAN DARI DB:", ruangan);

        const filtered = ruangan.filter((r) =>
          units.includes(r.srvc_unit_id)
        );

        //console.log("SETELAH FILTER UNIT:", filtered);

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
     UNIT MAP (OPTIMASI)
  =============================== */

  const unitMap = useMemo(() => {

    const map = {};
    ruanganList.forEach(r => {
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

      existing.forEach(d => {
        spmMap[d.indikator_id] = d;
      });

      const merged = indikatorMaster.map(it => ({
        ...it,
        numerator_value: spmMap[it.id]?.numerator_value ?? "",
        denominator_value: spmMap[it.id]?.denominator_value ?? "",
        is_meet_standard: spmMap[it.id]?.is_meet_standard ?? null
      }));

      // GROUPING
      const grouped = {};

      merged.forEach(it => {

        if (!grouped[it.group_pelayanan_id]) {
          grouped[it.group_pelayanan_id] = {
            group_id: it.group_pelayanan_id,
            group_nama: it.nama_group,
            indikator: []
          };
        }

        grouped[it.group_pelayanan_id].indikator.push(it);

      });

      setIndikatorGroup(Object.values(grouped));

      /* ===============================
         CEK DATA EXISTING
      =============================== */

      if (existing.length > 0) {

        setHasExistingData(true);

        const result = await Swal.fire({
          title: "Data Sudah Ada",
          text: "Data SPM pada tanggal ini sudah tersedia.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Edit Data",
          cancelButtonText: "Lihat Saja",
          reverseButtons: true
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
     HANDLE INPUT
  =============================== */

  const handleChangeValue = (id, field, val) => {

    setIndikatorGroup(prev =>
      prev.map(group => ({
        ...group,
        indikator: group.indikator.map(item => {

          if (item.id !== id) return item;

          const updated = { ...item, [field]: val };

          const num =
            field === "numerator_value"
              ? val
              : updated.numerator_value;

          const den =
            field === "denominator_value"
              ? val
              : updated.denominator_value;

          const nilai = hitungCapaian(num, den, item.measurement);
          const memenuhi = cekStandar(nilai, item.operator, item.standart);

          return {
            ...updated,
            preview_nilai: nilai,
            preview_meet: memenuhi,
            is_meet_standard: memenuhi
          };

        })
      }))
    );

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

  /* ===============================
     CANCEL
  =============================== */

  const handleCancel = async () => {

    const result = await Swal.fire({
      title: "Batalkan perubahan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Tidak"
    });

    if (!result.isConfirmed) return;

    setIndikatorGroup([]);
    setIsEditMode(false);
    setHasExistingData(false);

  };


  /* ===============================
     SUBMIT
  =============================== */

  const handleSubmit = async () => {

    if (!unitId) return toast.error("Unit belum dipilih");
    if (!tglInput) return toast.error("Tanggal belum diisi");

    const result = await Swal.fire({
      title: "Simpan Data?",
      text:
        "Data akan disimpan dan sistem akan otomatis mendownload bukti PDF sebagai tanda bahwa Anda telah melakukan entri.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    const unitName =
      unitMap[unitId]?.nama_ruangan || "Unit tidak ditemukan";

    const details = indikatorGroup.flatMap(group =>
      group.indikator.map(it => ({
        indikator_id: it.id,
        numerator_value: it.numerator_value,
        denominator_value: it.denominator_value,
        is_meet_standard: it.is_meet_standard
      }))
    );

    try {

      const res = await submitSPMHarian({
        unit_id: unitId,
        tgl_input: tglInput,
        created_by: peg_id,
        hostname,
        username,
        unitName,
        details
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
     LOGIC PERHITUNGAN
  =============================== */

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

      case ">=": return nilai >= std;
      case "<=": return nilai <= std;
      case ">": return nilai > std;
      case "<": return nilai < std;
      case "=": return nilai === std;

      default: return null;

    }

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

              <option value="">-- Pilih Ruangan --</option>

              {ruanganList.map(r => (

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
                  <th>Contoh</th>
                </tr>
              </thead>

              <tbody>
                {group.indikator.map((it, i) => (
                  <React.Fragment key={it.id}>
                    <tr>
                      <td>{i + 1}</td>
                      <td style={{ maxWidth: "300px" }}><b>{it.judul_indikator}</b></td>
                      <td style={{ maxWidth: "300px" }}>{it.numerator}</td>

                      <td style={{ maxWidth: "70px" }}>
                        <input
                          type="number"
                          className="form-control form-control-smmb-1"
                          value={it.numerator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(it.id, "numerator_value", e.target.value)
                          }
                        />
                      </td>

                      <td rowSpan={2} className="align-middle text-center" style={{ maxWidth: "50px" }}>
                        {it.preview_nilai !== undefined && it.preview_nilai !== null ? (
                          <div
                            className={`p-2 border rounded${it.preview_meet === true
                              ? "border-success"
                              : it.preview_meet === false
                                ? "border-danger"
                                : "border-secondary"
                              }`}
                          >
                            <b>
                              {Number(it.preview_nilai).toFixed(2)} {it.measurement}
                            </b>

                            <div>
                              {it.preview_meet === true && (
                                <span className="text-success">Memenuhi Standar</span>
                              )}

                              {it.preview_meet === false && (
                                <span className="text-danger">Tidak Memenuhi</span>
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
                      <td>{it.contoh_num == 0 ? "-" : it.contoh_num}</td>
                    </tr>

                    <tr>
                      <td></td>
                      <td style={{ maxWidth: "300px" }}>
                        <small>
                          {it.operator} {it.standart} {it.measurement}
                        </small>
                      </td>
                      <td style={{ maxWidth: "300px" }}>{it.denominator}</td>

                      <td style={{ maxWidth: "70px" }}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={it.denominator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(it.id, "denominator_value", e.target.value)
                          }
                        />
                      </td>

                      <td>{it.satuan_den}</td>
                      <td>{it.contoh_den == 0 ? "-" : it.contoh_den}</td>
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
              disabled={loading}
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

    </div >

  );

};

export default EntriSPMHarian;