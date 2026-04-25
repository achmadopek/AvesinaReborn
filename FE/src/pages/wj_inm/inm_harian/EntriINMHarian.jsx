import React, { useState, useEffect } from "react";
import {
  fetchRuangan,
  fetchIndikatorByUnit,
  submitINMHarian,
} from "../../../api/wj_inm/EntriHarian";
import { fetchINMharianByUnit } from "../../../api/wj_inm/DataINM";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const EntriINMHarian = () => {
  const [unitId, setUnitId] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [tglInput, setTglInput] = useState(today);

  const [indikatorList, setIndikatorList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ruanganList, setRuanganList] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    const loadRuangan = async () => {
      try {
        const res = await fetchRuangan(); // res = { success: true, data: [...] }
        setRuanganList(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error("Gagal load ruangan!");
        setRuanganList([]);
      }
    };

    loadRuangan();
  }, []);

  const handleLoadIndikator = async () => {
    if (!unitId) return toast.error("Pilih unit terlebih dahulu!");
    if (!tglInput) return toast.error("Tanggal belum diisi!");

    setLoading(true);
    try {
      // Ambil master indikator
      const indikatorRes = await fetchIndikatorByUnit(unitId);
      const indikatorMaster =
        indikatorRes?.data?.data ||
        indikatorRes?.data?.indikator ||
        indikatorRes?.data ||
        [];

      // Ambil data INM existing
      const inmRes = await fetchINMharianByUnit(unitId, tglInput);
      const existing = inmRes?.data || [];

      const inmMap = {};
      existing.forEach((d) => {
        inmMap[d.indikator_id] = d;
      });

      const merged = indikatorMaster.map((it) => ({
        ...it,
        numerator_value: inmMap[it.id]?.numerator_value ?? "",
        denominator_value: inmMap[it.id]?.denominator_value ?? "",
        is_meet_standard: inmMap[it.id]?.is_meet_standard ?? null,
      }));

      setIndikatorList(merged);

      // Kalau ada data lama → konfirmasi user
      if (existing.length > 0) {
        setHasExistingData(true);

        const result = await Swal.fire({
          title: "Data Sudah Ada",
          text: "Data INM pada tanggal ini sudah tersedia. Apa yang ingin Anda lakukan?",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Edit Data",
          cancelButtonText: "Lihat Saja",
          reverseButtons: true,
        });

        setIsEditMode(result.isConfirmed);

      } else {
        // data baru
        setHasExistingData(false);
        setIsEditMode(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal load indikator / data INM!");
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Batalkan Perubahan?",
      text: "Semua perubahan yang belum disimpan akan hilang.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setIndikatorList([]);
    setIsEditMode(false);
    setHasExistingData(false);
  };

  const handleChangeValue = (id, field, val) => {
    setIndikatorList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async () => {
    if (!unitId) return toast.error("Unit belum dipilih");
    if (!tglInput) return toast.error("Tanggal belum diisi");

    const details = indikatorList.map((it) => ({
      indikator_id: it.id,
      numerator_value: it.numerator_value,
      denominator_value: it.denominator_value,
      is_meet_standard: it.is_meet_standard,
    }));

    setLoading(true);
    try {
      const res = await submitINMHarian({
        unit_id: unitId,
        tgl_input: tglInput,
        details,
      });

      toast.success("INM Harian berhasil disimpan!");
      setIndikatorList([]);
    } catch (err) {
      toast.error("Gagal menyimpan entri!");
    }
    setLoading(false);
  };

  return (
    <div className="card shadow-sm card-theme">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Entri INM Harian</h6>
      </div>
      <div className="card-body px-3 py-2">
        <div className="mb-3 d-flex align-items-end gap-2 flex-wrap">
          {/* PILIH UNIT */}
          <div className="flex-grow-1" style={{ minWidth: "200px" }}>
            <label>Ruangan / Unit</label>
            <select
              className="form-control form-control-sm"
              value={unitId}
              disabled={indikatorList.length > 0}
              onChange={(e) => setUnitId(e.target.value)}
            >
              <option value="">-- Pilih Ruangan --</option>
              {Array.isArray(ruanganList) &&
                ruanganList.map((r) => (
                  <option key={r.ruangan_id} value={r.ruangan_id}>
                    {r.kode_ruangan} - {r.nama_ruangan || "Tanpa Nama"}
                  </option>
                ))}
            </select>
          </div>

          {/* TGL INPUT */}
          <div style={{ minWidth: "150px" }}>
            <label>Tanggal Input</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={tglInput}
              disabled={indikatorList.length > 0}
              onChange={(e) => setTglInput(e.target.value)}
            />
          </div>

          {/* BUTTON LOAD */}
          <div>
            <button
              className="btn btn-primary"
              onClick={handleLoadIndikator}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load Indikator"}
            </button>
          </div>
        </div>

        <hr />

        {indikatorList.length > 0 && (
          <div className="pb-2">
            <table className="table table-theme table-bordered">
              <thead>
                <tr>
                  <th>Indikator / Standar</th>
                  <th>Numertor / Denominator</th>
                  <th>Input Nilai</th>
                  <th>Satuan</th>
                  <th>Contoh</th>
                </tr>
              </thead>
              <tbody>
                {indikatorList.map((it) => (
                  <>
                    <tr key={it.id}>
                      <td>
                        <b>{it.judul_indikator}</b>
                      </td>
                      <td>{it.numerator}</td>

                      <td>
                        <input
                          type="number"
                          className="form-control form-control-smmb-1"
                          placeholder="Numerator"
                          value={it.numerator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(it.id, "numerator_value", e.target.value)
                          }
                        />
                      </td>

                      <td>{it.satuan_num}</td>

                      <td>{it.contoh_num}</td>
                    </tr>

                    <tr>
                      <td className="text-right">
                        <small>
                          {it.operator} {it.standart} {it.measurement}
                        </small>
                      </td>
                      <td>{it.denominator}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Denominator"
                          value={it.denominator_value || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleChangeValue(it.id, "denominator_value", e.target.value)
                          }
                        />
                      </td>
                      <td>{it.satuan_den}</td>
                      <td>{it.contoh_den}</td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>

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
                      ? "Update INM"
                      : "Simpan Semua"}
                </button>
              )}

              {indikatorList.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default EntriINMHarian;
