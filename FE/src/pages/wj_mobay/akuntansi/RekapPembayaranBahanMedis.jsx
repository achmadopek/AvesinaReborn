import React, { useState, useEffect } from "react";
import { formatDate, formatSortDateTime } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchRekapPembayaranBahanMedis,
  exportRekapPembayaranBahanMedis,
} from "../../../api/wj_mobay/RekapPembayaranBahanMedis";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RekapPembayaranBahanMedis = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("");
  const [drug, setDrug] = useState("");
  const [invoice, setInvoice] = useState("");

  const [filteredData, setFilteredData] = useState([]);
  const [filterDateType, setFilterDateType] = useState("tgl_po");

  const [showDetail, setShowDetail] = useState(false);

  const [reportMode, setReportMode] = useState("invoice"); // invoice | provider | kategori

  // Helper function untuk menghitung total bayar dari item yang sudah dibayar
  const calcTotalBayarFromItems = (items = []) =>
    items.reduce((s, it) => s + Number(it.nominal_bayar || 0), 0);

  // Normalize API response
  const normalizeRekapData = (rekap) => {
    const items = (rekap.items || []).map((it) => {
      const status_validasi =
        it.status_validasi ??
        (it.status_pengolahan === "Valid" ? "Valid" : "Tidak Valid");

      const status_pembayaran =
        it.status_pembayaran ??
        (it.status_pengolahan === "Lunas" ? "Lunas" : "Hutang");

      const bayarFlag = status_pembayaran === "Lunas";

      const nominal_bayar =
        it.nominal_bayar !== undefined && it.nominal_bayar !== null
          ? Number(it.nominal_bayar)
          : bayarFlag
            ? Number(it.subtotal || 0)
            : "";

      return {
        ...it,
        status_validasi,
        status_pembayaran,
        bayar: bayarFlag,
        nominal_bayar,
      };
    });

    const totalBayar =
      rekap.total_bayar !== undefined && rekap.total_bayar !== null
        ? Number(rekap.total_bayar)
        : calcTotalBayarFromItems(items);

    const total_invoice = items.reduce(
      (acc, cur) => acc + Number(cur.subtotal || 0),
      0
    );

    return {
      ...rekap,
      items,
      totalBayar,
      total_invoice,
    };
  };

  // Memuat data rekap dari API
  const handleLoadData = async () => {
    if (!startDate || !endDate) {
      toast.warn("Silakan pilih periode tanggal terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchRekapPembayaranBahanMedis({
        start: startDate,
        end: endDate,
        typeTglFilter: filterDateType,
      });

      setData((res.data || []).map(normalizeRekapData));
      setFilteredData((res.data || []).map(normalizeRekapData));
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    setStartDate(today);
    setEndDate(today);

    (async () => {
      try {
        setLoading(true);
        const res = await fetchRekapPembayaranBahanMedis({
          start: today,
          end: today,
          typeTglFilter: filterDateType,
        });
        setData((res.data || []).map(normalizeRekapData));
        setFilteredData((res.data || []).map(normalizeRekapData));
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data awal");
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // once

  useEffect(() => {
    let temp = [...data];

    // FILTER PROVIDER
    if (provider.trim() !== "") {
      const p = provider.toLowerCase();

      temp = temp.filter((inv) => {
        const prov = inv.prvdr_str || "";
        return prov.toLowerCase().includes(p);
      });
    }

    // FILTER INVOICE
    if (invoice.trim() !== "") {
      const i = invoice.toLowerCase();

      temp = temp.filter((inv) => {
        const invNo = inv.invoice_no || "";
        return invNo.toLowerCase().includes(i);
      });
    }

    // FILTER DRUG (ADA DI DALAM items[])
    if (drug.trim() !== "") {
      const d = drug.toLowerCase();

      temp = temp.filter((inv) => {
        return inv.items?.some((it) =>
          (it.drug_nm || "").toLowerCase().includes(d)
        );
      });
    }

    setFilteredData(temp);
  }, [provider, invoice, drug, data]);

  // Fungsi untuk ekspor data ke Excel
  const handleExportToExcel = async () => {
    try {
      const res = await exportRekapPembayaranBahanMedis({
        start: startDate,
        end: endDate,
        typeTglFilter: filterDateType,
      });

      // Create a Blob from the response
      const url = window.URL.createObjectURL(
        new Blob([res], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rekap_Pembayaran_Bahan_Medis_${startDate}_${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Gagal mengekspor data ke Excel.");
      console.error(err);
    }
  };

  const handleCetakToPdf = async () => {
    try {

      let headers = [];
      let body = [];

      if (reportMode === "invoice") {

        headers = [
          "No",
          "Faktur No",
          "Unit",
          "Provider",
          "Tanggal PO",
          "Total Faktur",
          "Progress",
          "Tanggal Bayar",
          "Lunas",
          "Hutang",
        ];

        body = filteredData.map((rekap, idx) => [
          idx + 1,
          rekap.invoice_no || "-",
          rekap.srvc_unit_nm || "-",
          rekap.prvdr_str || "-",
          formatSortDateTime(rekap.po_dt) || "-",
          formatCurrency(rekap.total_invoice || 0),
          rekap.status_pengolahan || "Belum Proses",
          formatSortDateTime(rekap.invoice_paid_dt) || "-",
          formatCurrency(rekap.total_lunas || 0),
          formatCurrency(rekap.total_hutang || 0),
        ]);
      }

      else if (reportMode === "provider") {

        headers = [
          "No",
          "Provider",
          "Total Faktur",
          "Total Lunas",
          "Total Hutang",
        ];

        const grouped = {};

        filteredData.forEach(inv => {
          const key = inv.prvdr_str || "Tanpa Provider";

          if (!grouped[key]) {
            grouped[key] = {
              total_invoice: 0,
              total_lunas: 0,
              total_hutang: 0,
            };
          }

          grouped[key].total_invoice += Number(inv.total_invoice || 0);
          grouped[key].total_lunas += Number(inv.total_lunas || 0);
          grouped[key].total_hutang += Number(inv.total_hutang || 0);
        });

        body = Object.keys(grouped).map((provider, idx) => [
          idx + 1,
          provider,
          formatCurrency(grouped[provider].total_invoice),
          formatCurrency(grouped[provider].total_lunas),
          formatCurrency(grouped[provider].total_hutang),
        ]);
      }

      else if (reportMode === "kategori") {

        headers = [
          "No",
          "Jenis Barang",
          "Total Nilai",
        ];

        const grouped = {};

        filteredData.forEach(inv => {
          inv.items?.forEach(it => {
            const key = it.jenis_item || "Tanpa Kategori";

            if (!grouped[key]) grouped[key] = 0;

            grouped[key] += Number(it.subtotal || 0);
          });
        });

        body = Object.keys(grouped).map((kategori, idx) => [
          idx + 1,
          kategori,
          formatCurrency(grouped[kategori]),
        ]);
      }

      // ================================
      // TAMBAH ROW TOTAL
      // ================================
      if (reportMode === "invoice") {
        const totalInvoice = filteredData.reduce(
          (a, b) => a + (b.total_invoice || 0),
          0
        );
        const totalLunas = filteredData.reduce(
          (a, b) => a + (b.total_lunas || 0),
          0
        );
        const totalHutang = filteredData.reduce(
          (a, b) => a + (b.total_hutang || 0),
          0
        );

        body.push([
          {
            content: "TOTAL",
            colSpan: 7,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: formatCurrency(total_diajukan),
            styles: { halign: "right", fontStyle: "bold" },
          },
          "",
          {
            content: formatCurrency(totalLunas),
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: formatCurrency(totalHutang),
            styles: { halign: "right", fontStyle: "bold" },
          },
        ]);
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(14);
      const titleMap = {
        invoice: "Rekap Pembayaran per Invoice",
        provider: "Rekap Pembayaran per Provider",
        kategori: "Rekap Pembayaran per Jenis Barang"
      };

      doc.text(titleMap[reportMode], 40, 40);

      doc.setFontSize(10);
      doc.text(`Periode: ${startDate || ""} s/d ${endDate || ""}`, 40, 58);

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 80,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 30 },
          4: { halign: "center" },
          5: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "right" },
        },
        margin: { left: 40, right: 40 },
      });

      const fileName = `Rekap_Pembayaran_${startDate || ""}_${endDate || ""
        }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal mencetak PDF");
    }
  };

  // Mengatur tanggal awal dan akhir saat pertama kali dimuat
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const localToday = today.toLocaleDateString("en-CA"); // Format YYYY-MM-DD untuk startDate dan endDate

    setStartDate(localToday);
    setEndDate(localToday);
  }, []);

  // Mapping warna badge sesuai status_pengolahan
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Belum Proses":
        return "bg-secondary"; // abu
      case "Proses Pengajuan":
        return "bg-primary"; // biru
      case "Proses Verifikasi":
        return "bg-info"; // biru muda
      case "Proses Revisi":
        return "bg-warning"; // kuning
      case "Proses Pembayaran":
        return "bg-primary"; // biru
      case "Batal":
        return "bg-danger"; // merah
      case "Selesai":
        return "bg-success"; // hijau
      default:
        return "bg-dark"; // fallback
    }
  };

  // -------------------------
  // Render UI
  // -------------------------
  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Rekapitulasi Pengajuan Pembayaran</h6>
        </div>

        <div className="card-body px-3 py-3">
          {/* Filter tanggal */}
          <div className="d-flex flex-wrap align-items-end mb-3">
            {/* Jenis filter tanggal */}
            <div className="me-2">
              <label className="form-label mb-1 fw-semibold">
                Filter Tanggal
              </label>
              <select
                className="form-control form-control-sm form-control form-control-sm-sm p-2"
                value={filterDateType}
                onChange={(e) => setFilterDateType(e.target.value)}
              >
                <option value="tgl_po">Tgl PO</option>
                <option value="tgl_konsolidasi">Tgl Konsolidasi</option>
                <option value="tgl_inv_datang">Tgl Faktur Datang</option>
                <option value="tgl_invoice">Tgl Faktur</option>
                <option value="tgl_jatuh_tempo">Tgl Jatuh Tempo</option>
                <option value="tgl_diajukan">Tgl Pengajuan Berkas</option>
                <option value="tgl_diterima">Tgl Penerimaan Berkas</option>
                <option value="tgl_verifikasi">Tgl Verifikasi</option>
                <option value="tgl_bayar">Tgl Bayar</option>
              </select>
            </div>

            {/* Tanggal Awal */}
            <div className="me-2">
              <label className="form-label mb-1 fw-semibold">
                Tanggal Awal
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Tanggal Akhir */}
            <div className="me-2">
              <label className="form-label mb-1 fw-semibold">
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Tampilkan */}
            <div className="mt-3 mt-sm-0">
              <button
                onClick={handleLoadData}
                className="btn btn-sm btn-outline-primary ms-sm-2"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>

            {/* BLOK KANAN */}
            <div className="ms-auto d-flex">
              {/* Provider */}
              <div className="me-2">
                <label className="form-label mb-1 fw-semibold">Provider</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Cari provider..."
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </div>

              {/* Invoice */}
              <div className="me-2">
                <label className="form-label mb-1 fw-semibold">Invoice</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Cari invoice..."
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                />
              </div>

              {/* Nama Barang */}
              <div className="me-2">
                <label className="form-label mb-1 fw-semibold">
                  Nama Barang
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Cari nama barang..."
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                />
              </div>

              {/* Tombol Export & Cetak + Checkbox */}
              <div className="d-flex flex-column align-items-start">
                {/* Checkbox Show/Hide Detail */}
                <div className="form-check mb-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={showDetail}
                    onChange={() => setShowDetail(!showDetail)}
                    id="cbShowDetail"
                  />
                  <label className="form-check-label" htmlFor="cbShowDetail">
                    Tampilkan Detail
                  </label>
                </div>

                <div className="me-2">
                  <select
                    className="form-control form-control-sm form-control form-control-sm-sm"
                    value={reportMode}
                    onChange={(e) => setReportMode(e.target.value)}
                  >
                    <option value="invoice">Per Invoice</option>
                    <option value="provider">Per Provider</option>
                    <option value="kategori">Per Jenis Barang</option>
                  </select>
                </div>
              </div>
              {/* Tombol Export & Cetak */}
              <div className="d-flex">
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={handleExportToExcel}
                >
                  Export Excel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleCetakToPdf}
                >
                  Cetak PDF
                </button>
              </div>
            </div>
          </div>

          {/* Table utama */}
          <div className="table-responsive mb-4">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>No</th>
                  <th>
                    Unit / <br />
                    Provider
                  </th>
                  <th>
                    Tanggal PO / <br />
                    Po Code
                  </th>
                  <th>
                    Faktur No /<br />
                    Tgl Faktur
                  </th>
                  <th>
                    Tgl Diterima /<br />
                    Tgl Jatuh Tempo
                  </th>
                  <th>
                    Tgl Konsolidasi<br />
                    Tgl Diajukan
                  </th>
                  <th>
                    Tgl Diterima<br />
                    Tgl Verifikasi
                  </th>
                  <th>
                    Total Diajukan /<br />
                    Tgl Dibayar
                  </th>
                  <th>Lunas</th>
                  <th>Terutang</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={"8"} className="text-center">
                      Memuat data...
                    </td>
                  </tr>
                ) : Array.isArray(data) && data.length > 0 ? (
                  filteredData.map((inv, i) => {
                    const invoiceKey =
                      inv.po_acce_id || inv.po_id || `inv-${i}`;

                    // Per-invoice derived flags
                    const semuaSudahValidasi = inv.items?.every((x) =>
                      ["Valid", "Tidak Valid"].includes(x.status_validasi)
                    );
                    const semuaSudahLunas = inv.items?.every(
                      (x) => x.status_pembayaran === "Lunas"
                    );

                    const isLocked = inv.kunci_invoice === 1;

                    const isValidasiLocked =
                      inv.status_pengolahan === "Proses Pembayaran" ||
                      inv.status_pengolahan === "Selesai";
                    const isBayarLocked = inv.status_pengolahan === "Selesai";

                    const isBelumProses =
                      inv.status_pengolahan === "Belum Proses";
                    const isProsesPengajuan =
                      inv.status_pengolahan === "Proses Pengajuan";
                    const isProsesVerifikasi =
                      inv.status_pengolahan === "Proses Verifikasi";

                    return (
                      <React.Fragment key={invoiceKey}>
                        {/* ROW INVOICE */}
                        <tr>
                          <td>{i + 1}</td>
                          <td>
                            {inv.srvc_unit_nm} <br />
                            {inv.prvdr_str}
                          </td>
                          <td>
                            {formatSortDateTime(inv.po_dt)} <br />
                            {inv.po_code || "-"}
                          </td>
                          <td>
                            {inv.invoice_no} <br />
                            {formatSortDateTime(inv.invoice_dt) || "-"}
                          </td>
                          <td>
                            {formatSortDateTime(inv.invoice_received_dt) || "-"} <br />
                            {formatSortDateTime(inv.invoice_due_dt) || "-"}
                          </td>
                          <td>
                            {formatSortDateTime(inv.invoice_consolidated_dt) || "-"}<br />
                            {formatSortDateTime(inv.invoice_submitted_dt) || "-"}
                          </td>
                          <td>
                            {formatSortDateTime(inv.invoice_accepted_dt) || "-"}<br />
                            {formatSortDateTime(inv.invoice_verified_dt) || "-"}
                          </td>
                          <td className="text-end">
                            {formatCurrency(inv.total_invoice)} <br />
                            {formatSortDateTime(inv.invoice_paid_dt) || "-"}
                          </td>
                          <td className="text-end">
                            {inv.total_lunas > 0 ? (
                              <span className="badge bg-success">
                                {formatCurrency(inv.total_lunas)}
                              </span>
                            ) : (
                              formatCurrency(0)
                            )}
                          </td>
                          <td className="text-end">
                            {inv.total_hutang > 0 ? (
                              <span className="badge bg-danger">
                                {formatCurrency(inv.total_hutang)}
                              </span>
                            ) : (
                              formatCurrency(0)
                            )}
                          </td>
                        </tr>

                        {showDetail && (
                          <>
                            {/* ROW DETAIL */}
                            <tr
                              key={`${invoiceKey}-detail`}
                              className="bg-light"
                            >
                              <td></td>
                              <td colSpan="7">
                                <div className="p-2">
                                  <strong>Detail Barang:</strong>

                                  {inv.items && inv.items.length > 0 ? (
                                    <div className="table-responsive mt-2">
                                      <table className="table table-theme table-sm table-bordered mb-0">
                                        <thead>
                                          <tr>
                                            <th style={{ width: "40px" }}>
                                              No
                                            </th>
                                            <th>Nama Barang</th>
                                            <th className="text-end">Jml</th>
                                            <th className="text-end">Harga</th>
                                            <th className="text-end">
                                              PPN (%)
                                            </th>
                                            <th className="text-end">
                                              Harga + PPN
                                            </th>
                                            <th className="text-end">Disc</th>
                                            <th className="text-end">
                                              Subtotal
                                            </th>

                                            {isBelumProses ||
                                              isProsesPengajuan ? null : (
                                              <>
                                                {/* kolom validasi & catatan */}
                                                <th className="text-center">
                                                  Valid?
                                                </th>
                                                <th className="text-center">
                                                  Catatan Verifikasi
                                                </th>

                                                {isProsesVerifikasi ? null : (
                                                  <>
                                                    {/* kolom pembayaran */}
                                                    <th className="text-center">
                                                      Lunas?
                                                    </th>
                                                    <th
                                                      className="text-end"
                                                      style={{ width: "150px" }}
                                                    >
                                                      Nominal Bayar
                                                    </th>
                                                    <th className="text-end">
                                                      Selisih
                                                    </th>
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {inv.items.map((it, j) => {
                                            const itemKey =
                                              it.drug_equi_id ?? `item-${j}`;

                                            return (
                                              <tr key={itemKey}>
                                                <td>{j + 1}</td>
                                                <td>
                                                  {it.drug_nm}
                                                  {it.drug_equi_id}
                                                </td>
                                                <td className="text-end">
                                                  {formatNumber(it.qty)}
                                                </td>
                                                <td className="text-end">
                                                  {formatCurrency(it.price)}
                                                </td>
                                                <td className="text-end">
                                                  {formatNumber(it.tax)}
                                                </td>
                                                <td className="text-end">
                                                  {formatCurrency(
                                                    it.nettoprice
                                                  )}
                                                </td>
                                                <td className="text-end">
                                                  {formatCurrency(it.discount)}
                                                </td>
                                                <td className="text-end">
                                                  {formatCurrency(it.subtotal)}
                                                </td>
                                              </tr>
                                            );
                                          })}

                                          {/* TOTAL + ACTION ROW */}
                                          <tr className="fw-semibold bg-white">
                                            <td
                                              colSpan="7"
                                              className="text-end"
                                            >
                                              Total
                                            </td>

                                            {/* Total harga */}
                                            <td className="text-end">
                                              {formatCurrency(
                                                inv.items.reduce(
                                                  (acc, cur) =>
                                                    acc +
                                                    parseFloat(
                                                      cur.subtotal || 0
                                                    ),
                                                  0
                                                )
                                              )}
                                            </td>

                                            {isBelumProses ||
                                              isProsesPengajuan ? null : (
                                              <>
                                                {/* Check all valid */}
                                                <td className="text-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inv.items.every(
                                                      (x) =>
                                                        x.status_validasi ===
                                                        "Valid"
                                                    )}
                                                    onChange={(e) =>
                                                      handleCheckAllValid(
                                                        inv.po_acce_id,
                                                        e.target.checked
                                                      )
                                                    }
                                                    disabled={
                                                      isValidasiLocked ||
                                                      !canEditAkuntansi ||
                                                      isBelumProses ||
                                                      isProsesPengajuan
                                                    }
                                                  />
                                                </td>
                                              </>
                                            )}
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-muted-theme-theme mt-1">
                                      Tidak ada detail barang
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Tidak ada data untuk periode ini
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* === ROW TOTAL GLOBAL === */}
                <tr className="fw-bold table-secondary">
                  <td colSpan="7" className="text-end">
                    TOTAL SEMUA INVOICE
                  </td>

                  {/* Total Faktur */}
                  <td className="text-end">
                    {formatCurrency(
                      data.reduce(
                        (acc, row) => acc + Number(row.total_diajukan || 0),
                        0
                      )
                    )}
                  </td>

                  {/* Total Lunas */}
                  <td className="text-end">
                    {formatCurrency(
                      data.reduce(
                        (acc, row) => acc + Number(row.total_lunas || 0),
                        0
                      )
                    )}
                  </td>

                  {/* Total Hutang */}
                  <td className="text-end">
                    {formatCurrency(
                      data.reduce(
                        (acc, row) => acc + Number(row.total_hutang || 0),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default RekapPembayaranBahanMedis;
