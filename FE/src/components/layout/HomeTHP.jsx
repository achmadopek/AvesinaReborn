import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import {
  getData,
  getDataCart,
  getTopTHP,
  getBottomTHP,
} from "../../api/wj_thp/DashboardTHP";
import { formatNumber } from "../../utils/FormatNumber";
import HistoryTakeHomePay from "../../pages/wj_thp/endroll/HistoryTakeHomePay";
import HistoryKegiatan from "../../pages/wj_sdm/kegiatan/HistoryKegiatan";
import HistoryPresensi from "../../pages/wj_sdm/presensi/HistoryPresensi";
import HistoryMutasi from "../../pages/wj_sdm/mutasi/HistoryMutasi";

const HomeTHP = ({ setRightContent }) => {
  const { peg_id: userPegId, role } = useAuth();

  const [thpData, setThpData] = useState(null);
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [topThp, setTopThp] = useState([]);
  const [bottomThp, setBottomThp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ===================== Helper =====================
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const monthsTemplate = [
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
  ].map((bulan) => ({
    bulan,
    Pendapatan: 0,
    Potongan: 0,
    Bersih: 0,
  }));

  const css = getComputedStyle(document.documentElement);

  const chartColor = {
    tagihan: css.getPropertyValue("--chart-primary").trim(),
    lunas: css.getPropertyValue("--chart-success").trim(),
    hutang: css.getPropertyValue("--chart-danger").trim(),
    text: css.getPropertyValue("--color-text").trim(),
    grid: css.getPropertyValue("--color-table-border").trim(),
  };

  // ===================== Fetch Total THP =====================
  useEffect(() => {
    if (!userPegId) return;
    const periode = getCurrentPeriod();
    setLoading(true);

    getData(userPegId, periode)
      .then((data) => {
        setThpData(data);
      })
      .catch((err) => {
        console.error("❌ Gagal ambil data THP:", err);
        setThpData(null);
      })
      .finally(() => setLoading(false));
  }, [userPegId]);

  // ===================== Ringkasan =====================
  const summary = thpData
    ? {
        pendapatan: Number(thpData.total_penghasilan),
        potongan: Number(thpData.total_potongan),
        bersih: Number(thpData.thp),
      }
    : {
        pendapatan: 0,
        potongan: 0,
        bersih: 0,
      };

  // ===================== Right Content =====================
  useEffect(() => {
    setRightContent(
      <>
        <HistoryTakeHomePay />
        <br />
        <HistoryKegiatan />
        <br />
        <HistoryPresensi />
        <br />
        <HistoryMutasi />
      </>
    );
  }, [setRightContent]);

  // ===================== Chart Data =====================
  useEffect(() => {
    if (!userPegId) return;

    getDataCart(userPegId)
      .then((res) => {
        const items = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];

        const merged = [...monthsTemplate];
        items.forEach((item) => {
          const target = merged.find((m) => m.bulan === item.bulan);
          if (target) {
            target.Pendapatan = item.Pendapatan || 0;
            target.Potongan = item.Potongan || 0;
            target.Bersih = item.Bersih || 0;
          }
        });

        setBarData(merged);
        setLineData(merged);
      })
      .catch((err) => {
        console.error("❌ Gagal ambil data bar chart:", err);
        setBarData(monthsTemplate);
        setLineData(monthsTemplate);
      });
  }, [userPegId]);

  // ===================== Top & Bottom 5 =====================
  useEffect(() => {
    const today = new Date();
    const periode = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    const fetchTopThp = async () => {
      try {
        const res = await getTopTHP(periode);
        setTopThp(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("❌ Gagal ambil top THP:", err);
        setTopThp([]);
      }
    };

    const fetchBottomThp = async () => {
      try {
        const res = await getBottomTHP(periode);
        setBottomThp(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("❌ Gagal ambil bottom THP:", err);
        setBottomThp([]);
      }
    };

    fetchTopThp();
    fetchBottomThp();
  }, []);

  // ===================== Render =====================
  return (
    <div className="container-fluid py-0 px-0">
      {/* === Ringkasan === */}
      <div className={isMobile ? "row mb-3 mt-3" : "row mb-3 mt-0"}>
        {["Seluruh Pendapatan", "Seluruh Potongan", "Penghasilan Bersih"].map(
          (title, index) => {
            const icons = [
              "fa-coins icon-bedge",
              "fa-minus-circle icon-bedge",
              "fa-wallet icon-bedge",
            ];
            const values = [
              summary.pendapatan,
              summary.potongan,
              summary.bersih,
            ];
            const bgs = ["bg-primary", "bg-danger", "bg-success"];

            return (
              <div className="col-12 col-lg-4 mb-2" key={title}>
                <div
                  className={`card ${bgs[index]} text-white shadow-sm h-100 border-0`}
                >
                  <div className="card-body text-center rounded">
                    <h5 className="card-title mb-1 text-right">
                      <i className={`fas ${icons[index]} me-2`}></i>
                      {title}
                    </h5>

                    <div className="d-flex justify-content-end align-items-baseline flex-wrap gap-1">
                      <span className="fw-semibold fs-6 fs-lg-5">Rp.</span>
                      <span className="fw-bold fs-3 fs-lg-1 lh-1 text-wrap text-end text-break">
                        {loading ? (
                          <span
                            className="spinner-border spinner-border-sm text-light"
                            role="status"
                          />
                        ) : (
                          formatNumber(values[index])
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* === Chart === */}
      <div className="row mb-3">
        {/* Pendapatan vs Potongan */}
        <div
          className={role === "pegawai" ? "col-md-12 mb-3" : "col-md-6 mb-3"}
        >
          <div className="card card-theme shadow-sm">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Pendapatan vs Potongan</h6>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barData}>
                <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 3" />
                <XAxis dataKey="bulan" tick={{ fill: chartColor.text, fontSize: 10 }} />
                <YAxis unit=" jt" tick={{ fill: chartColor.text }} />
                <Tooltip contentStyle={{
                  backgroundColor: "var(--color-card-body)",
                  borderColor: chartColor.grid,
                  color: chartColor.text,
                }}/>
                <Bar dataKey="Pendapatan" fill={chartColor.tagihan} />
                <Bar dataKey="Potongan" fill={chartColor.hutang} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tren Take Home Pay */}
        <div
          className={role === "pegawai" ? "col-md-12 mb-3" : "col-md-6 mb-3"}
        >
          <div className="card card-theme shadow-sm">
            <div className="card-header py-2 px-3">
              <h6 className="mb-0">Tren Take Home Pay</h6>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis unit=" jt" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Bersih"
                  stroke={chartColor.lunas}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* === Top & Bottom 5 === */}
      {role !== "pegawai" && (
        <>
          {/* Top 5 */}
          <div className="row">
            <div className="col-md-12 mb-0 mt-0">
              <div className="card card-theme shadow-sm">
                <div className="card-header py-2 px-3">
                  <h6 className="mb-0">Top 5 Take Home Pay</h6>
                </div>
                <div className="card-body px-3 py-2">
                  <div className="table-responsive">
                    <table className="table table-theme table-bordered">
                      <thead>
                        <tr>
                          <th>Nama</th>
                          <th>Status</th>
                          <th>Gaji Bersih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topThp.length > 0 ? (
                          topThp.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.nama}</td>
                              <td>{row.status}</td>
                              <td>
                                {row.gaji_bersih?.toLocaleString("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              Tidak ada data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <br />

          {/* Bottom 5 */}
          <div className="row">
            <div className="col-md-12">
              <div className="card card-theme shadow-sm">
                <div className="card-header py-2 px-3">
                  <h6 className="mb-0">Bottom 5 Take Home Pay</h6>
                </div>
                <div className="card-body px-3 py-2">
                  <div className="table-responsive">
                    <table className="table table-theme table-bordered">
                      <thead>
                        <tr>
                          <th>Nama</th>
                          <th>Status</th>
                          <th>Gaji Bersih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bottomThp.length > 0 ? (
                          bottomThp.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.nama}</td>
                              <td>{row.status}</td>
                              <td>
                                {row.gaji_bersih?.toLocaleString("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              Tidak ada data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HomeTHP;
