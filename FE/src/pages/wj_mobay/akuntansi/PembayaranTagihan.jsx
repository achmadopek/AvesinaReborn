import React, { useEffect, useMemo, useState } from "react";
import { formatSortDateTime, formatDate } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedDataPengajuanPembayaran,
  bayarBendel
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

  const handleProsesPembayaranSurat = (surat) => {
    // Hitung total seluruh invoice dalam surat
    const semuaInvoice = Object.values(surat.provider)
      .flatMap(p => p.invoices);

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
      no_verifikasi: surat.no_verifikasi,
      no_surat: surat.no_surat,
      tgl_bayar: surat.tgl_bayar
        ? surat.tgl_bayar.slice(0, 10)
        : new Date().toISOString().slice(0, 10), // default hari ini
      catatan: surat.catatan || "Ok, selesai",
      totalTagihan,
      totalDiajukan
    });

    setOpenPembayaranSurat(true);
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

      const normalized = res.data || [];
      setData(normalized);

      const draft = {};
      normalized.forEach((inv) => {
        draft[inv.po_acce_id] = inv.status_validasi === "Valid";
      });

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
      setData([]);
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

                await bayarBendel({
                  pengajuan_id: suratSelected.surat_id,
                  catatan: suratSelected.catatan,
                  tgl_bayar: suratSelected.tgl_bayar
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
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.map((surat, i) => (
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

                        <td>
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
                            className="btn btn-sm btn-primary"
                            onClick={() => handleExpandSurat(surat.surat_id)}
                          >
                            Detail
                          </button>

                          <button
                            className="btn btn-sm btn-success ms-2"
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
                                                <span className="badge bg-success">
                                                  {inv.status_pengolahan}
                                                </span>
                                              </td>

                                              <td className="text-center">
                                                <button
                                                  className="btn btn-sm btn-outline-secondary"
                                                  onClick={() =>
                                                    toggleDetail(inv.po_acce_id)
                                                  }
                                                >
                                                  {isExpanded
                                                    ? "Tutup Item"
                                                    : "Detail Item"}
                                                </button>
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
