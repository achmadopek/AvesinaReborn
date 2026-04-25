import { useState, useEffect, Fragment } from "react";
import {
  fetchRekapINMBulanan
} from "../../../api/wj_inm/DataINM";
import { toast } from "react-toastify";
import {
  fetchRuangan,
} from "../../../api/wj_inm/EntriHarian";
import VerifikasiINMModal from "./VerifikasiINMModal";

const MonitoringINM = () => {

  const today = new Date();
  const bulanInit = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [bulan, setBulan] = useState(bulanInit);

  const [loading, setLoading] = useState(false);

  const [unitId, setUnitId] = useState("");
  const [ruanganList, setRuanganList] = useState([]);

  const [showVerifModal, setShowVerifModal] = useState(false);
  const [selectedINM, setSelectedINM] = useState(null);

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
    try {
      const res = await fetchRekapINMBulanan(unitId, bulan);
      setIndikatorData(res.data?.indikator || []);

      // ubah array harian jadi object keyed by tanggal
      const harianObj = {};
      (res.data?.harian || []).forEach((h) => {
        harianObj[h.tanggal] = h;
      });

      setHarianData(harianObj);

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat rekap INM bulanan");
      setIndikatorData([]);
      setHarianData({});
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenVerifikasi = (dataHarian, tanggal) => {

    if (!dataHarian?.harian_id) {
      toast.warning("INM harian belum diinput");
      return;
    }

    setSelectedINM({
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


  // -------------------------
  // Render UI
  // -------------------------
  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Monitoring INM Unit</h6>
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

            <div className="ms-auto">
              <div className="d-flex gap-2">
                {/* Tombol Export & Cetak */}
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
            </div>
          </div>

          {/* Table utama */}
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>INM Indicator</th>
                {[...Array(daysInMonth)].map((_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
                <th>Jumlah</th>
              </tr>
            </thead>

            <tbody>
              {indikatorData.map((indikator) => (
                <Fragment key={indikator.indikator_id}>
                  <tr className="fw-bold">
                    <td colSpan={daysInMonth + 2}>
                      {indikator.nama_indikator}
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
                        <td key={i}>
                          {indikator.data?.[tgl]?.numerator ?? "-"}
                        </td>
                      );
                    })}
                    <td>{indikator.total_numerator}</td>
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
                        <td key={i}>
                          {indikator.data?.[tgl]?.denominator ?? "-"}
                        </td>
                      );
                    })}
                    <td>{indikator.total_denominator}</td>
                  </tr>

                  <tr>
                    <td>Pencapaian</td>
                    {[...Array(daysInMonth)].map((_, i) => {
                      const tgl = `${bulan}-${String(i + 1).padStart(2, "0")}`;
                      const d = indikator.data?.[tgl];

                      if (!d || d.memenuhi === null) return <td key={i}>-</td>;

                      return (
                        <td key={i} className="text-center">
                          {d.memenuhi ? (
                            <i className="fas fa-check-circle text-success"></i>
                          ) : (
                            <i className="fas fa-times-circle text-danger"></i>
                          )}
                        </td>
                      );
                    })}
                    <td colSpan={daysInMonth + 1}>{indikator.persen}</td>
                  </tr>

                </Fragment>
              ))}

              <tr><td></td></tr>

              <tr>
                <td className="fw-bold fs-5">Verifikasi</td>

                {daysArray.map((day, i) => {
                  const tgl = `${bulan}-${String(day).padStart(2, "0")}`;
                  const d = harianData[tgl];

                  if (!d || !d.harian_id)
                    return <td key={i}> <i className="far fa-minus text-muted fs-3"></i></td>;

                  return (
                    <td key={i} className="text-center fs-5">
                      <span
                        style={{
                          cursor: "pointer",
                          opacity: 1,
                        }}
                        onClick={() => {
                          handleOpenVerifikasi(d, tgl);
                        }}
                      >
                        {d.status_verifikasi === 1 ? (
                          <i className="fas fa-check-square text-success fs-4"></i>
                        ) : d.status_verifikasi === 0 ? (
                          <i className="fas fa-times-circle text-danger fs-4"></i>
                        ) : (
                          <i className="far fa-square text-muted fs-4"></i>
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

      <VerifikasiINMModal
        show={showVerifModal}
        data={selectedINM}
        onClose={(refresh) => {
          setShowVerifModal(false);
          setSelectedINM(null);
          if (refresh) handleLoadData();
        }}
      />
    </>
  );

};

export default MonitoringINM;
