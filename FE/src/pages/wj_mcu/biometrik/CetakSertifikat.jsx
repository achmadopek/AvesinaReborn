import { useEffect, useState, useRef } from "react";
import logoRSUD from "../../../assets/rswjlogo.png";
import logoPemda from "../../../assets/pemdalogo.png";
import { formatSortDate } from "../../../utils/FormatDate";
import { useParams } from "react-router-dom";
import { fetchMirrorMCUById } from "../../../api/wj_mcu/MirrorMCU";

import html2pdf from "html2pdf.js";

/* ================= HELPER ================= */

const renderTextBasedResult = (visits, header) => {
  const visitMCU = visits.find(v => v.unit_code === "MCU");
  const visitLab = visits.find(v => v.unit_code === "LB001");
  const visitRad = visits.find(v => v.unit_code === "RA001");

  const visitOthers = visits.filter(
    v =>
      !["MCU", "LB001", "RA001"].includes(v.unit_code) &&
      v.unit_code !== "140902843901RSJK" // Psikiatri disembunyikan
  );

  return (
    <div style={{ whiteSpace: "pre-line" }}>
      <p><strong>Hasil pemeriksaan sebagai berikut :</strong></p>

      {/* ================= PEMERIKSAAN UMUM ================= */}
      <strong>PEMERIKSAAN UMUM</strong>
      <div className="ms-3 mb-2">
        {visitMCU?.hasil?.length > 0
          ? visitMCU.hasil.map((h, i) => (
            <div key={i}>{h}</div>
          ))
          : "-"}
      </div>

      {/* ================= LAB ================= */}
      <strong>PEMERIKSAAN LABORATORIUM</strong>
      <div className="ms-3 mb-2">
        {visitLab?.hasil?.length > 0
          ? visitLab.hasil.map((h, i) => (
            <div key={i}>{h}</div>
          ))
          : "-"}
      </div>

      {visitLab?.kesimpulan && (
        <>
          <strong>Kesimpulan Laboratorium</strong>
          <div className="ms-3 mb-2">{visitLab.kesimpulan}</div>
        </>
      )}

      {visitLab?.saran && (
        <>
          <strong>Saran Laboratorium</strong>
          <div className="ms-3 mb-2">{visitLab.saran}</div>
        </>
      )}

      {/* ================= RADIOLOGI ================= */}
      <strong>PEMERIKSAAN RADIOLOGI</strong>
      <div className="ms-3 mb-2">
        {visitRad?.hasil?.length > 0
          ? visitRad.hasil.map((h, i) => (
            <div key={i}>{h}</div>
          ))
          : "-"}
      </div>

      {visitRad?.kesimpulan && (
        <>
          <strong>Kesimpulan Radiologi</strong>
          <div className="ms-3 mb-2">{visitRad.kesimpulan}</div>
        </>
      )}

      {visitRad?.saran && (
        <>
          <strong>Saran Radiologi</strong>
          <div className="ms-3 mb-2">{visitRad.saran}</div>
        </>
      )}

      {/* ================= PEMERIKSAAN LAIN ================= */}
      <strong>PEMERIKSAAN LAIN</strong>
      <div className="ms-3 mb-3">
        {visitOthers.length > 0
          ? visitOthers.map((v, i) => (
            <div key={i}>
              {v.unit_name} :{" "}
              {v.diagnosa?.length
                ? v.diagnosa
                  .map(d => d.detail || d.master)
                  .filter(Boolean)
                  .join(", ")
                : "-"}
            </div>
          ))
          : "-"}
      </div>

      <strong>KESIMPULAN :</strong>
      <div className="ms-3 mb-2">{header.kesimpulan || "-"}</div>

      <strong>REKOMENDASI :</strong>
      <div className="ms-3">{header.rekomendasi || "-"}</div>
    </div>
  );
};

/* ================= COMPONENT ================= */

