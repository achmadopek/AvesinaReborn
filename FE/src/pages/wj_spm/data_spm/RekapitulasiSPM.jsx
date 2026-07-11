import React, { useState, useEffect } from "react";
import { fetchRekapSPMIndikator } from "../../../api/wj_spm/DashboardSPM";
import {
  fetchRuangan,
  fetchInstalasi,
  fetchBidang,
} from "../../../api/wj_spm/EntriHarian";
import { generateRekapPDF } from "../../../utils/generateRekapPDF";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

const RekapitulasiSPM = () => {
  const { role, unit_id: userUnitId } = useAuth(); // pastikan AuthContext mengembalikan unit_id user

  const [rekap, setRekap] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState("unit");
  const [selectedId, setSelectedId] = useState("");
  const [listUnit, setListUnit] = useState([]);
  const [listInstalasi, setListInstalasi] = useState([]);
  const [listBidang, setListBidang] = useState([]);

  const [periode, setPeriode] = useState("TW1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const namaBulan = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  // Format Capaian
  const formatCapaian = (value, measurement = "") => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);

    switch (measurement?.toLowerCase()) {
      case "%":
        return `${num.toFixed(2)}%`;
      case "menit":
      case "jam":
      case "hari":
        return `${num.toFixed(2)} ${measurement}`;
      default:
        return `${num.toFixed(2)} ${measurement}`;
    }
  };

  // Load Master Data
  useEffect(() => {
    const loadMaster = async () => {
      try {
        if (mode === "unit") {
          const res = await fetchRuangan();
          setListUnit(res.data || []);
          if (res.data?.length > 0) setSelectedId(res.data[0].ruangan_id);
        } else if (mode === "instalasi") {
          const res = await fetchInstalasi();
          setListInstalasi(res.data || []);
          if (res.data?.length > 0) setSelectedId(res.data[0].instalasi_id);
        } else if (mode === "bidang") {
          const res = await fetchBidang();
          setListBidang(res.data || []);
          if (res.data?.length > 0) setSelectedId(res.data[0].bidang_id);
        }
      } catch (err) {
        toast.error("Gagal memuat data master");
      }
    };
    loadMaster();
  }, [mode]);

  const getRangeByPeriode = (tahun, p) => {
    switch (p) {
      case "TW1":
        return { start: `${tahun}-01-01`, end: `${tahun}-03-31` };
      case "TW2":
        return { start: `${tahun}-04-01`, end: `${tahun}-06-30` };
      case "TW3":
        return { start: `${tahun}-07-01`, end: `${tahun}-09-30` };
      case "TW4":
        return { start: `${tahun}-10-01`, end: `${tahun}-12-31` };
      case "SMT1":
        return { start: `${tahun}-01-01`, end: `${tahun}-06-30` };
      case "SMT2":
        return { start: `${tahun}-07-01`, end: `${tahun}-12-31` };
      case "TAHUNAN":
        return { start: `${tahun}-01-01`, end: `${tahun}-12-31` };
      default:
        return null;
    }
  };

  const fetchDashboard = async () => {
    if (!selectedId) return toast.warn(`Pilih ${mode} terlebih dahulu`);

    try {
      setLoading(true);
      const range = getRangeByPeriode(year, periode);
      if (!range) return;

      setStart(range.start);
      setEnd(range.end);

      const res = await fetchRekapSPMIndikator(
        mode,
        selectedId,
        range.start,
        range.end,
      );
      setRekap(Array.isArray(res?.data) ? res.data : []);
      setMeta(res?.meta || null);
    } catch (err) {
      console.error(err);
      setRekap([]);
      setMeta(null);
      toast.error("Gagal memuat data rekapitulasi");
    } finally {
      setLoading(false);
    }
  };

  const renderSelectTarget = () => {
    if (mode === "unit") {
      return (
        <select
          className="form-control form-control-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">-- Pilih Unit --</option>
          {listUnit.map((u) => (
            <option key={`unit-${u.ruangan_id}`} value={u.ruangan_id}>
              {u.kode_ruangan} - {u.nama_ruangan}
            </option>
          ))}
        </select>
      );
    }

    if (mode === "instalasi") {
      return (
        <select
          className="form-control form-control-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">-- Pilih Instalasi --</option>
          {listInstalasi.map((i) => (
            <option key={`instalasi-${i.instalasi_id}`} value={i.instalasi_id}>
              {i.kode_instalasi} - {i.nama_instalasi}
            </option>
          ))}
        </select>
      );
    }

    if (mode === "bidang") {
      return (
        <select
          className="form-control form-control-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">-- Pilih Bidang --</option>
          {listBidang.map((b) => (
            <option key={`bidang-${b.bidang_id}`} value={b.bidang_id}>
              {b.kode_bidang} - {b.nama_bidang}
            </option>
          ))}
        </select>
      );
    }

    return null;
  };

  const handlePrintPDF = () => {
    if (rekap.length === 0) return toast.warn("Tidak ada data untuk dicetak");

    generateRekapPDF({
      rekap,
      meta,
      periode,
      year,
      start,
      end,
      namaMode:
        mode === "unit"
          ? "Unit"
          : mode === "instalasi"
            ? "Instalasi"
            : "Bidang",
      namaTarget: meta?.nama || "-",
    });
  };

  return (
    <div className="container-fluid px-2">
      <div className="card shadow-sm mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <b>Rekapitulasi SPM Rumah Sakit</b>
          {rekap.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={handlePrintPDF}>
              🖨 Cetak PDF
            </button>
          )}
        </div>
        <div className="card-body row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label">Mode</label>
            <select
              className="form-control form-control-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="instalasi">Instalasi</option>
              <option value="bidang">Bidang</option>
              <option value="unit">Unit</option>
            </select>
          </div>

          {/* TARGET */}
          <div className="col-md-4">
            <label className="form-label mb-1 fw-semibold">
              {mode === "unit" && "Unit"}
              {mode === "instalasi" && "Instalasi"}
              {mode === "bidang" && "Bidang"}
            </label>
            {renderSelectTarget()}
          </div>

          <div className="col-md-2">
            <label className="form-label">Periode</label>
            <select
              className="form-control form-control-sm"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="TW1">TW 1 (Jan–Mar)</option>
              <option value="TW2">TW 2 (Apr–Jun)</option>
              <option value="TW3">TW 3 (Jul–Sep)</option>
              <option value="TW4">TW 4 (Okt–Des)</option>
              <option value="SMT1">SMT 1 (Jan–Jun)</option>
              <option value="SMT2">SMT 2 (Jul–Des)</option>
              <option value="TAHUNAN">TAHUNAN (Jan–Des)</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Tahun</label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              onClick={fetchDashboard}
              disabled={loading}
            >
              {loading ? "Loading..." : "Terapkan"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {/* Tabel Rekap */}
      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>No</th>
                <th>Indikator</th>
                <th>Target</th>
                {(meta?.periode?.bulan || []).map((b) => (
                  <th key={b}>{namaBulan[b]}</th>
                ))}
                <th>Capaian</th>
              </tr>
            </thead>
            <tbody>
              {rekap.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + (meta?.periode?.bulan?.length || 0)}
                    className="text-center text-muted"
                  >
                    {loading ? "Memuat data..." : "Belum ada data rekapitulasi"}
                  </td>
                </tr>
              ) : (
                rekap.map((r, i) => (
                  <tr key={r.indikator_id || `${r.indikator}-${i}`}>
                    <td className="text-center">{i + 1}</td>
                    <td>{r.indikator || "-"}</td>
                    <td>
                      {r.target ?? "-"} {r.satuan || ""}
                    </td>
                    {(meta?.periode?.bulan || []).map((b) => (
                      <td key={b} className="text-center">
                        {formatCapaian(r.bulan?.[b], r.measurement)}
                      </td>
                    ))}
                    <td className="fw-bold text-center">
                      {formatCapaian(r.capaian, r.measurement)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapitulasiSPM;
