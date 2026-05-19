import React, { useEffect, useMemo, useState } from "react";
import { formatSortDateTime, formatDate } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedDataPengajuanPembayaran,
  bayarBendel,
  batalkanInvoice,
  editTanggalPembayaran
} from "../../../api/wj_mobay/PembayaranTagihan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";

/**
 * ===============================
 * PembayaranTagihan (Clean)
 * ===============================
 */

const PembayaranTagihan = () => {
  // -----------------------
  // STATE
  // -----------------------
  const [openPembayaranSurat, setOpenPembayaranSurat] = useState(false);
  const [suratSelected, setSuratSelected] = useState(null);

  const [historyData, setHistoryData] = useState([]);
  const [data, setData] = useState([]);
  const [expandedSurat, setExpandedSurat] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const [loading, setLoading] = useState(false);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("tgl_pengajuan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  // Tab
  const [activeTab, setActiveTab] = useState("todo");

  // Edit Modal
  const [openEditTanggal, setOpenEditTanggal] = useState(false);
  const [editTanggalData, setEditTanggalData] = useState({
    po_acce_id: "",
    invoice_no: "",
    invoice_paid_dt: "",
    catatan_edit: ""
  });

  const [selectedInvoices, setSelectedInvoices] = useState({});

  const handleProsesPembayaranSurat = (surat) => {

    const semuaInvoice = Object.values(surat.provider)
      .flatMap(p => p.invoices)
      .filter(inv => inv.status_pengolahan !== "Batal");

    // default semua checked
    const initialSelected = {};

    semuaInvoice.forEach(inv => {
      initialSelected[inv.po_acce_id] = true;
    });

    setSelectedInvoices(initialSelected);

    const totalTagihan = semuaInvoice.reduce(
      (acc, inv) => acc + (inv.total_tagihan || 0),
      0
    );

    const totalDiajukan = semuaInvoice.reduce(
      (acc, inv) => acc + (inv.total_diajukan || 0),
      0
    );

    setSuratSelected({
      surat_id: surat.surat_id,
      no_surat: surat.no_surat,
      provider: surat.provider,

      tgl_bayar: new Date().toISOString().slice(0, 10),

      catatan: "Ok, selesai",

      totalTagihan,
      totalDiajukan
    });

    setOpenPembayaranSurat(true);
  };

  const toggleInvoice = (po_acce_id) => {
    setSelectedInvoices(prev => ({
      ...prev,
      [po_acce_id]: !prev[po_acce_id]
    }));
  };

  const setInvoiceAction = (po_acce_id, action) => {
    setSelectedInvoices(prev => ({
      ...prev,
      [po_acce_id]: {
        ...prev[po_acce_id],
        checked: action === "bayar",
        action
      }
    }));
  };

  const handleExpandSurat = (id) => {
    setExpandedSurat(prev => prev === id ? null : id);
  };

  const toggleDetail = (id) => {
    setExpandedInvoice(prev => prev === id ? null : id);
  };

  // -----------------------
  // LOAD DATA
  // -----------------------
  const loadData = async (start, end, type) => {
    setLoading(true);
  
    try {
  
      const res = await fetchPaginatedDataPengajuanPembayaran({
        start,
        end,
        typeTglFilter: type,
      });
  
      setData(res.todo || []);
      setHistoryData(res.history || []);
  
    } catch (err) {
  
      console.error(err);
  
      toast.error("Gagal memuat data");
  
      setData([]);
      setHistoryData([]);
  
    } finally {
  
      setLoading(false);
  
    }
  };

  // initial load today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    loadData(today, today, filterDateType);
  }, []);

  // -----------------------
  // FILTERED DATA
  // -----------------------
  const normalize = (v) => (v || "").toLowerCase();

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

  const handleBatalkanInvoice = async (inv) => {

    const result = await Swal.fire({
      title: "Batalkan Invoice?",
      text: `Invoice ${inv.invoice_no} akan dibatalkan`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan"
    });

    if (!result.isConfirmed) {
      return;
    }

    try {

      await batalkanInvoice({
        po_acce_id: inv.po_acce_id
      });

      toast.success("Invoice berhasil dibatalkan");

      handleLoadData();

    } catch (err) {

      toast.error("Gagal membatalkan invoice");

    }
  };

  const handleOpenEditTanggal = (surat) => {
    const firstPaidInvoice =
      Object.values(surat.provider || {})
        .flatMap(p => p.invoices)
        .find(inv =>
          inv.status_pengolahan === "Selesai"
        );

    if (!firstPaidInvoice) {
      toast.warning("Belum ada invoice selesai");
      return;
    }

    setEditTanggalData({
      pengajuan_id: surat.surat_id,
      no_surat: surat.no_surat,

      invoice_paid_dt:
        firstPaidInvoice.invoice_paid_dt
          ? new Date(firstPaidInvoice.invoice_paid_dt)
              .toLocaleDateString("en-CA")
          : "",

      catatan_edit: ""
    });

    setOpenEditTanggal(true);
  };

  const handleSaveEditTanggal = async () => {
    try {

      await editTanggalPembayaran({
        pengajuan_id:
          editTanggalData.pengajuan_id,

        invoice_paid_dt:
          editTanggalData.invoice_paid_dt,

        catatan_edit:
          editTanggalData.catatan_edit
      });

      toast.success(
        "Tanggal pembayaran berhasil diubah"
      );

      setOpenEditTanggal(false);

      handleLoadData();

    } catch (err) {

      console.error(err);

      toast.error(
        err?.response?.data?.message ||
        "Gagal edit tanggal pembayaran"
      );
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= MODAL VERIFIKASI ================= */}
      <Modal
        show={openPembayaranSurat}
        onHide={() => setOpenPembayaranSurat(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Pembayaran SPJ</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            Surat: <b>{suratSelected?.no_verifikasi}</b>
          </p>

          <table className="table table-sm table-bordered">
            <tbody>
              <tr>
                <td>Total Tagihan</td>
                <td className="text-end">
                  {formatCurrency(suratSelected?.totalTagihan || 0)}
                </td>
              </tr>

              <tr>
                <td>Total Diajukan</td>
                <td className="text-end">
                  {formatCurrency(suratSelected?.totalDiajukan || 0)}
                </td>
              </tr>

              <tr>
                <td>Total Dibayar</td>
                <td className="text-end fw-bold">
                  {formatCurrency(suratSelected?.totalDiajukan || 0)}
                </td>
              </tr>

              <tr>
                <td>Tanggal Dibayar</td>
                <td className="text-end fw-bold">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={
                      suratSelected?.tgl_bayar
                        ? suratSelected.tgl_bayar.slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setSuratSelected((prev) => ({
                        ...prev,
                        tgl_bayar: e.target.value,
                      }))
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3">
            <div className="fw-semibold mb-2">
              Pilih Invoice Dibayar
            </div>

            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Invoice</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {Object.values(suratSelected?.provider || {})
                  .flatMap(p => p.invoices)
                  .filter(inv => inv.status_pengolahan !== "Batal")
                  .map((inv) => {

                    const checked =
                      selectedInvoices[inv.po_acce_id] || false;

                    return (
                      <tr key={inv.po_acce_id}>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleInvoice(inv.po_acce_id)
                            }
                          />
                        </td>

                        <td>{inv.invoice_no}</td>

                        <td className="text-end">
                          {formatCurrency(inv.total_diajukan)}
                        </td>

                        <td className="text-center">
                          {checked ? (
                            <span className="badge bg-success">
                              Akan Dibayar
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              Ditunda
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold">
              Catatan Pembayaran
            </label>

            <textarea
              className="form-control form-control-sm"
              value={suratSelected?.catatan || ""}
              onChange={(e) =>
                setSuratSelected(prev => ({
                  ...prev,
                  catatan: e.target.value
                }))
              }
              rows={3}
            />
          </div>

        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setOpenPembayaranSurat(false)}
          >
            Batal
          </Button>

          <Button
            variant="success"
            onClick={async () => {
              try {

                const invoiceActions = Object.entries(selectedInvoices)
                  .filter(([_, checked]) => checked)
                  .map(([po_acce_id]) => ({
                    po_acce_id
                  }));

                await bayarBendel({
                  pengajuan_id: suratSelected.surat_id,
                  catatan: suratSelected.catatan,
                  tgl_bayar: suratSelected.tgl_bayar,
                  invoice_actions: invoiceActions
                });

                toast.success("Pembayaran bendel berhasil");

                setOpenPembayaranSurat(false);

                handleLoadData();

              } catch (err) {
                toast.error("Gagal bayar bendel");
              }
            }}
          >
            Proses Bayar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============== MODAL EDIT TGL BAYAR ============= */}
      <Modal
        show={openEditTanggal}
        onHide={() => setOpenEditTanggal(false)}
        centered
        backdrop="static"
      >

        <Modal.Header closeButton>
          <Modal.Title>
            Edit Tanggal Pembayaran
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {/* ================= INFO SURAT ================= */}
          <div className="mb-3">

            <label className="form-label fw-semibold">
              No Surat
            </label>

            <input
              type="text"
              className="form-control"
              value={editTanggalData.no_surat || ""}
              disabled
            />

          </div>

          {/* ================= TGL BAYAR ================= */}
          <div className="mb-3">

            <label className="form-label fw-semibold">
              Tanggal Pembayaran Baru
            </label>

            <input
              type="date"
              className="form-control"
              value={editTanggalData.invoice_paid_dt || ""}
              onChange={(e) =>
                setEditTanggalData(prev => ({
                  ...prev,
                  invoice_paid_dt: e.target.value
                }))
              }
            />

            <small className="text-muted">
              Tanggal akan diupdate ke seluruh invoice
              yang sudah selesai pada pengajuan ini.
            </small>

          </div>

          {/* ================= CATATAN ================= */}
          <div>

            <label className="form-label fw-semibold">
              Catatan Edit
            </label>

            <textarea
              className="form-control"
              rows={3}
              placeholder="Opsional..."
              value={editTanggalData.catatan_edit || ""}
              onChange={(e) =>
                setEditTanggalData(prev => ({
                  ...prev,
                  catatan_edit: e.target.value
                }))
              }
            />

          </div>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setOpenEditTanggal(false)}
          >
            Batal
          </Button>

          <Button
            variant="warning"
            onClick={handleSaveEditTanggal}
          >
            Simpan Perubahan
          </Button>

        </Modal.Footer>

      </Modal>

      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Pembayaran Tagihan</h6>
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
                <option value="tgl_pengajuan">Tgl Pengajuan</option>
                {/*<option value="po_dt">Tgl PO</option>
                <option value="invoice_dt">Tgl Invoice</option>
                <option value="invoice_received_dt">Tgl Faktur Datang</option>
                <option value="invoice_due_dt">Tgl Jatuh Tempo</option>
                <option value="invoice_paid_dt">Tgl Bayar</option>*/}
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

          {/* ================= TAB ================= */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "todo" ? "active" : ""
                }`}
                onClick={() => setActiveTab("todo")}
              >
                Pembayaran
                <span className="badge bg-primary ms-2">
                  {data.length}
                </span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "history" ? "active" : ""
                }`}
                onClick={() => setActiveTab("history")}
              >
                History
                <span className="badge bg-secondary ms-2">
                  {historyData.length}
                </span>
              </button>
            </li>
          </ul>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th>No Surat</th>
                  <th>Tgl Surat</th>
                  <th>Tgl Konsolidasi</th>
                  <th>Tgl Pengajuan</th>
                  <th>Tgl Penerimaan</th>
                  <th>Tgl Verifikasi</th>
                  <th>Tgl Pembayaran</th>
                  <th>Provider</th>
                  <th>Total Invoice</th>
                  <th>Total Diajukan</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Memuat data...
                    </td>
                  </tr>
                ) : (activeTab === "todo"
                    ? data.length === 0
                    : historyData.length === 0
                ) ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  (activeTab === "todo"
                    ? data
                    : historyData
                  ).map((surat, i) => (
                    <React.Fragment key={surat.surat_id || i}>

                      {/* ===== ROW SURAT ===== */}
                      <tr>
                        <td className="text-center">{i + 1}</td>
                        <td>{surat.no_surat}</td>
                        <td>{formatDate(surat.tgl_surat)}</td>
                        <td>{formatSortDateTime(surat.tgl_konsolidasi)}</td>
                        <td>{formatSortDateTime(surat.tgl_pengajuan)}</td>
                        <td>{formatSortDateTime(surat.tgl_terima)}</td>
                        <td>{formatSortDateTime(surat.tgl_verifikasi)}</td>
                        <td>{formatSortDateTime(surat.tgl_pembayaran) || "-"}</td>

                        <td>
                          {Object.values(surat.provider || {}).map((p) => (
                            <div key={p.prvdr_id}>
                              {p.prvdr_str}
                            </div>
                          ))}
                        </td>

                        <td>
                          {Object.values(surat.provider || {}).reduce(
                            (acc, p) => acc + p.invoices.length,
                            0
                          )}
                        </td>

                        <td className="text-end">
                          {formatCurrency(
                            Object.values(surat.provider || {}).reduce(
                              (acc, p) =>
                                acc +
                                p.invoices.reduce(
                                  (sum, inv) => sum + inv.total_diajukan,
                                  0
                                ),
                              0
                            )
                          )}
                        </td>

                        <td className="text-center">
                          <button
                            className={`btn btn-sm ${
                              expandedSurat === surat.surat_id
                                ? "btn-outline-secondary"
                                : "btn-primary"
                            }`}
                            style={{margin: "2px"}}
                            onClick={() => handleExpandSurat(surat.surat_id)}
                          >
                            {expandedSurat === surat.surat_id
                              ? "Tutup"
                              : "Detail"}
                          </button>

                          {activeTab === "history" && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              style={{ margin: "2px" }}
                              onClick={() => handleOpenEditTanggal(surat)}
                            >
                              Edit Tgl Bayar
                            </button>
                          )}

                          {activeTab === "todo" && (
                            <button
                              className="btn btn-sm btn-success"
                              style={{margin: "2px"}}
                              onClick={() => {
                                Swal.fire({
                                  title: "Konfirmasi Pembayaran",
                                  text: "Yakin ingin memproses pembayaran bendel ini?",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#198754",
                                  cancelButtonColor: "#6c757d",
                                  confirmButtonText: "Ya, Proses",
                                  cancelButtonText: "Batal"
                                }).then(async (result) => {
                                  if (!result.isConfirmed) return;

                                  handleProsesPembayaranSurat(surat);
                                });
                              }}
                            >
                              Bayarkan
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* ===== DETAIL SURAT ===== */}
                      {expandedSurat === surat.surat_id && (
                        <tr>
                          <td colSpan="11">
                            <div className="p-3 bg-light">

                              {Object.values(surat.provider || {}).map((providerGroup) => (

                                <div key={providerGroup.prvdr_id} className="mb-3">

                                  <div className="fw-bold mb-2">
                                    Provider: {providerGroup.prvdr_str}
                                  </div>

                                  <table className="table table-sm table-bordered">
                                    <thead>
                                      <tr>
                                        <th>No</th>
                                        <th>Invoice</th>
                                        <th>Total Diajukan</th>
                                        <th>Status</th>
                                        <th className="text-center">Aksi</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {providerGroup.invoices.map((inv, j) => {

                                        const isExpanded =
                                          expandedInvoice === inv.po_acce_id;

                                        return (
                                          <React.Fragment key={inv.po_acce_id}>

                                            <tr>
                                              <td>{j + 1}</td>
                                              <td>{inv.invoice_no}</td>
                                              <td>
                                                {formatCurrency(inv.total_diajukan)}
                                              </td>
                                              <td className="text-center">
                                              <span
                                                className={`badge ${
                                                  inv.status_pengolahan === "Selesai"
                                                    ? "bg-success"
                                                    : inv.status_pengolahan === "Batal"
                                                    ? "bg-danger"
                                                    : "bg-warning text-dark"
                                                }`}
                                              >
                                                {inv.status_pengolahan}
                                              </span>
                                              </td>

                                              <td className="text-center">
                                                <button
                                                  className={`btn btn-sm ${
                                                    isExpanded
                                                      ? "btn-outline-secondary"
                                                      : "btn-info"
                                                  }`}
                                                  onClick={() =>
                                                    toggleDetail(inv.po_acce_id)
                                                  }
                                                >
                                                  {isExpanded
                                                    ? "Tutup Item"
                                                    : "Detail Item"}
                                                </button>

                                                {activeTab === "todo" && (
                                                  <button
                                                    className="btn btn-sm btn-outline-danger ms-1"
                                                    onClick={() => handleBatalkanInvoice(inv)}
                                                  >
                                                    Batalkan
                                                  </button>
                                                )}
                                              </td>
                                            </tr>

                                            {/* ===== DETAIL ITEM ===== */}
                                            {isExpanded && (
                                              <tr>
                                                <td colSpan="5" className="bg-light">
                                                  <div className="p-2">

                                                    <div className="fw-bold mb-2">
                                                      Rincian Barang :
                                                    </div>

                                                    <table className="table table-sm table-bordered">
                                                      <thead>
                                                        <tr>
                                                          <th>No</th>
                                                          <th>Nama Barang</th>
                                                          <th className="text-end">Qty</th>
                                                          <th className="text-end">Subtotal</th>
                                                          <th className="text-end">Diajukan</th>
                                                          <th>Status</th>
                                                        </tr>
                                                      </thead>

                                                      <tbody>
                                                        {inv.items.map((item, idx) => (
                                                          <tr key={item.item_id || idx}>
                                                            <td>{idx + 1}</td>
                                                            <td>{item.drug_nm}</td>
                                                            <td className="text-end">
                                                              {formatNumber(item.qty)}
                                                            </td>
                                                            <td className="text-end">
                                                              {formatCurrency(item.subtotal)}
                                                            </td>
                                                            <td className="text-end">
                                                              {formatCurrency(item.nominal_ajukan)}
                                                            </td>
                                                            <td className="text-center">
                                                              {item.is_checked ? (
                                                                <span className="badge bg-success">
                                                                  Diajukan
                                                                </span>
                                                              ) : (
                                                                <span className="badge bg-secondary">
                                                                  Tidak
                                                                </span>
                                                              )}
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>

                                                    </table>

                                                  </div>
                                                </td>
                                              </tr>
                                            )}

                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>

                                </div>
                              ))}

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

export default PembayaranTagihan;