const CetakSertifikat = () => {
  const { mcu_id } = useParams();
  const [data, setData] = useState(null);
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    console.log("MCU ID:", mcu_id);
  }, [mcu_id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Fetching MCU ID:", mcu_id);

        const res = await fetchMirrorMCUById(mcu_id);

        console.log("Response:", res);

        if (res?.success) {
          setData(res.data);
        } else {
          console.error("Response gagal:", res);
        }
      } catch (err) {
        console.error("Error fetch:", err);
      }
    };

    if (mcu_id) loadData();
  }, [mcu_id]);

  /*useEffect(() => {
    if (data && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [data]);*/

  const handleCetak = () => {
    const element = document.getElementById("pdf-area");

    html2pdf()
      .set({
        margin: 2,
        filename: "MCU_" + header.nrm + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .save();
  };

  const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.5.142:3001";

  if (!data) return <div>Memuat...</div>;

  const { header, visits } = data;

  console.log("FACE IMAGE:", header.face_image);

  return (
    <>
      <div
        id="pdf-area"
        style={{
          fontSize: "12pt",
          lineHeight: "1",
          fontFamily: "Times New Roman",
          color: "#000",
          margin: "1.5cm 2cm",
        }}
      >
        {/* ================= KOP ================= */}
        <div className="text-center mb-3" style={{ lineHeight: "1" }}>
          <img
            src={logoPemda}
            alt="Logo Pemda"
            height="90"
            className="m-1"
            style={{ float: "left" }}
          />
          <img
            src={logoRSUD}
            alt="Logo RSWJ"
            height="90"
            className="m-1"
            style={{ float: "right" }}
          />

          <strong style={{ fontSize: "14pt" }}>
            PEMERINTAH KABUPATEN PROBOLINGGO
          </strong>
          <br />
          <span style={{ fontSize: "14pt" }}>DINAS KESEHATAN</span>
          <br />
          <strong style={{ fontSize: "14pt" }}>UOBK RSUD WALUYO JATI</strong>
          <br />
          <small>
            Jl. Dr. Soetomo No. 1 Telp.(0335) 841118, 841481 Fax. (0335) 841160
          </small>
          <br />
          <strong>KRAKSAAN PROBOLINGGO 67282</strong>
          <br />
          <small style={{ display: "block", fontSize: "8pt" }}>
            Website : http://rsudwaluyojati.probolinggokab.go.id / E-mail :
            rsudwaluyojati@probolinggokab.go.id
          </small>

          <hr />

          <h6>
            <b className="text-decoration-underline">
              SURAT KETERANGAN GENERAL CHECK UP
            </b>
            <br />
            <span>Nomor : {header.nomor_surat_final}</span>
          </h6>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          {/* ================= IDENTITAS ================= */}
          <div style={{ width: "70%" }}>
            <p>
              Yang bertanda tangan di bawah ini dokter RSUD Waluyo Jati Kraksaan
              menerangkan bahwa
            </p>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
                lineHeight: "2"
              }}
            >
              <tbody>
                <tr>
                  <td width="160">Nama</td>
                  <td>: {header.nama}</td>
                </tr>
                <tr>
                  <td>NRM</td>
                  <td>: {header.nrm}</td>
                </tr>
                <tr>
                  <td>Umur</td>
                  <td>: {header.umur} tahun</td>
                </tr>
                <tr>
                  <td>Alamat</td>
                  <td>: {header.alamat}</td>
                </tr>
                <tr>
                  <td>Tanggal Pemeriksaan</td>
                  <td>: {formatSortDate(header.tgl_periksa)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================= FOTO PASIEN ================= */}
          {header.face_image && (
            <div
              style={{
                width: 170,
                border: "1px solid #000",
                borderRadius: 12,
                padding: 8,
                backgroundColor: "#fff",
                textAlign: "center"
              }}
            >
              <img
                src={
                  header.face_image?.startsWith("data:")
                    ? header.face_image
                    : `${BASE_URL}${header.face_image}`
                }
                alt="Foto Pasien"
                style={{
                  width: 140,
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 10
                }}
              />
            </div>
          )}
        </div>

        {/* ================= HASIL PEMERIKSAAN (TEXT BASE) ================= */}
        {renderTextBasedResult(visits, header)}

        <p className="mt-3">
          Demikian surat keterangan ini dibuat dengan sebenarnya untuk digunakan
          sebagaimana mestinya.
        </p>

        {/* ================= TTD ================= */}
        <div className="row mt-5">
          <div className="col-6" />
          <div className="col-6 text-center">
            <p>Probolinggo, {formatSortDate(header.tgl_periksa)}</p>
            <p>Dokter Pemeriksa</p>
            <br />
            <br />
            <br />
            <strong className="text-decoration-underline">
              dr. NANIK TRIANA KARTIKASARI, Sp.PD
            </strong>
            <br />
            <small>NIP. 19800725 200903 2 002</small>
          </div>
        </div>
      </div>

      <button onClick={handleCetak}>Cetak PDF</button>
    </>
  );
};

export default CetakSertifikat;
