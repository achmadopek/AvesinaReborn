import React, { useEffect, useMemo, useState } from "react";
import { formatSortDate } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedDataPengajuanPembayaran,
  prosesValidasiPembayaran,
  mulaiVerifikasi,
  cetakVerifikasi,
  getNoVerifikasi
} from "../../../api/wj_mobay/VerifikasiPengajuan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";

/**
 * ===============================
 * VerifikasiPengajuan (Clean)
 * ===============================
 */

const VerifikasiPengajuan = () => {

  // -----------------------
  // STATE
  // -----------------------

  const { peg_id } = useAuth();

  const [data, setData] = useState([]);
  const [expandedSurat, setExpandedSurat] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const [showMulaiModal, setShowMulaiModal] = useState(false);
  const [suratVerif, setSuratVerif] = useState(null);
  const [noSuratManual, setNoSuratManual] = useState("VER/... . .../IV/2026");

  const [loading, setLoading] = useState(false);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("tgl_pengajuan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  const [verifikasiData, setVerifikasiData] = useState(null);
  const [showVerifikasiModal, setShowVerifikasiModal] = useState(false);

  const handleMulaiVerifikasi = async (surat) => {
    setSuratVerif(surat);

    try {
      const res = await getNoVerifikasi();
      setNoSuratManual(res.no_verifikasi);
    } catch {
      toast.error("Gagal generate nomor");
    }

    setShowMulaiModal(true);
  };

  const handleExpandSurat = (id) => {
    setExpandedSurat(prev => prev === id ? null : id);
  };

  const toggleDetail = (id) => {
    setExpandedInvoice(prev => prev === id ? null : id);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Belum Proses":
        return "bg-secondary";
      case "Proses Pengajuan":
        return "bg-primary";
      case "Berkas Diterima":
        return "bg-success";
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

  const filteredData = useMemo(() => {
    return data.filter((inv) => {
      const matchProvider =
        !provider ||
        normalize(inv.prvdr_str).includes(normalize(provider));

      const matchInvoice =
        !invoice ||
        normalize(inv.invoice_no).includes(normalize(invoice));

      const matchDrug =
        !drug ||
        (inv.items || []).some((it) =>
          normalize(it.item_name).includes(normalize(drug))
        );

      return matchProvider && matchInvoice && matchDrug;
    });
  }, [data, provider, invoice, drug]);

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

  // ---- Verifikasi & Validasi
  const handleProsesVerifikasi = (inv, surat_id) => {
    setVerifikasiData({
      po_acce_id: inv.po_acce_id,
      surat_id: surat_id,
      status_validasi: "Tidak Valid",
      catatan_verifikasi: "",
      total_tagihan: inv.total_tagihan || 0,
      total_diajukan: inv.total_diajukan || 0,
      items: inv.items || [],
    });

    setShowVerifikasiModal(true);
  };

  const isAllInvoiceValidatedLocal = () => {
    const surat = data.find(s => s.surat_id === verifikasiData.surat_id);
    if (!surat) return false;

    const allInvoices = Object.values(surat.provider)
      .flatMap(p => p.invoices);

    return allInvoices.every(inv => {
      // invoice yg barusan divalidasi → paksa dianggap sudah
      if (inv.po_acce_id === verifikasiData.po_acce_id) return true;

      return (
        inv.status_validasi === "Valid" ||
        inv.status_validasi === "Tidak Valid"
      );
    });
  };

  const handleSubmitValidasi = async () => {
    try {
      await prosesValidasiPembayaran({
        po_acce_id: verifikasiData.po_acce_id,
        status_validasi: verifikasiData.status_validasi,
        catatan_verifikasi: verifikasiData.catatan_verifikasi,
      });

      toast.success("Invoice berhasil divalidasi");

      // cek langsung TANPA nunggu reload
      const selesaiSemua = isAllInvoiceValidatedLocal();

      if (selesaiSemua) {

        try {
          // 1. tampilkan loading dulu
          Swal.fire({
            title: "Generating PDF...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // 2. generate PDF
          const res = await cetakVerifikasi({
            surat_id: verifikasiData.surat_id
          });

          // bikin blob
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;

          // =======================
          // ambil filename dari BE
          // =======================
          const disposition = res.headers["content-disposition"];

          let fileName = "Lembar_Verifikasi.pdf";

          if (disposition) {
            const match = disposition.match(/filename="(.+)"/);
            if (match) {
              fileName = match[1];
            }
          } else {
            // =======================
            // fallback dari FE
            // =======================
            const safeNo = (verifikasiData?.no_verifikasi || "NO")
              .replace(/[\/\\]/g, "-");

            fileName = `Lembar_Verifikasi_${safeNo}.pdf`;
          }

          // set download
          link.setAttribute("download", fileName);

          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          // 3. tutup loading
          Swal.close();

          // 4. tampilkan sukses
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "PDF berhasil didownload",
            timer: 1500,
            showConfirmButton: false
          });

        } catch (err) {

          Swal.close();

          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Gagal generate PDF"
          });
        }
      }

      // baru reload data setelah semua proses
      await loadData(startDate, endDate, filterDateType);

      setShowVerifikasiModal(false);

    } catch (err) {
      toast.error("Gagal validasi invoice");
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= MODAL MULAI VERIFIKASI ================= */}
      <Modal
        show={showMulaiModal}
        onHide={() => setShowMulaiModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Mulai Verifikasi</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Nomor Verifikasi
            </label>

            <input
              type="text"
              className="form-control form-control-sm"
              value={noSuratManual}
              onChange={(e) => setNoSuratManual(e.target.value)}
            />
          </div>

          <div className="alert alert-warning">
            Status akan berubah menjadi <b>Proses Verifikasi</b>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMulaiModal(false)}
          >
            Batal
          </Button>

          <Button
            variant="success"
            onClick={async () => {
              try {

                await mulaiVerifikasi({
                  pengajuan_id: suratVerif?.surat_id,
                  status_pengolahan: "Proses Verifikasi",
                  peg_id: peg_id
                });

                toast.success("Verifikasi dimulai");

                setShowMulaiModal(false);
                handleLoadData();

              } catch (err) {

                console.error("Error mulai verifikasi:", err.response?.data || err);

                toast.error(
                  err.response?.data?.message ||
                  "Gagal memulai verifikasi"
                );
              }
            }}
          >
            Mulai Verifikasi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= MODAL VERIFIKASI ================= */}
      <Modal
        show={showVerifikasiModal}
        onHide={() => setShowVerifikasiModal(false)}
        size="xl"
        backdrop="static"
        centered
        dialogClassName="modal-theme"
      >

        <Modal.Header closeButton>
          <Modal.Title>Verifikasi Invoice</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="table-responsive">
            <table className="table table-sm table-bordered table-theme">
              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Nama Barang</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Harga</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Nominal Diajukan</th>
                </tr>
              </thead>
              <tbody>
                {verifikasiData?.items.map((it, i) => (
                  <tr
                    key={it.drug_equi_id || i}
                    className={!it.is_checked ? "table-secondary" : ""}
                  >
                    <td>{i + 1}</td>
                    <td>{it.drug_nm}</td>

                    <td className="text-end">
                      {formatNumber(it.qty)}
                    </td>

                    <td className="text-end">
                      {formatCurrency(it.price)}
                    </td>

                    <td className="text-end fw-semibold">
                      {formatCurrency(it.subtotal)}
                    </td>

                    {/* STATUS DIAJUKAN */}
                    <td className="text-center">
                      {it.is_checked ? (
                        <span className="badge bg-success">Diajukan</span>
                      ) : (
                        <span className="badge bg-secondary">Tidak</span>
                      )}
                    </td>

                    {/* NOMINAL AJUKAN */}
                    <td className="text-end">
                      {it.is_checked
                        ? formatCurrency(it.nominal_ajukan || it.subtotal)
                        : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="fw-semibold bg-light">
                  <td colSpan={4} className="text-end">
                    Total
                  </td>
                  <td className="text-end">{formatCurrency(verifikasiData?.total_tagihan || 0)}</td>
                  <td className="text-center">—</td>
                  <td className="text-end">
                    {formatCurrency(verifikasiData?.total_diajukan || 0)}
                  </td>
                </tr>
              </tbody>
            </table>

          </div>

          <div className="row">
            <div className="col-md-10">
              <label className="form-label fw-semibold">
                Catatan Verifikasi
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={verifikasiData?.catatan_verifikasi}
                onChange={(e) =>
                  setVerifikasiData(p => ({
                    ...p,
                    catatan_verifikasi: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-2 text-center">
              <label className="form-label fw-semibold">
                Validasi Invoice
              </label>
              <br />
              <input
                type="checkbox"
                style={{ width: "40px", height: "40px" }}
                checked={verifikasiData?.status_validasi === "Valid"}
                onChange={(e) => {
                  const isChecked = e.target.checked;

                  setVerifikasiData((p) => ({
                    ...p,
                    status_validasi: isChecked ? "Valid" : "Tidak Valid",
                    catatan_verifikasi: isChecked
                      ? (p.catatan_verifikasi?.trim() ? p.catatan_verifikasi : "Ok, lengkap")
                      : "",
                  }));
                }}
              />
              <br />
              <span className="ms-2 fw-semibold">
                {verifikasiData?.status_validasi}
              </span>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowVerifikasiModal(false)}
          >
            Batal
          </Button>

          <Button
            variant="success"
            onClick={handleSubmitValidasi}
          >
            Validasi Invoice
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Verifikasi Verkas Pengajuan</h6>
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
                  <th>No Pengantar</th>
                  <th>No Verifikasi</th>
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
                        <td>{surat.no_verifikasi}</td>
                        <td>{formatSortDate(surat.tgl_surat)}</td>
                        <td>{formatSortDate(surat.tgl_konsolidasi)}</td>
                        <td>{formatSortDate(surat.tgl_pengajuan)}</td>
                        <td>{formatSortDate(surat.tgl_terima)}</td>
                        <td>{formatSortDate(surat.tgl_verifikasi)}</td>
                        <td>
                          {Object.values(surat.provider).map((p) => (
                            <div key={p.prvdr_id}>
                              {p.prvdr_str}
                            </div>
                          ))}
                        </td>

                        <td>
                          {Object.values(surat.provider).reduce(
                            (acc, p) => acc + p.invoices.length,
                            0
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            Object.values(surat.provider).reduce(
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

                          {Object.values(surat.provider || {}).some((p) =>
                            p.invoices.some(
                              (inv) => inv.status_pengolahan === "Berkas Diterima"
                            )
                          ) && (
                              <button
                                className="btn btn-sm btn-success ms-2"
                                onClick={() => handleMulaiVerifikasi(surat)}
                              >
                                Mulai Verifikasi
                              </button>
                            )}
                        </td>
                      </tr>

                      {/* ===== DETAIL SURAT ===== */}
                      {expandedSurat === surat.surat_id && (
                        <tr>
                          <td colSpan="12">
                            <div className="p-3 bg-light">

                              {Object.values(surat.provider).map((providerGroup) => (

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

                                                {inv.status_pengolahan ===
                                                  "Proses Verifikasi" && (
                                                    <button
                                                      className="btn btn-sm btn-outline-success ms-2"
                                                      onClick={() => handleProsesVerifikasi(inv, surat.surat_id)}
                                                    >
                                                      Verifikasi
                                                    </button>
                                                  )
                                                }
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

export default VerifikasiPengajuan;
