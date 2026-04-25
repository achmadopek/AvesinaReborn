import React, { useEffect, useMemo, useState } from "react";
import { formatDateInput, formatSortDate } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedMonitoringData
} from "../../../api/wj_mobay/MonitoringTagihan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";

/**
 * ===============================
 * MonitoringTagihan (Clean)
 * ===============================
 */

const MonitoringTagihan = () => {

  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedSurat, setExpandedSurat] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const [loading, setLoading] = useState(false);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("tgl_po");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  // data monitoring
  const [groupData, setGroupData] = useState([]);

  const [mirroredSet, setMirroredSet] = useState(new Set());

  // -----------------------
  // HELPERS
  // -----------------------
  const normalizeInvoice = (inv) => ({
    ...inv,
    items: inv.items || [],
    total_tagihan: Number(inv.total_tagihan ?? 0),
    status_pengolahan: "Belum Proses",
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Belum Proses":
        return "bg-secondary";
      case "Proses Pengajuan":
        return "bg-primary";
      case "Proses Verifikasi":
        return "bg-info";
      case "Proses Revisi":
        return "bg-warning";
      case "Proses Pembayaran":
        return "bg-primary";
      case "Batal":
        return "bg-danger";
      case "Selesai":
        return "bg-success";
      default:
        return "bg-dark";
    }
  };

  // -----------------------
  // LOAD DATA
  // -----------------------
  const loadData = async () => {
    setExpandedSurat(null);
    setExpandedInvoice(null);

    setLoading(true);
    try {
      const res = await fetchPaginatedMonitoringData({
        start: startDate,
        end: endDate,
        typeTglFilter: filterDateType,
      });

      setGroupData(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat monitoring pengajuan");
    } finally {
      setLoading(false);
    }
  };

  // set initial date
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  }, []);

  // load ketika filter berubah
  useEffect(() => {
    if (!startDate || !endDate) return;

    loadData();
  }, [startDate, endDate, filterDateType]);

  useEffect(() => {
    if (invoice || drug) {
      setExpandedSurat(filteredData[0]?.pengajuan_id || null);
    }
  }, [invoice, drug]);

  // -----------------------
  // FILTERED DATA
  // -----------------------
  const filteredData = useMemo(() => {
    return groupData.filter((surat) => {

      const matchProvider =
        !provider ||
        surat.prvdr_str?.toLowerCase().includes(provider.toLowerCase());

      const matchInvoice =
        !invoice ||
        surat.invoices?.some((inv) =>
          inv.invoice_no?.toLowerCase().includes(invoice.toLowerCase())
        );

      const matchDrug =
        !drug ||
        surat.invoices?.some((inv) =>
          inv.items?.some((it) =>
            it.drug_nm?.toLowerCase().includes(drug.toLowerCase())
          )
        );

      return matchProvider && matchInvoice && matchDrug;

    });
  }, [groupData, provider, invoice, drug]);

  // -----------------------
  // ACTION HANDLERS
  // -----------------------
  const handleLoadData = () => {
    if (!startDate || !endDate) {
      toast.warn("Pilih periode tanggal dulu");
      return;
    }
    loadData(startDate, endDate, filterDateType);
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Tagihan Pembayaran</h6>
        </div>

        <div className="card-body px-3 py-3">
          {/* ================= FILTER ================= */}
          <div className="d-flex flex-wrap align-items-end mb-3">
            <div className="me-2">
              <label className="form-label fw-semibold mb-1">
                Filter Tanggal
              </label>
              <select
                className="form-control form-control-sm form-control form-control-sm-sm"
                value={filterDateType}
                onChange={(e) => setFilterDateType(e.target.value)}
              >
                <option value="tgl_po">Tgl PO</option>
                <option value="tgl_inv_datang">Tgl Faktur Datang</option>
                <option value="tgl_invoice">Tgl Faktur</option>
                <option value="tgl_jatuh_tempo">Tgl Jatuh Tempo</option>
                <option value="tgl_pengajuan">Tgl Pengajuan</option>
                <option value="tgl_bayar">Tgl Bayar</option>
              </select>
            </div>

            <div className="me-2">
              <label className="form-label fw-semibold mb-1">
                Tanggal Awal
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="me-2">
              <label className="form-label fw-semibold mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="mt-3 mt-sm-0">
              <button
                onClick={handleLoadData}
                className="btn btn-sm btn-outline-primary ms-sm-2"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>

            {/* filter kanan */}
            <div className="ms-auto d-flex">
              <input
                type="text"
                className="form-control form-control-sm me-2"
                placeholder="Provider..."
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
              <input
                type="text"
                className="form-control form-control-sm me-2"
                placeholder="Invoice..."
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
              />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Nama barang..."
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
              />
            </div>
          </div>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tgl Pengajuan</th>
                  <th>Tgl Pengiriman</th>
                  <th>Provider</th>
                  <th>Jumlah Invoice</th>
                  <th>Total Tagihan</th>
                  <th>Total Diajukan</th>
                  <th>Total Dibayarkan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((surat, i) => (
                    <React.Fragment key={surat.pengajuan_id}>
                      {/* ================= ROW SURAT ================= */}
                      <tr>
                        <td>{i + 1}</td>
                        <td>{formatSortDate(surat.tgl_pengajuan)}</td>
                        <td>{formatSortDate(surat.tgl_pengiriman)}</td>
                        <td>{surat.prvdr_str}</td>
                        <td className="text-center">{surat.total_invoice}</td>
                        <td className="text-end">{formatCurrency(surat.total_tagihan)}</td>
                        <td className="text-end">{formatCurrency(surat.total_diajukan)}</td>
                        <td className="text-end">{formatCurrency(surat.total_bayar)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              setExpandedSurat(
                                expandedSurat === surat.pengajuan_id
                                  ? null
                                  : surat.pengajuan_id
                              )
                            }
                          >
                            Detail
                          </button>
                        </td>
                      </tr>

                      {/* ================= DETAIL SURAT ================= */}
                      {expandedSurat === surat.pengajuan_id && (
                        <tr>
                          <td colSpan="9">
                            <div className="p-2 bg-light">

                              <table className="table table-sm table-bordered mb-0">
                                <thead>
                                  <tr>
                                    <th>No</th>
                                    <th>Invoice</th>
                                    <th>Total Diajukan</th>
                                    <th>Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {surat.invoices?.map((inv, j) => {
                                    const isOpen = expandedInvoice === inv.po_acce_id;

                                    return (
                                      <React.Fragment key={inv.po_acce_id}>
                                        {/* ===== ROW INVOICE ===== */}
                                        <tr>
                                          <td>{j + 1}</td>
                                          <td>{inv.invoice_no}</td>
                                          <td className="text-end">
                                            {formatCurrency(inv.total_diajukan)}
                                          </td>
                                          <td>
                                            <button
                                              className="btn btn-sm btn-secondary"
                                              onClick={() =>
                                                setExpandedInvoice(
                                                  isOpen ? null : inv.po_acce_id
                                                )
                                              }
                                            >
                                              Detail Item
                                            </button>
                                          </td>
                                        </tr>

                                        {/* ===== DETAIL ITEM ===== */}
                                        {isOpen && (
                                          <tr>
                                            <td colSpan="4">
                                              <table className="table table-sm table-bordered mb-0">
                                                <thead>
                                                  <tr>
                                                    <th>No</th>
                                                    <th>Nama Barang</th>
                                                    <th>Qty</th>
                                                    <th>Subtotal</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {inv.items?.map((it, k) => (
                                                    <tr key={k}>
                                                      <td>{k + 1}</td>
                                                      <td>{it.drug_nm}</td>
                                                      <td className="text-end">
                                                        {formatNumber(it.qty)}
                                                      </td>
                                                      <td className="text-end">
                                                        {formatCurrency(it.subtotal)}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringTagihan;
