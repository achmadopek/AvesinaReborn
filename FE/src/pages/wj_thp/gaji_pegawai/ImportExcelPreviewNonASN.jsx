import React, { useState, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import { formatNumber } from "../../../utils/FormatNumber";
import { fetchPaginatedData } from "../../../api/wj_sdm/MasterPegawai";
import { Check, X, AlertTriangle } from "lucide-react";

const ImportExcelPreviewNonASN = ({ onDataImported, employeeSts }) => {
  const [previewData, setPreviewData] = useState([]);
  const [dbData, setDbData] = useState([]);

  const normalize = (val) => String(val || "").trim();

  const loadData = useCallback(async () => {
    try {
      const result = await fetchPaginatedData(
        1,
        10000,
        "",
        "",
        employeeSts?.join(",")
      );
      setDbData(result.data);
    } catch (err) {
      console.error("Gagal fetch data:", err);
    }
  }, [employeeSts]);

  useEffect(() => {
    if (employeeSts?.length) {
      loadData();
    } else {
      setDbData([]);
    }
  }, [employeeSts, loadData]);

  const parseNumber = (val) => {
    if (!val) return 0;
    return Number(String(val).replace(/[^0-9.-]/g, "")) || 0;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const startRow = 4; // baris mulai data
      const data = [];
      const skipKeywords = ["SUB TOTAL PERGOLONGAN", "TOTAL PER SATKER"];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return;

        const rows = row.values; // array, index mulai dari 1
        const colOffset = 0;

        const noUrut = rows[1 + colOffset]; // kolom B
        const nama = rows[2 + colOffset]; // kolom C

        if (
          !noUrut ||
          (typeof nama === "string" &&
            skipKeywords.some((k) => nama.includes(k)))
        ) {
          return;
        }

        const nikExcel = normalize(rows[3 + colOffset]); // kolom D
        const pegDb = dbData.find((d) => normalize(d.nik) === nikExcel);

        const gajiKotor = parseNumber(rows[5 + colOffset]);
        const siwaKpri = parseNumber(rows[6 + colOffset]);
        const angsKpri = parseNumber(rows[7 + colOffset]);
        const angsIbi = parseNumber(rows[8 + colOffset]);
        const potBpjs = parseNumber(rows[9 + colOffset]);
        const potIdi = parseNumber(rows[10 + colOffset]);
        const potIbi = parseNumber(rows[11 + colOffset]);

        // hitung ulang manual
        const jmlPotongan =
          siwaKpri + angsKpri + angsIbi + potBpjs + potIdi + potIbi;
        const jumlahBersih = gajiKotor - jmlPotongan;

        const pegawai = {
          no: noUrut,
          nama_pegawai: nama || "-",
          nik: nikExcel,
          nik_db: pegDb?.nik || null,
          no_rekening: rows[4 + colOffset] || "-",

          gaji_kotor: gajiKotor,
          siwa_kpri: siwaKpri,
          angs_kpri: angsKpri,
          angs_ibi: angsIbi,
          pot_bpjs: potBpjs,
          pot_idi: potIdi,
          pot_ibi: potIbi,

          jml_potongan: jmlPotongan,
          jumlah_bersih: jumlahBersih,

          sumber: "Excel",
        };

        data.push(pegawai);
      });

      // cari pegawai DB yang tidak ada di Excel
      const excelNikList = data.map((d) => normalize(d.nik));
      const dbNotInExcel = dbData
        .filter((d) => !excelNikList.includes(normalize(d.nik)))
        .map((d) => ({
          no: "-",
          nama_pegawai: d.employee_nm || "-",
          nik: d.nik || "-",
          nik_db: d.nik || null,
          no_rekening: d.no_rekening || "-",

          gaji_kotor: 0,
          siwa_kpri: 0,
          angs_kpri: 0,
          angs_ibi: 0,
          pot_bpjs: 0,
          pot_idi: 0,
          pot_ibi: 0,
          jml_potongan: 0,
          jumlah_bersih: 0,

          sumber: "DB",
        }));

      const combinedData = [...data, ...dbNotInExcel];

      setPreviewData(combinedData);
      if (onDataImported) {
        onDataImported(combinedData);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // kalkulasi total tiap kolom
  const calcTotal = (field) => {
    return previewData.reduce((acc, row) => acc + (row[field] || 0), 0);
  };

  const renderStatusIcon = (row) => {
    if (row.nik_db && row.sumber !== "DB")
      return <Check className="text-success" size={18} />;
    if (row.nik_db && row.sumber === "DB")
      return <AlertTriangle className="text-warning" size={18} />;
    if (!row.nik_db && row.sumber !== "DB")
      return <X className="text-danger" size={18} />;
    return null;
  };

  return (
    <>
      <div style={{ maxHeight: "600px", overflowY: "auto" }}>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        <table className="table table-theme-bordered table-hover table-sm mt-3">
          <thead className="bg-sae text-center sticky-top text-light">
            <tr>
              <th>No</th>
              <th>DB Checked</th>
              <th>Nama Pegawai</th>
              <th>NIK</th>
              <th>No Rekening</th>
              <th>Gaji Kotor</th>
              <th>SIWA KPRI</th>
              <th>Angs. KPRI</th>
              <th>Angs. IBI</th>
              <th>BPJS Kesehatan</th>
              <th>Pot. IDI</th>
              <th>Pot. IBI</th>
              <th>Jml Potongan</th>
              <th>Jumlah Bersih</th>
            </tr>
          </thead>

          <tbody>
            {previewData.map((r, i) => (
              <tr key={i}>
                <td className="text-center">{i + 1}</td>
                <td className="text-center">{renderStatusIcon(r)}</td>
                <td>{r.nama_pegawai}</td>
                <td>{r.nik}</td>
                <td>{r.no_rekening}</td>
                <td className="text-end">{formatNumber(r.gaji_kotor)}</td>
                <td className="text-end">{formatNumber(r.siwa_kpri)}</td>
                <td className="text-end">{formatNumber(r.angs_kpri)}</td>
                <td className="text-end">{formatNumber(r.angs_ibi)}</td>
                <td className="text-end">{formatNumber(r.pot_bpjs)}</td>
                <td className="text-end">{formatNumber(r.pot_idi)}</td>
                <td className="text-end">{formatNumber(r.pot_ibi)}</td>
                <td className="text-end">{formatNumber(r.jml_potongan)}</td>
                <td className="text-end">{formatNumber(r.jumlah_bersih)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="fw-bold bg-light">
              <td colSpan={5} className="text-center">
                TOTAL
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("gaji_kotor"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("siwa_kpri"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("angs_kpri"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("angs_ibi"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_bpjs"))}
              </td>
              <td className="text-end">{formatNumber(calcTotal("pot_idi"))}</td>
              <td className="text-end">{formatNumber(calcTotal("pot_ibi"))}</td>
              <td className="text-end">
                {formatNumber(calcTotal("jml_potongan"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("jumlah_bersih"))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <br />
        <Check className="text-success" size={18} /> : Excel & DB ada. <br />
        <AlertTriangle className="text-warning" size={18} /> : DB ada, Excel
        tidak ada. <br />
        <X className="text-danger" size={18} /> : Excel ada, DB tidak ada.{" "}
        <br />
      </div>
    </>
  );
};

export default ImportExcelPreviewNonASN;
