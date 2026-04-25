import { useState, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import { formatNumber } from "../../../utils/FormatNumber";
import { fetchPaginatedData } from "../../../api/wj_sdm/MasterPegawai";
import { Check, X, AlertTriangle } from "lucide-react";

const ImportExcelPreviewASN = ({ onDataImported, employeeSts }) => {
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const startRow = 7;
      const blockSize = 6;
      const colOffset = 0;
      const data = [];
      const skipKeywords = ["SUB TOTAL PERGOLONGAN", "TOTAL PER SATKER"];

      let emptyCount = 0;

      for (let i = startRow; i <= worksheet.rowCount; i++) {
        const noUrut = worksheet.getRow(i).getCell(1 + colOffset).value;
        const nama = worksheet.getRow(i + 1)?.getCell(2 + colOffset).value;

        if (!noUrut || !nama) {
          emptyCount++;
          if (emptyCount > 10) break; // stop kalau sudah banyak baris kosong
          continue;
        }
        emptyCount = 0;

        const skipBlockSize = 6; // jumlah baris keyword/subtotal

        if (
          typeof nama === "string" &&
          skipKeywords.some((k) => nama.includes(k))
        ) {
          i += skipBlockSize - 1; // lompat ke baris setelah blok
          continue;
        }

        const rows = [];
        for (let j = 0; j <= blockSize; j++) {
          rows.push(worksheet.getRow(i + j).values);
        }

        let rawSts = String(rows[4]?.[2 + colOffset] ?? "-");
        let part = rawSts.split(")")[0];
        let cleanSts = part.replace("(", "").trim();

        const nipExcel = normalize(rows[3]?.[2 + colOffset]);
        const pegDb = dbData.find(
          (d) => normalize(d.nip) === nipExcel || normalize(d.nik) === nipExcel
        );

        const pegawai = {
          no: noUrut,
          nama_pegawai: nama || "-",
          tgl_lahir: rows[2]?.[2 + colOffset] || "-",
          nip: nipExcel,
          nip_db: pegDb?.nip || pegDb?.nik || null,
          sts_pegawai: cleanSts,
          npwp: rows[5]?.[2 + colOffset] || "-",

          sts_kawin: rows[1]?.[3 + colOffset] || "-",
          jml_anak: rows[2]?.[3 + colOffset] || "0",
          jml_jiwa: rows[5]?.[3 + colOffset] || "0",

          no_rekening: rows[5]?.[10 + colOffset] || "-",

          gaji_pokok: rows[1]?.[4 + colOffset] || "0",
          tunj_istri_smi: rows[2]?.[4 + colOffset] || "0",
          tunj_anak: rows[3]?.[4 + colOffset] || "0",

          tunj_eselon: rows[1]?.[5 + colOffset] || "0",
          tunj_fung_umum: rows[2]?.[5 + colOffset] || "0",
          tunj_fungsional: rows[3]?.[5 + colOffset] || "0",
          tunj_khusus: rows[4]?.[5 + colOffset] || "0",

          tunj_terpencil: rows[1]?.[6 + colOffset] || "0",
          tunj_tkd: rows[2]?.[6 + colOffset] || "0",
          tunj_beras: rows[3]?.[6 + colOffset] || "0",
          tunj_pajak: rows[4]?.[6 + colOffset] || "0",

          tunj_bpjs_kes_4: rows[1]?.[7 + colOffset] || "0",
          tunj_jkk: rows[2]?.[7 + colOffset] || "0",
          tunj_jkm: rows[3]?.[7 + colOffset] || "0",
          pembulatan_gaji: rows[4]?.[7 + colOffset] || "0",
          jml_penghasilan: rows[5]?.[7 + colOffset] || "0",

          pot_pajak: rows[1]?.[8 + colOffset] || "0",
          pot_bpjs_kes: rows[2]?.[8 + colOffset] || "0",
          pot_iwp_1: rows[3]?.[8 + colOffset] || "0",
          pot_iwp_8: rows[4]?.[8 + colOffset] || "0",
          pot_taperum: rows[5]?.[8 + colOffset] || "0",

          pot_jkk: rows[6]?.[8 + colOffset] || "0",
          pot_jkm: rows[1]?.[9 + colOffset] || "0",
          pot_hutang: rows[2]?.[9 + colOffset] || "0",
          pot_bulog: rows[3]?.[9 + colOffset] || "0",
          pot_sewa_rumah: rows[4]?.[9 + colOffset] || "0",
          jml_potongan: rows[5]?.[9 + colOffset] || "0",
          jumlah_bersih: rows[6]?.[9 + colOffset] || "0",

          sumber: "Excel",
        };

        data.push(pegawai);
        i += blockSize - 1; // loncat ke blok berikutnya
      }

      const excelNipList = data.map((d) => normalize(d.nip));
      const dbNotInExcel = dbData
        .filter(
          (d) =>
            !excelNipList.includes(normalize(d.nip)) &&
            !excelNipList.includes(normalize(d.nik))
        )
        .map((d) => ({
          no: "-",
          nama_pegawai: d.employee_nm || "-",
          tgl_lahir: d.birth_dt || "-",
          nip: d.nip || d.nik || "-",
          nip_db: d.nip || d.nik,
          sts_pegawai: d.employee_sts || "-",
          npwp: d.npwp || "-",
          no_rekening: d.no_rekening || "-",
          jumlah_bersih: d.jumlah_bersih || "0",
          sumber: "DB",
        }));

      const mergedData = [...data, ...dbNotInExcel];
      setPreviewData(mergedData);
      if (onDataImported) {
        onDataImported(mergedData);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // fungsi hitung total kolom
  const calcTotal = (field) => {
    return previewData.reduce((sum, row) => {
      const val = parseFloat(row[field] || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const renderStatusIcon = (row) => {
    if (row.nip_db && row.sumber !== "DB")
      return <Check className="text-success" size={18} />;
    if (row.nip_db && row.sumber === "DB")
      return <AlertTriangle className="text-warning" size={18} />;
    if (!row.nip_db && row.sumber !== "DB")
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
              <th>NIP/NIK</th>
              <th>Tanggal Lahir</th>
              <th>Status Pegawai</th>
              <th>NPWP</th>
              <th>Status Kawin</th>
              <th>Anak</th>
              <th>Jml Jiwa</th>
              <th>No Rekening</th>
              <th>Gaji Pokok</th>
              <th>Tunj. Istri</th>
              <th>Tunj. Anak</th>
              <th>Tunj. Eselon</th>
              <th>Tunj. Fung Umum</th>
              <th>Tunj. Fungsional</th>
              <th>Tunj. Khusus</th>
              <th>Tunj. Terpencil</th>
              <th>TKD</th>
              <th>Tunj. Beras</th>
              <th>Tunj. Pajak</th>
              <th>Tunj. BPJS Kes</th>
              <th>Tunj. JKK</th>
              <th>Tunj. JKM</th>
              <th>Pembulatan</th>
              <th>Jml Penghasilan</th>
              <th>Pot Pajak</th>
              <th>Pot BPJS</th>
              <th>Pot IWP 1%</th>
              <th>Pot IWP 8%</th>
              <th>Pot Taperum</th>
              <th>Pot JKK</th>
              <th>Pot JKM</th>
              <th>Pot Hutang</th>
              <th>Pot Bulog</th>
              <th>Pot Sewa Rumah</th>
              <th>Jml Potongan</th>
              <th>Jumlah Bersih</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-center">{renderStatusIcon(r)}</td>
                <td>{r.nama_pegawai}</td>
                <td>{r.nip}</td>
                <td>{r.tgl_lahir}</td>
                <td>{r.sts_pegawai}</td>
                <td>{r.npwp}</td>
                <td>{r.sts_kawin}</td>
                <td className="text-end">{r.jml_anak}</td>
                <td className="text-end">{r.jml_jiwa}</td>
                <td>{r.no_rekening}</td>
                <td className="text-end">{formatNumber(r.gaji_pokok)}</td>
                <td className="text-end">{formatNumber(r.tunj_istri_smi)}</td>
                <td className="text-end">{formatNumber(r.tunj_anak)}</td>
                <td className="text-end">{formatNumber(r.tunj_eselon)}</td>
                <td className="text-end">{formatNumber(r.tunj_fung_umum)}</td>
                <td className="text-end">{formatNumber(r.tunj_fungsional)}</td>
                <td className="text-end">{formatNumber(r.tunj_khusus)}</td>
                <td className="text-end">{formatNumber(r.tunj_terpencil)}</td>
                <td className="text-end">{formatNumber(r.tunj_tkd)}</td>
                <td className="text-end">{formatNumber(r.tunj_beras)}</td>
                <td className="text-end">{formatNumber(r.tunj_pajak)}</td>
                <td className="text-end">{formatNumber(r.tunj_bpjs_kes_4)}</td>
                <td className="text-end">{formatNumber(r.tunj_jkk)}</td>
                <td className="text-end">{formatNumber(r.tunj_jkm)}</td>
                <td className="text-end">{formatNumber(r.pembulatan_gaji)}</td>
                <td className="text-end">{formatNumber(r.jml_penghasilan)}</td>
                <td className="text-end">{formatNumber(r.pot_pajak)}</td>
                <td className="text-end">{formatNumber(r.pot_bpjs_kes)}</td>
                <td className="text-end">{formatNumber(r.pot_iwp_1)}</td>
                <td className="text-end">{formatNumber(r.pot_iwp_8)}</td>
                <td className="text-end">{formatNumber(r.pot_taperum)}</td>
                <td className="text-end">{formatNumber(r.pot_jkk)}</td>
                <td className="text-end">{formatNumber(r.pot_jkm)}</td>
                <td className="text-end">{formatNumber(r.pot_hutang)}</td>
                <td className="text-end">{formatNumber(r.pot_bulog)}</td>
                <td className="text-end">{formatNumber(r.pot_sewa_rumah)}</td>
                <td className="text-end">{formatNumber(r.jml_potongan)}</td>
                <td className="text-end">{formatNumber(r.jumlah_bersih)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-light fw-bold">
            <tr>
              <td colSpan={11} className="text-end">
                JUMLAH
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("gaji_pokok"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_istri_smi"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_anak"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_eselon"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_fung_umum"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_fungsional"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_khusus"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_terpencil"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_tkd"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_beras"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_pajak"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_bpjs_kes_4"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_jkk"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("tunj_jkm"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pembulatan_gaji"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("jml_penghasilan"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_pajak"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_bpjs_kes"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_iwp_1"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_iwp_8"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_taperum"))}
              </td>
              <td className="text-end">{formatNumber(calcTotal("pot_jkk"))}</td>
              <td className="text-end">{formatNumber(calcTotal("pot_jkm"))}</td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_hutang"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_bulog"))}
              </td>
              <td className="text-end">
                {formatNumber(calcTotal("pot_sewa_rumah"))}
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

export default ImportExcelPreviewASN;
