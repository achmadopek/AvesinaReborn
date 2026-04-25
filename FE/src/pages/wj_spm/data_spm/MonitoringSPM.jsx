import { useState, useEffect, Fragment, useMemo } from "react";
import {
  fetchRekapSPMBulanan
} from "../../../api/wj_spm/DataSPM";
import { toast } from "react-toastify";
import {
  fetchRuanganByInstalasi
} from "../../../api/wj_spm/VerifikasiSPM";
import {
  fetchRuangan
} from "../../../api/wj_spm/EntriHarian";
import VerifikasiSPMModal from "./VerifikasiSPMModal";
import { useAuth } from "../../../context/AuthContext";

const MonitoringSPM = () => {
  const { units, peg_id, role } = useAuth();

  const today = new Date();
  const bulanInit = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [bulan, setBulan] = useState(bulanInit);

  const [loading, setLoading] = useState(false);

  const [unitId, setUnitId] = useState("");
  const [ruanganList, setRuanganList] = useState([]);

  const [showVerifModal, setShowVerifModal] = useState(false);
  const [selectedSPM, setSelectedSPM] = useState(null);

  const [indikatorData, setIndikatorData] = useState([]);
  const [harianData, setHarianData] = useState({});

  // Memuat data rekap dari API
  const handleLoadData = async () => {
    if (!bulan) {
      toast.warn("Silakan pilih bulan");
      return;
    }

    if (!unitId) {
      toast.warn("Silakan pilih unit");
      return;
    }

    setLoading(true);

    const unitName =
      unitMap[unitId]?.nama_ruangan || "Unit tidak ditemukan";

    try {
      const res = await fetchRekapSPMBulanan(unitId, bulan);
      setIndikatorData(res.data?.indikator || []);

      // ubah array harian jadi object keyed by tanggal
      const harianObj = {};
      (res.data?.harian || []).forEach((h) => {
        harianObj[h.tanggal] = h;
      });

      setHarianData(harianObj);

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat rekap SPM bulanan");
      setIndikatorData([]);
      setHarianData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (!peg_id) return;

    const loadRuangan = async () => {
      try {
        let ruangan = [];

        if (role === "verifikator_spm") {
          const res = await fetchRuanganByInstalasi(peg_id, role, units);
          ruangan = res.data || [];

        } else if (role === "user_spm") {
          const res = await fetchRuangan();
          const allRuangan = res.data || [];

          ruangan = allRuangan.filter((r) =>
            units.includes(r.srvc_unit_id)
          );

        } else if (role === "admin_spm") {
          const res = await fetchRuangan();
          ruangan = res.data || [];
        }

        setRuanganList(ruangan);

      } catch (err) {
        console.error("ERROR LOAD RUANGAN:", err);
        toast.error("Gagal load ruangan");
        setRuanganList([]);
      }
    };

    loadRuangan();

  }, [peg_id, role, units]);

  const handleOpenVerifikasi = (dataHarian, tanggal) => {

    if (!dataHarian?.harian_id) {
      toast.warning("SPM harian belum diinput");
      return;
    }

    setSelectedSPM({
      harian_id: dataHarian.harian_id,
      tanggal,
      status_verifikasi: dataHarian.status_verifikasi,
      catatan_verifikasi: dataHarian.catatan_verifikasi,
    });

    setShowVerifModal(true);
  };

  // hitung jumlah hari dalam bulan terpilih (YYYY-MM)
  const daysInMonth = new Date(
    Number(bulan.split("-")[0]),     // tahun
    Number(bulan.split("-")[1]),     // bulan + 1
    0                                // hari ke-0 = hari terakhir bulan sebelumnya
  ).getDate();

  // helper array tanggal 1..n
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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


  // -------------------------
  // Render UI
  // -------------------------
  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Monitoring SPM Unit</h6>
        </div>

        <div className="card-body px-3 py-3">
          {/* Filter tanggal */}
          <div className="d-flex flex-wrap align-items-end mb-3">
            {/* Jenis filter tanggal */}
            <div className="me-2">
              <label className="form-label mb-1 fw-semibold">Bulan</label>
              <input
                type="month"
                className="form-control form-control-sm"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              />
            </div>

            {/* PILIH UNIT */}
            <div className="me-2" style={{ minWidth: "200px" }}>
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

            {/* Tampilkan */}
            <div className="mt-3 mt-sm-0">
              <button
                onClick={handleLoadData}
                className="btn btn-outline-primary ms-sm-2"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>

            {/*<div className="ms-auto">
              <div className="d-flex gap-2">
                {/* Tombol Export & Cetak 
                <div className="d-flex">
                  <button
                    className="btn btn-success btn-sm me-2"
                  //onClick={handleExportToExcel}
                  >
                    Export Excel
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                  //onClick={handleCetakToPdf}
                  >
                    Cetak PDF
                  </button>
                </div>
              </div>
            </div>*/}
          </div>

          {/* Table utama */}
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>No</th>
                <th>SPM Indicator</th>
                {[...Array(daysInMonth)].map((_, i) => (
                  <th key={i} className="text-center">{i + 1}</th>
                ))}
                <th className="text-center">Jumlah</th>
                <th className="text-center">Standar/SPM</th>
              </tr>
            </thead>

            <tbody>
              {indikatorData.map((indikator, i) => (
                <Fragment key={indikator.indikator_id}>
                  <tr className="fw-bold">
                    <td rowSpan={6} className="text-center"><br />{i + 1}</td>
                    <td colSpan={daysInMonth + 2}>
                      <br />
                      {indikator.nama_indikator}
                    </td>
                    <td rowSpan={5} className="text-center align-middle">
                      {indikator.operator}<br />
                      {indikator.standart}<br />
                      {indikator.measurement}
                    </td>
                  </tr>

                  <tr>
                    <td rowSpan={2}>Num :</td>
                    <td colSpan={daysInMonth + 2}>
                      {indikator.nama_numerator}
                    </td>
                  </tr>
                  <tr>
                    {[...Array(daysInMonth)].map((_, i) => {
                      const tgl = `${bulan}-${String(i + 1).padStart(2, "0")}`;
                      return (
                        <td key={i} className="text-center">
                          {indikator.data?.[tgl]?.numerator ?? "-"}
                        </td>
                      );
                    })}
                    <td className="text-center">{indikator.total_numerator}</td>
                  </tr>

                  <tr>
                    <td rowSpan={2}>Den :</td>
                    <td colSpan={daysInMonth + 2}>
                      {indikator.nama_denominator}
                    </td>
                  </tr>
                  <tr>
                    {[...Array(daysInMonth)].map((_, i) => {
                      const tgl = `${bulan}-${String(i + 1).padStart(2, "0")}`;
                      return (
                        <td key={i} className="text-center">
                          {indikator.data?.[tgl]?.denominator ?? "-"}
                        </td>
                      );
                    })}
                    <td className="text-center">{indikator.total_denominator}</td>
                  </tr>

                  <tr height={40}>
                    <td className="align-middle">Pencapaian</td>
                    {[...Array(daysInMonth)].map((_, i) => {
                      const tgl = `${bulan}-${String(i + 1).padStart(2, "0")}`;
                      const d = indikator.data?.[tgl];

                      if (!d || d.memenuhi === null) return <td key={i} className="align-middle text-center">-</td>;

                      return (
                        <td key={i} className="text-center align-middle">
                          {d.memenuhi ? (
                            <i className="fas fa-check-circle text-success"></i>
                          ) : (
                            <i className="fas fa-times-circle text-danger"></i>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center align-middle"></td>
                    <td className="text-center fw-bold align-middle" colSpan={daysInMonth + 1}>{Number(indikator.nilai_akhir)} {indikator.measurement}</td>
                  </tr>

                </Fragment>
              ))}

              <tr><td></td></tr>

              <tr>
                <td colSpan={2} height={50} className="fw-bold fs-5 align-middle">
                  Verifikasi
                </td>

                {daysArray.map((day, i) => {
                  const tgl = `${bulan}-${String(day).padStart(2, "0")}`;
                  const d = harianData[tgl];

                  if (!d || !d.harian_id)
                    return <td key={i} className="align-middle text-center"> <i className="far fa-minus text-muted fs-3"></i></td>;

                  return (
                    <td key={i} className="text-center fs-5 align-middle">
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleOpenVerifikasi(d, tgl)}
                      >
                        {d.status_verifikasi === 1 ? (
                          <i className="fas fa-check-circle text-success fs-4"></i>
                        ) : d.status_verifikasi === 0 ? (
                          <i className="fas fa-times-circle text-danger fs-4"></i>
                        ) : (
                          <i className="fas fa-clock text-secondary fs-4"></i>
                        )}
                      </span>
                    </td>
                  );
                })}

                <td></td>
              </tr>

            </tbody>
          </table>

        </div>
      </div>

      <VerifikasiSPMModal
        show={showVerifModal}
        data={selectedSPM}
        onClose={(refresh) => {
          setShowVerifModal(false);
          setSelectedSPM(null);
          if (refresh) handleLoadData();
        }}
      />
    </>
  );

};

export default MonitoringSPM;
