// src/utils/generateRekapPDF.js
import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateRekapPDF = ({
  rekap,
  meta,
  periode,
  year,
  start,
  end,
  namaMode,
  namaTarget,
}) => {
  const doc = new jsPDF("landscape");

  // Header
  doc.setFontSize(16);
  doc.text("REKAPITULASI STANDAR PELAYANAN MINIMAL (SPM)", 148, 15, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.text(`Periode: ${periode} Tahun ${year} (${start} s/d ${end})`, 148, 25, {
    align: "center",
  });
  doc.text(`${namaMode} : ${namaTarget}`, 148, 32, { align: "center" });

  // Tanggal cetak
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${today}`, 20, 45);

  // Persiapkan data tabel
  const tableColumn = ["No", "Indikator", "Target", "Capaian"];
  const tableRows = [];

  rekap.forEach((r, index) => {
    tableRows.push([
      index + 1,
      r.indikator,
      `${r.target} ${r.satuan || ""}`,
      r.capaian !== null && r.capaian !== undefined
        ? `${r.capaian.toFixed(2)}`
        : "-",
    ]);
  });

  // Generate Table
  doc.autoTable({
    startY: 55,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [0, 123, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 120 },
      2: { cellWidth: 40, halign: "center" },
      3: { cellWidth: 40, halign: "center" },
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(9);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Halaman ${i} dari ${pageCount}`, 280, 200, { align: "right" });
  }

  // Download
  const fileName = `Rekap_SPM_${namaTarget}_${periode}_${year}.pdf`;
  doc.save(fileName);

  toast.success("PDF berhasil diunduh");
};
