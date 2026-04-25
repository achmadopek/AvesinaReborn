import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchRekapSPMRingkas } from "../../../api/wj_spm/DataSPM";

// contoh API list (sesuaikan dengan punyamu)
import { fetchRuangan, fetchInstalasi, fetchBidang } from "../../../api/wj_spm/EntriHarian";

const RekapRingkasSPM = () => {
  const [mode, setMode] = useState("unit"); // unit | instalasi | bidang
  const [selectedId, setSelectedId] = useState("");

  const [jenisWaktu, setJenisWaktu] = useState("triwulan");
  const [triwulan, setTriwulan] = useState("1");
  const [semester, setSemester] = useState("1");
  const [tahun, setTahun] = useState("");

  const [listUnit, setListUnit] = useState([]);
  const [listInstalasi, setListInstalasi] = useState([]);
  const [listBidang, setListBidang] = useState([]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const bulanLabel = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  // Helper Date Range
  const getDateRange = ({ jenisWaktu, triwulan, semester, tahun }) => {
    const y = parseInt(tahun);

    if (!y || !jenisWaktu) return null;

    if (jenisWaktu === "tahun") {
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      };
    }

    if (jenisWaktu === "semester") {
      return semester === "1"
        ? { startDate: `${y}-01-01`, endDate: `${y}-06-30` }
        : { startDate: `${y}-07-01`, endDate: `${y}-12-31` };
    }

    if (jenisWaktu === "triwulan") {
      const map = {
        1: ["01-01", "03-31"],
        2: ["04-01", "06-30"],
        3: ["07-01", "09-30"],
        4: ["10-01", "12-31"],
      };

      const range = map[triwulan];
      if (!range) return null;

      return {
        startDate: `${y}-${range[0]}`,
        endDate: `${y}-${range[1]}`,
      };
    }

    return null;
  };

  //get bulan range
  const getBulanRange = (jenisWaktu, triwulan, semester) => {
    if (jenisWaktu === "triwulan") {
      const map = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12],
      };
      return map[triwulan] || [];
    }

    if (jenisWaktu === "semester") {
      return semester === "1"
        ? [1, 2, 3, 4, 5, 6]
        : [7, 8, 9, 10, 11, 12];
    }

    // tahunan
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  //susun array nama bulan
  const buildBulanArray = (periodeObj, tahun) => {
    const arr = [];

    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      const key = `${tahun}-${mm}`;
      arr.push(periodeObj?.[key] || 0);
    }

    return arr;
  };


  // -------------------------
  // Load master data sesuai mode
  // -------------------------
  useEffect(() => {
    setSelectedId("");
    setData([]);

    const loadMaster = async () => {
      try {
        if (mode === "unit") {
          const res = await fetchRuangan();
          setListUnit(res.data || []);
        } else if (mode === "instalasi") {
          const res = await fetchInstalasi();
          setListInstalasi(res.data || []);
        } else if (mode === "bidang") {
          const res = await fetchBidang();
          setListBidang(res.data || []);
        }
      } catch (err) {
        toast.error("Gagal memuat data master");
      }
    };

    loadMaster();
  }, [mode]);

  // -------------------------
  // Load rekap (pakai range date)
  // -------------------------
  const handleLoad = async () => {
    if (!tahun) {
      toast.warn("Tahun wajib diisi");
      return;
    }

    if (!jenisWaktu) {
      toast.warn("Pilih jenis periode");
      return;
    }

    if (!selectedId) {
      toast.warn(`Pilih ${mode} dulu`);
      return;
    }

    const range = getDateRange({
      jenisWaktu,
      triwulan,
      semester,
      tahun,
    });

    if (!range) {
      toast.warn("Periode tidak valid");
      return;
    }

    const { startDate, endDate } = range;

    setLoading(true);
    try {
      const res = await fetchRekapSPMRingkas(
        mode,
        selectedId,
        startDate,
        endDate
      );

      setData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat rekap ringkas");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="card shadow-sm card-theme">
      <div className="card-header bg-sae py-2 px-3">
        <h6 className="mb-0">Rekap Ringkas SPM</h6>
      </div>

      <div className="card-body px-3 py-3">

        {/* FILTER */}
        <div className="d-flex flex-wrap align-items-end mb-3 gap-2">

          {/* MODE */}
          <div>
            <label className="form-label mb-1 fw-semibold">Mode</label>
            <select
              className="form-control form-control-smw-auto"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="unit">Per Unit</option>
              <option value="instalasi">Per Instalasi</option>
              <option value="bidang">Per Bidang</option>
            </select>
          </div>

          {/* TARGET */}
          <div style={{ minWidth: "220px" }}>
            <label className="form-label mb-1 fw-semibold">
              {mode === "unit" && "Unit"}
              {mode === "instalasi" && "Instalasi"}
              {mode === "bidang" && "Bidang"}
            </label>
            {renderSelectTarget()}
          </div>

          {/* JENIS WAKTU */}
          <div>
            <label className="form-label mb-1 fw-semibold">Periode : </label>

            {tahun && (
              <small className="ms-2 text-muted">
                {getDateRange({ jenisWaktu, triwulan, semester, tahun }).start}
                {" s/d "}
                {getDateRange({ jenisWaktu, triwulan, semester, tahun }).end}
              </small>
            )}

            <div className="d-flex gap-2 flex-wrap align-items-end">
              <select
                className="form-control form-control-smw-auto"
                value={jenisWaktu}
                onChange={(e) => setJenisWaktu(e.target.value)}
              >
                <option value="triwulan">Triwulan</option>
                <option value="semester">Semester</option>
                <option value="tahun">Tahunan</option>
              </select>

              {jenisWaktu === "triwulan" && (
                <select
                  className="form-control form-control-smw-auto"
                  value={triwulan}
                  onChange={(e) => setTriwulan(e.target.value)}
                >
                  <option value="1">TW I</option>
                  <option value="2">TW II</option>
                  <option value="3">TW III</option>
                  <option value="4">TW IV</option>
                </select>
              )}

              {jenisWaktu === "semester" && (
                <select
                  className="form-control form-control-smw-auto"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1">Smt I</option>
                  <option value="2">Smt II</option>
                </select>
              )}

              <input
                type="number"
                className="form-control form-control-smw-auto"
                style={{ width: 90 }}
                placeholder="2025"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
            </div>

          </div>

          {/* BUTTON */}
          <div className="mt-3 mt-sm-0">
            <button
              className="btn btn-outline-primary"
              onClick={handleLoad}
              disabled={loading}
            >
              {loading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered table-sm text-center">
            <thead className="table-light">
              <tr>
                <th>
                  {mode === "unit" && "Unit"}
                  {mode === "instalasi" && "Instalasi"}
                  {mode === "bidang" && "Bidang"}
                </th>
                {getBulanRange(jenisWaktu, triwulan, semester).map((m) => (
                  <th key={m}>{bulanLabel[m - 1]}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-muted">
                    Belum ada data
                  </td>
                </tr>
              )}

              {data.map((row) => (
                <tr key={row.id || row.unit_id}>
                  <td className="text-start fw-semibold">
                    {row.nama_unit || row.nama_instalasi || row.nama_bidang}
                  </td>

                  {(() => {
                    const bulanRange = getBulanRange(jenisWaktu, triwulan, semester);
                    const dataBulan = buildBulanArray(row.periode, tahun);

                    let total = 0;

                    return (
                      <>
                        {bulanRange.map((m) => {
                          const val = dataBulan[m - 1];
                          total += val;

                          return (
                            <td key={m}>
                              {val > 0 ? (
                                <i
                                  className="fas fa-check-circle text-success"
                                  title={`${val} hari terisi`}
                                ></i>
                              ) : (
                                <i
                                  className="fas fa-times-circle text-danger"
                                  title="Belum ada data"
                                ></i>
                              )}
                            </td>
                          );
                        })}

                        <td className="fw-semibold">{total}</td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default RekapRingkasSPM;
