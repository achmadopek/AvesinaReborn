import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  generateRekapTHP,
  generateRinciTHP,
} from "../../../api/wj_thp/LaporanTHP";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SkeletonTable from "../../../utils/skeletonTable";
import { formatNumber } from "../../../utils/FormatNumber";

import DataLaporanGrid from "./DataLaporanGrid";
import DataLaporanRinci from "./DataLaporanRinci";
import FormLaporanTHP from "./FormLaporanTHP";

const LaporanTHP = ({ setRightContent, defaultRightContent }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [reportType, setReportType] = useState("");

  // State utama
  const [filters, setFilters] = useState({
    date_range: "",
    employee_sts: "",
    penghasilan_id: "",
    groupUnit: "",
    peg_id: "",
    nama_pegawai: "",
  });
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState([]);

  useEffect(() => {
    setRightContent(defaultRightContent);
  }, [setRightContent, defaultRightContent]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChangeFilter = (key, value) => {
    if (key === "individu") {
      setFilters((prev) => ({
        ...prev,
        peg_id: value.peg_id,
        nama_pegawai: value.nama_pegawai,
      }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleGenerate = async () => {
    let { date_range, employee_sts, penghasilan_id, groupUnit, peg_id } =
      filters;

    // ================================
    // Normalisasi groupUnit
    // ================================
    if (groupUnit) {
      if (typeof groupUnit === "object") {
        groupUnit = `${groupUnit.group ?? ""},${groupUnit.unit ?? "null"}`;
      }
      const parts = groupUnit.split(",");
      if (!parts[1]) parts[1] = "null"; // kalau unit kosong, default null
      groupUnit = parts.join(",");
    }

    // ================================
    // Validasi date_range wajib
    // ================================
    if (!date_range || date_range.length < 2) {
      toast.warning("Pilih rentang tanggal terlebih dahulu.");
      return;
    }

    // Ambil start & end dari date_range picker (misalnya array)
    const formattedDateRange =
      Array.isArray(date_range) && date_range.length === 2
        ? `${date_range[0]},${date_range[1]}`
        : date_range; // fallback kalau sudah string

    setLoading(true);
    setReportType("rekap"); // tandai laporan rekap

    try {
      const result = await generateRekapTHP(
        formattedDateRange,
        employee_sts || "",
        penghasilan_id || "",
        groupUnit || "",
        peg_id || ""
      );

      if (!Array.isArray(result) || result.length === 0) {
        toast.warning(
          result?.message || "Data belum tersedia untuk filter tersebut."
        );
        setGeneratedData([]);
        return;
      }

      setGeneratedData(result);
    } catch (err) {
      console.error(err);
      toast.error("Gagal generate data.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRinci = async () => {
    let { date_range, employee_sts, penghasilan_id, groupUnit, peg_id } =
      filters;

    // Normalisasi groupUnit
    if (groupUnit) {
      if (typeof groupUnit === "object") {
        groupUnit = `${groupUnit.group ?? ""},${groupUnit.unit ?? "null"}`;
      }
      const parts = groupUnit.split(",");
      if (!parts[1]) parts[1] = "null";
      groupUnit = parts.join(",");
    }

    // Validasi date_range wajib
    if (!date_range || date_range.length < 2) {
      toast.warning("Pilih rentang tanggal terlebih dahulu.");
      return;
    }

    const formattedDateRange =
      Array.isArray(date_range) && date_range.length === 2
        ? `${date_range[0]},${date_range[1]}`
        : date_range;

    setLoading(true);
    setReportType("rinci");

    try {
      const result = await generateRinciTHP(
        formattedDateRange,
        employee_sts || "",
        penghasilan_id || "",
        groupUnit || "",
        peg_id || ""
      );

      if (!Array.isArray(result) || result.length === 0) {
        toast.warning(
          result?.message || "Data belum tersedia untuk filter tersebut."
        );
        setGeneratedData([]);
        return;
      }

      setGeneratedData(result);
    } catch (err) {
      console.error(err);
      toast.error("Gagal generate data.");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // EXPORT REKAP
  // ==============================
  const exportToExcelRekap = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Rekap THP");

    worksheet.addRow(["Laporan Take Home Pay (Rekap)"]).font = {
      size: 16,
      bold: true,
    };

    let startDate = "",
      endDate = "";
    if (Array.isArray(filters.date_range)) {
      [startDate, endDate] = filters.date_range;
    } else if (typeof filters.date_range === "string") {
      [startDate, endDate] = filters.date_range.split(",");
    }
    worksheet.addRow([`Periode: ${startDate} s/d ${endDate}`]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      "No",
      "Nama Pegawai",
      "Status",
      "Total Penghasilan",
      "Total Potongan",
      "Take Home Pay",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCC0000" },
      };
    });

    generatedData.forEach((row, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        row.employee_nm,
        row.employee_sts,
        row.total_penghasilan ?? 0,
        row.total_potongan ?? 0,
        row.thp ?? 0,
      ]);
      dataRow.eachCell((cell, colNumber) => {
        if (colNumber >= 4 && colNumber <= 6) cell.numFmt = "#,##0";
      });
    });

    worksheet.columns = [
      { width: 5 },
      { width: 30 },
      { width: 15 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "laporan_thp_rekap.xlsx";
      link.click();
    });
  };

  const exportToPDFRekap = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Take Home Pay (Rekap)", 14, 10);

    let startDate = "",
      endDate = "";
    if (Array.isArray(filters.date_range)) {
      [startDate, endDate] = filters.date_range;
    } else if (typeof filters.date_range === "string") {
      [startDate, endDate] = filters.date_range.split(",");
    }
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 16);

    const tableData = generatedData.map((row, index) => [
      index + 1,
      row.employee_nm,
      row.employee_sts,
      formatNumber(row.total_penghasilan ?? 0),
      formatNumber(row.total_potongan ?? 0),
      formatNumber(row.thp ?? 0),
    ]);

    autoTable(doc, {
      head: [
        [
          "No",
          "Nama Pegawai",
          "Status",
          "Total Penghasilan",
          "Total Potongan",
          "Take Home Pay",
        ],
      ],
      body: tableData,
      startY: 20,
      styles: { fontSize: 9, halign: "center" },
      columnStyles: {
        1: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
      headStyles: { fillColor: [200, 0, 0] },
    });

    doc.save("laporan_thp_rekap.pdf");
  };

  // ==============================
  // EXPORT RINCI
  // ==============================
  const exportToExcelRinci = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Rinci THP");

    worksheet.addRow(["Laporan Take Home Pay (Rinci)"]).font = {
      size: 16,
      bold: true,
    };

    let startDate = "",
      endDate = "";
    if (Array.isArray(filters.date_range)) {
      [startDate, endDate] = filters.date_range;
    } else if (typeof filters.date_range === "string") {
      [startDate, endDate] = filters.date_range.split(",");
    }
    worksheet.addRow([`Periode: ${startDate} s/d ${endDate}`]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      "No",
      "Nama Pegawai",
      "Status",
      "Jenis",
      "Keterangan",
      "Jumlah",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0066CC" },
      };
    });

    generatedData.forEach((row, index) => {
      // Pegawai
      const pegawaiRow = worksheet.addRow([
        index + 1,
        row.employee_nm,
        row.employee_sts,
        "",
        "",
        row.thp,
      ]);
      pegawaiRow.font = { bold: true };

      // Penghasilan
      row.rincian_penghasilan?.forEach((item) => {
        worksheet.addRow([
          "",
          "",
          "",
          "Penghasilan",
          item.penghasilan_code,
          item.nilai ?? 0,
        ]);
      });
      worksheet.addRow([
        "",
        "",
        "",
        "Jumlah Penghasilan",
        null,
        row.total_penghasilan ?? 0,
      ]);

      // Potongan
      row.rincian_potongan?.forEach((item) => {
        worksheet.addRow([
          "",
          "",
          "",
          "Potongan",
          item.potongan_code,
          item.nilai ?? 0,
        ]);
      });
      worksheet.addRow([
        "",
        "",
        "",
        "Jumlah Potongan",
        null,
        row.total_potongan ?? 0,
      ]);

      worksheet.addRow([]); // spacer antar pegawai
    });

    worksheet.columns = [
      { width: 5 },
      { width: 35 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 20 },
    ];

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "laporan_thp_rinci.xlsx";
      link.click();
    });
  };

  const exportToPDFRinci = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Take Home Pay (Rinci)", 14, 10);

    let startDate = "",
      endDate = "";
    if (Array.isArray(filters.date_range)) {
      [startDate, endDate] = filters.date_range;
    } else if (typeof filters.date_range === "string") {
      [startDate, endDate] = filters.date_range.split(",");
    }
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 16);

    let bodyData = [];
    generatedData.forEach((row, index) => {
      // === Header Pegawai ===
      bodyData.push([
        { content: `${index + 1}`, styles: { fontStyle: "bold" } },
        {
          content: row.employee_nm,
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: row.employee_sts,
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: (row.thp ?? 0).toLocaleString(),
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]);

      // === Rincian Penghasilan ===
      row.rincian_penghasilan?.forEach((item) => {
        bodyData.push([
          "",
          "",
          "",
          { content: "Penghasilan", styles: { halign: "left" } },
          { content: item.penghasilan_code ?? "", styles: { halign: "left" } },
          {
            content: formatNumber(item.nilai ?? 0),
            styles: { halign: "right" },
          },
        ]);
      });

      bodyData.push([
        "",
        "",
        "",
        {
          content: "Jumlah Penghasilan",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: (row.total_penghasilan ?? 0).toLocaleString(),
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]);

      // === Rincian Potongan ===
      row.rincian_potongan?.forEach((item) => {
        bodyData.push([
          "",
          "",
          "",
          { content: "Potongan", styles: { halign: "left" } },
          { content: item.potongan_code ?? "", styles: { halign: "left" } },
          {
            content: (item.nilai ?? 0).toLocaleString(),
            styles: { halign: "right" },
          },
        ]);
      });

      bodyData.push([
        "",
        "",
        "",
        {
          content: "Jumlah Potongan",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: (row.total_potongan ?? 0).toLocaleString(),
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]);

      // Spacer antar pegawai
      bodyData.push(["", "", "", "", "", ""]);
    });

    autoTable(doc, {
      head: [["No", "Nama Pegawai", "Status", "Jenis", "Keterangan", "Jumlah"]],
      body: bodyData,
      startY: 20,
      styles: { fontSize: 9, halign: "center" },
      columnStyles: {
        1: { halign: "left" },
        2: { halign: "left" },
        4: { halign: "left" },
        5: { halign: "right" },
      },
      headStyles: { fillColor: [0, 102, 204] },
    });

    doc.save("laporan_thp_rinci.pdf");
  };

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Filter Laporan Take Home Pay</h6>
        </div>
        <div className="card-body px-3 py-2">
          <FormLaporanTHP
            filters={filters}
            onChange={handleChangeFilter}
            handleGenerate={handleGenerate}
            handleGenerateRinci={handleGenerateRinci}
            isLoadingGenerate={loading}
          />
        </div>
      </div>

      <div className="card shadow-sm card-theme mt-3">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Generated Laporan Take Home Pay</h6>
        </div>
        <div className="card-body px-3 py-2">
          {loading ? (
            <SkeletonTable rows={15} cols={5} responsive={true} />
          ) : generatedData.length > 0 ? (
            reportType === "rekap" ? (
              <DataLaporanGrid
                data={generatedData}
                onCetakSheet={exportToExcelRekap}
                onCetakPDF={exportToPDFRekap}
              />
            ) : (
              <DataLaporanRinci
                data={generatedData}
                onCetakSheet={exportToExcelRinci}
                onCetakPDF={exportToPDFRinci}
              />
            )
          ) : (
            <SkeletonTable rows={15} cols={5} animated={false} />
          )}
        </div>
      </div>
    </>
  );
};

export default LaporanTHP;
