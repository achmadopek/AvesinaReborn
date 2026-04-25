import React, { useState, useEffect, useCallback, useMemo } from "react";
import ExcelJS from "exceljs";
import { formatNumber } from "../../../utils/FormatNumber";
import { fetchPaginatedData } from "../../../api/wj_sdm/MasterPegawai";
import { Check, X, AlertTriangle } from "lucide-react";

const ImportExcelPreviewJPJM = ({
  onDataImported,
  employeeSts,
  onSheetSelected,
}) => {
  // ===== STATE MANAGEMENT =====
  const [previewData, setPreviewData] = useState([]);
  const [dbData, setDbData] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbookRef, setWorkbookRef] = useState(null);

  // ===== HELPERS =====
  const normalize = useCallback((val) => String(val || "").trim(), []);

  const parseNumber = useCallback((val) => {
    if (val === undefined || val === null || val === "") return 0;
    return Number(String(val).replace(/[^0-9.-]/g, "")) || 0;
  }, []);

  // Ambil nilai cell, baik formula maupun nilai langsung
  const getCellNumber = useCallback(
    (cell) => {
      if (!cell) return 0;
      if (typeof cell === "object") {
        if (cell.result !== undefined && cell.result !== null)
          return parseNumber(cell.result);
        if (cell.value !== undefined) return parseNumber(cell.value);
      }
      return parseNumber(cell);
    },
    [parseNumber]
  );

  // ===== FETCH DB DATA =====
  const loadData = useCallback(async () => {
    if (!employeeSts?.length) {
      setDbData([]);
      return;
    }
    try {
      const result = await fetchPaginatedData(
        1,
        10000,
        "",
        "",
        employeeSts.join(",")
      );
      setDbData(result.data);
    } catch (err) {
      console.error("Gagal fetch data:", err);
    }
  }, [employeeSts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== FILE HANDLER =====
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      setSheetNames(workbook.worksheets.map((ws) => ws.name));
      setWorkbookRef(workbook);
      setSelectedSheet("");
      setPreviewData([]);
    } catch (error) {
      console.error("Gagal memuat file Excel:", error);
    }
  }, []);

  // ===== SHEET PARSING =====
  const handleSheetSelect = useCallback(
    async (e) => {
      const sheetName = e.target.value;
      setSelectedSheet(sheetName);
      onSheetSelected?.(sheetName);

      if (!sheetName || !workbookRef) return;

      const worksheet = workbookRef.getWorksheet(sheetName);
      if (!worksheet) return;

      const startRow = 7;
      const skipKeywords = ["SUB TOTAL PERGOLONGAN", "TOTAL PER SATKER"];
      const data = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return;
        const nama = row.getCell(2).value;

        // Skip baris subtotal/total
        if (
          !row.getCell(1).value ||
          (typeof nama === "string" &&
            skipKeywords.some((k) => nama.includes(k)))
        )
          return;

        const nikExcel = normalize(row.getCell(6).value);
        const pegDb = dbData.find((d) => normalize(d.nik) === nikExcel);

        const jpBruto = getCellNumber(worksheet.getCell(rowNumber, 9));
        const pph5Persen = getCellNumber(worksheet.getCell(rowNumber, 11));
        const pph15Persen = getCellNumber(worksheet.getCell(rowNumber, 12));
        const potA = getCellNumber(worksheet.getCell(rowNumber, 13));
        const potB = getCellNumber(worksheet.getCell(rowNumber, 14));
        const potC = getCellNumber(worksheet.getCell(rowNumber, 15));

        const jmlPotongan = pph5Persen + pph15Persen + potA + potB + potC;
        const jumlahBersih = jpBruto - jmlPotongan;

        data.push({
          no: row.getCell(1).value,
          nama_pegawai: nama || "-",
          nik: nikExcel,
          nik_db: pegDb?.nik || null,
          no_rekening: row.getCell(8).value || "-",
          jp_bruto: jpBruto,
          pph_5_persen: pph5Persen,
          pph_15_persen: pph15Persen,
          pot_a: potA,
          pot_b: potB,
          pot_c: potC,
          jml_potongan: jmlPotongan,
          jumlah_bersih: jumlahBersih,
          sumber: "Excel",
          sheet_type: sheetName, // tambahkan untuk kirim ke backend
        });
      });

      // Cari pegawai DB yg tidak ada di Excel
      const excelNikList = data.map((d) => normalize(d.nik));
      const dbNotInExcel = dbData
        .filter((d) => !excelNikList.includes(normalize(d.nik)))
        .map((d) => ({
          no: "-",
          nama_pegawai: d.employee_nm || "-",
          nik: d.nik || "-",
          nik_db: d.nik || null,
          no_rekening: d.no_rekening || "-",
          jp_bruto: 0,
          pph_5_persen: 0,
          pph_15_persen: 0,
          pot_a: 0,
          pot_b: 0,
          pot_c: 0,
          jml_potongan: 0,
          jumlah_bersih: 0,
          sumber: "DB",
          sheet_type: sheetName,
        }));

      const combinedData = [...data, ...dbNotInExcel];
      setPreviewData(combinedData);
      onDataImported?.(combinedData);
    },
    [dbData, getCellNumber, normalize, onDataImported, workbookRef]
  );

  // ===== CALCULATION =====
  const calcTotal = useCallback(
    (field) => previewData.reduce((acc, row) => acc + (row[field] || 0), 0),
    [previewData]
  );

  const renderStatusIcon = useCallback((row) => {
    if (row.nik_db && row.sumber !== "DB")
      return <Check className="text-success" size={18} />;
    if (row.nik_db && row.sumber === "DB")
      return <AlertTriangle className="text-warning" size={18} />;
    if (!row.nik_db && row.sumber !== "DB")
      return <X className="text-danger" size={18} />;
    return null;
  }, []);

  // ===== DEBUGGING LOG =====
  useEffect(() => {
    console.log("Preview Data:", previewData);
  }, [previewData]);

  // ===== RENDER =====
  return (
    <>
      {/* Upload */}
      <div className="mb-3">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="form-control form-control-sm"
        />
      </div>

      {/* Sheet Selector */}
      {sheetNames.length > 0 && (
        <div className="mb-3">
          <label className="fw-bold">Pilih Sheet untuk Diimport</label>
          <select
            className="form-select form-control form-control-sm-sm"
            value={selectedSheet}
            onChange={handleSheetSelect}
          >
            <option value="">-- pilih sheet --</option>
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preview */}
      {selectedSheet && previewData.length > 0 && (
        <>
          <p className="fw-bold mt-3">
            Preview Data: <span className="text-primary">{selectedSheet}</span>
          </p>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            <table className="table table-theme-bordered table-hover table-sm mt-2">
              <thead className="bg-sae text-center sticky-top text-light">
                <tr>
                  <th>No</th>
                  <th>DB Checked</th>
                  <th>Nama Pegawai</th>
                  <th>NIK</th>
                  <th>No Rekening</th>
                  <th>JP Bruto</th>
                  <th>PPH 5%</th>
                  <th>PPH 15%</th>
                  <th>Pot A</th>
                  <th>Pot B</th>
                  <th>Pot C</th>
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
                    <td className="text-end">{formatNumber(r.jp_bruto)}</td>
                    <td className="text-end">{formatNumber(r.pph_5_persen)}</td>
                    <td className="text-end">
                      {formatNumber(r.pph_15_persen)}
                    </td>
                    <td className="text-end">{formatNumber(r.pot_a)}</td>
                    <td className="text-end">{formatNumber(r.pot_b)}</td>
                    <td className="text-end">{formatNumber(r.pot_c)}</td>
                    <td className="text-end">{formatNumber(r.jml_potongan)}</td>
                    <td className="text-end">
                      {formatNumber(r.jumlah_bersih)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-bold bg-light">
                  <td colSpan={5} className="text-center">
                    TOTAL
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("jp_bruto"))}
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("pph_5_persen"))}
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("pph_15_persen"))}
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("pot_a"))}
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("pot_b"))}
                  </td>
                  <td className="text-end">
                    {formatNumber(calcTotal("pot_c"))}
                  </td>
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

          <div className="mt-2 small">
            <Check className="text-success" size={18} /> : Excel & DB ada.{" "}
            <br />
            <AlertTriangle className="text-warning" size={18} /> : DB ada, Excel
            tidak ada. <br />
            <X className="text-danger" size={18} /> : Excel ada, DB tidak ada.{" "}
            <br />
          </div>
        </>
      )}
    </>
  );
};

export default ImportExcelPreviewJPJM;
