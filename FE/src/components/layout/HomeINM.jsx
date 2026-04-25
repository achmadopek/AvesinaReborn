import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "react-toastify";

import { fetchRekapINMIndikator } from "../../api/wj_inm/DashboardINM";

// contoh API list (sesuaikan dengan punyamu)
import { fetchRuangan, fetchInstalasi, fetchBidang } from "../../api/wj_inm/EntriHarian";

const HomeINM = () => {
  // ================= STATE =================
  const [rekap, setRekap] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  // ================= FILTER =================
  const now = new Date();
  const [mode, setMode] = useState("instalasi");
  const [selectedId, setSelectedId] = useState("");

  const [RefId, setRefId] = useState();
  const [listUnit, setListUnit] = useState([]);
  const [listInstalasi, setListInstalasi] = useState([]);
  const [listBidang, setListBidang] = useState([]);

  const [periode, setPeriode] = useState("TW1");
  const [year, setYear] = useState(now.getFullYear());

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [selectedIndikatorId, setSelectedIndikatorId] = useState(null);

  const indikatorAktif =
    rekap.find((r) => r.indikator_id === selectedIndikatorId) || rekap[0];

  const namaBulan = [
    "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  // ================= HELPER =================
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

  // -------------------------
  // Load master data sesuai mode
  // -------------------------
  useEffect(() => {
    const loadMaster = async () => {
      try {
        if (mode === "unit") {
          const res = await fetchRuangan();
          const data = res.data || [];
          setListUnit(data);

          if (data.length > 0) {
            setSelectedId(data[0].ruangan_id);
            setRefId(data[0].ruangan_id);
          }
        }

        if (mode === "instalasi") {
          const res = await fetchInstalasi();
          const data = res.data || [];
          setListInstalasi(data);

          if (data.length > 0) {
            setSelectedId(data[0].instalasi_id);
            setRefId(data[0].instalasi_id);
          }
        }

        if (mode === "bidang") {
          const res = await fetchBidang();
          const data = res.data || [];
          setListBidang(data);

          if (data.length > 0) {
            setSelectedId(data[0].bidang_id);
            setRefId(data[0].bidang_id);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat data master");
      }
    };

    loadMaster();
  }, [mode]);

  useEffect(() => {
    if (selectedId) {
      setRefId(selectedId);
    }
  }, [selectedId]);

  // ================= FETCH =================
  const fetchDashboard = async () => {
    if (!selectedId) {
      toast.warn(`Pilih ${mode} terlebih dahulu`);
      return;
    }

    try {
      setLoading(true);

      const range = getRangeByPeriode(year, periode);
      if (!range) return;

      setStart(range.start);
      setEnd(range.end);

      const res = await fetchRekapINMIndikator(
        mode,
        selectedId,
        range.start,
        range.end
      );

      setRekap(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error("Fetch INM error:", err.response?.data || err.message);
      toast.error("Gagal memuat rekap indikator");
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER SELECT MODE =====
  // -------------------------
  // Render select target
  // -------------------------
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
            <option key={`${mode}-${u.ruangan_id}`} value={u.ruangan_id}>
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
            <option key={`${mode}-${i.instalasi_id}`} value={i.instalasi_id}>
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
            <option key={`${mode}-${b.bidang_id}`} value={b.bidang_id}>
              {b.kode_bidang} - {b.nama_bidang}
            </option>
          ))}
        </select>
      );
    }

    return null;
  };

  // ================= RENDER =================
  return (
    <div className="container-fluid px-2">

      {/* HEADER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-1">
            Dashboard INM – {meta?.nama || "-"}
          </h5>
          <small className="text-muted">
            Periode: {start} s/d {end}
          </small>
        </div>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <b>Filter Grafik</b>
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
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <b>Rekap Indikator Mutu</b>
        </div>

        <div className="card-body table-responsive">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>No</th>
                <th>Indikator</th>
                <th>Target</th>
                {meta?.periode?.bulan?.map((b) => (
                  <th key={b}>{namaBulan[b]}</th>
                ))}
                <th>Capaian</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map((r, i) => (
                <tr key={r.indikator_id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{r.indikator}</td>
                  <td>{r.target} {r.satuan}</td>

                  {meta?.periode?.bulan?.map((b) => (
                    <td key={b} className="text-center">
                      {r.bulan?.[b] !== null && r.bulan?.[b] !== undefined
                        ? `${r.bulan[b]}%`
                        : "-"}
                    </td>
                  ))}

                  <td className="fw-bold text-center">
                    {r.capaian ? `${r.capaian}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && rekap.length === 0 && (
            <div className="text-center text-muted">
              Tidak ada data
            </div>
          )}
        </div>
      </div>

      {/* CHART */}
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <b>Grafik Benchmark</b>
        </div>
        <div className="card-body row m-1">
          {rekap.map((indikator) => {
            const chartData =
              meta?.periode?.bulan?.map((b) => ({
                bulan: namaBulan[b],
                nilai: indikator.bulan?.[b] ?? null,
                target: indikator.target ?? null,
              })) || [];

            return (
              <div className="card shadow-sm mb-3 col-12 col-md-6" key={indikator.indikator_id}>
                <div className="card-header">
                  <b>{indikator.indikator}</b>
                </div>

                <div className="card-body" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bulan" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />

                      {/* nilai capaian */}
                      <Line
                        type="monotone"
                        dataKey="nilai"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot
                        connectNulls
                        name="Capaian"
                      />

                      {/* garis target */}
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        dot={false}
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default HomeINM;
