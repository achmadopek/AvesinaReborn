import React, { useEffect, useMemo, useState } from "react";
import { formatDateInput, formatSortDate, formatSortDateTime } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedDataPengajuanPembayaran,
  fetchProviderList,
  fetchDrugList,
  konsolidasiInvoice
} from "../../../api/wj_mobay/KonsolidasiTagihan";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";

/**
 * ===============================
 * KonsolidasiTagihan (Clean)
 * ===============================
 */

const KonsolidasiTagihan = () => {
  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  const [loading, setLoading] = useState(false);

  // daftar provider
  const [providerList, setProviderList] = useState([]);

  // daftar barang
  const [drugList, setDrugList] = useState([]);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("tgl_po");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  // modal konsolidasi
  const [showKonsolidasiModal, setShowKonsolidasiModal] = useState(false);

  const formatRibuan = (val) => {
    if (!val && val !== 0) return "";
    return new Intl.NumberFormat("id-ID").format(val);
  };

  const [totalDiajukanDisplay, setTotalDiajukanDisplay] = useState("");

  const [konsolidasiData, setKonsolidasiData] = useState({
    po_acce_id: "",
    po_dt: "",
    invoice_dt: "",
    invoice_due_dt: "",
    invoice_received_dt: "",
    jenis_transaksi: "Pembelian",
    status_validasi: "",
    items: [],
  });

  const [mirroredSet, setMirroredSet] = useState(new Set());

  const selisih =
    (konsolidasiData.total_diajukan || 0) -
    (konsolidasiData.nettoprice || 0);

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
  const loadData = async (start, end, type) => {
    setLoading(true);
    try {
      const res = await fetchPaginatedDataPengajuanPembayaran({
        start,
        end,
        typeTglFilter: type,
      });

      const normalized = (res.data || []).map(normalizeInvoice);
      setData(normalized);

      // OPSI A: bangun Set dari data sumber
      const mirroredIds = normalized
        .filter(inv => inv.is_mirrored === true)
        .map(inv => inv.po_acce_id);

      setMirroredSet(new Set(mirroredIds));

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

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const res = await fetchProviderList();
        setProviderList(res.data || []);
      } catch (err) {
        toast.error("Gagal memuat data provider");
      }
    };

    loadProvider();
  }, []);

  useEffect(() => {
    const loadDrug = async () => {
      try {
        const res = await fetchDrugList();
        setDrugList(res.data || []);
      } catch (err) {
        toast.error("Gagal memuat data barang");
      }
    };

    loadDrug();
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

  const groupedByProvider = useMemo(() => {
    const map = {};

    filteredData.forEach(inv => {
      const key = inv.prvdr_id || "UNKNOWN";

      if (!map[key]) {
        map[key] = {
          prvdr_id: inv.prvdr_id,
          prvdr_str: inv.prvdr_str,
          data: [],
        };
      }

      map[key].data.push(inv);
    });

    return Object.values(map);
  }, [filteredData]);

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

  const toggleDetail = (inv) => {
    setExpandedRow(
      expandedRow === inv.po_acce_id ? null : inv.po_acce_id
    );
  };

  // ---- Konsolidasi
  const openModalKonsolidasi = (inv) => {
    const today = new Date().toISOString().slice(0, 10);

    setKonsolidasiData({
      po_acce_id: inv.po_acce_id,
      po_id: inv.po_id,
      invoice_no: inv.invoice_no,
      srvc_unit_id: inv.srvc_unit_id,
      srvc_unit_nm: inv.srvc_unit_nm,
      prvdr_id: inv.prvdr_id,
      prvdr_str: inv.prvdr_str,
      prvdr_address: inv.prvdr_address + ' - ' + inv.prvdr_city,
      po_dt: formatDateInput(inv.po_dt),
      nettoprice: inv.total_tagihan, // asli
      total_diajukan: inv.total_tagihan, // default = sama dulu

      invoice_dt: formatDateInput(inv.invoice_dt) || today,
      invoice_due_dt: formatDateInput(inv.invoice_due_dt) || today,
      invoice_received_dt: formatDateInput(inv.invoice_received_dt) || today,

      jenis_transaksi: inv.jenis_transaksi || "Pembelian",

      items: (inv.items || []).map(it => ({
        ...it,
        checked: true, // default ikut
        nominal_konsolidasi: Math.floor(Number(it.subtotal || 0)),
        jenis_pengadaan: it.jenis_pengadaan || "Pembelian",
        jenis_item: it.jenis_item || "Lainnya",
      })),
    });

    setTotalDiajukanDisplay(formatRibuan(inv.total_tagihan));

    setShowKonsolidasiModal(true);
  };

  const updateItem = (idx, field, value) => {
    setKonsolidasiData(prev => ({
      ...prev,
      items: prev.items.map((item, index) =>
        index === idx
          ? {
            ...item,
            [field]: value
          }
          : item
      )
    }));
  };

  const submitKonsolidasi = async () => {
    const { items, ...header } = konsolidasiData;

    if (!header.total_diajukan) {
      toast.warn("Total diajukan harus diisi");
      return;
    }

    /*if (header.total_diajukan > header.nettoprice) {
      toast.error("Total diajukan tidak boleh melebihi total tagihan");
      return;
    }*/ //jika nnti pengajuan tidak bisa pembulatan ke atas

    try {
      const res = await konsolidasiInvoice({
        header: {
          ...header,

          po_dt: formatDateInput(header.po_dt),
          invoice_dt: formatDateInput(header.invoice_dt),
          invoice_due_dt: formatDateInput(header.invoice_due_dt),
          invoice_received_dt: formatDateInput(header.invoice_received_dt),

          total_tagihan: header.nettoprice,      // asli
          total_diajukan: header.total_diajukan  // manual
        },

        items: items.map(it => ({
          drug_equi_id: it.drug_equi_id,
          item_name: it.item_name,
          qty: it.qty,
          price: it.price,
          tax: it.tax,
          discount: it.discount,
          nettoprice: it.nettoprice,
          subtotal: it.subtotal,

          jenis_pengadaan: it.jenis_pengadaan,
          jenis_item: it.jenis_item,

          is_checked: 1
        })),
      });

      toast.success(res.message || "Konsolidasi berhasil");
      setShowKonsolidasiModal(false);
      handleLoadData();

    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal konsolidasi");
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= MODAL KONSOLIDASI ================= */}
      <Modal
        show={showKonsolidasiModal}
        onHide={() => setShowKonsolidasiModal(false)}
        centered
        backdrop="static"
        size="xl"
        dialogClassName="modal-theme"
      >
        <Modal.Header closeButton>
          <Modal.Title>Konsolidasi Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {["invoice_received_dt", "invoice_dt", "invoice_due_dt"].map(
              (f, i) => (
                <div className="col-md-4 mb-2" key={f}>
                  <label className="form-label fw-semibold">
                    {i === 0
                      ? "Tanggal Faktur Diterima"
                      : i === 1
                        ? "Tanggal Faktur"
                        : "Tanggal Jatuh Tempo"}
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={konsolidasiData[f]}
                    onChange={(e) =>
                      setKonsolidasiData((p) => ({
                        ...p,
                        [f]: e.target.value,
                      }))
                    }
                  />
                </div>
              )
            )}
          </div>

          <hr />
          <div className="row">
            {/* === PROVIDER === */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Provider
              </label>
              <select
                className="form-control form-control-sm"
                value={konsolidasiData.prvdr_id || ""}
                onChange={(e) => {
                  const sel = providerList.find(
                    p => String(p.prvdr_id) === e.target.value
                  );

                  if (!sel) return;

                  setKonsolidasiData(p => ({
                    ...p,
                    prvdr_id: sel.prvdr_id,
                    prvdr_str: sel.prvdr_str,
                  }));
                }}
              >
                <option value="">-- Pilih Provider --</option>
                {providerList.map(p => (
                  <option key={p.prvdr_id} value={p.prvdr_id}>
                    {p.prvdr_str} | {p.city}
                  </option>
                ))}
              </select>
            </div>

            {/* === INVOICE NO === */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Nomor Faktur
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={konsolidasiData.invoice_no || ""}
                placeholder="Masukkan nomor faktur"
                onChange={(e) =>
                  setKonsolidasiData(p => ({
                    ...p,
                    invoice_no: e.target.value,
                  }))
                }
              />
            </div>

            <hr className="mt-4" />

            <h6 className="fw-semibold mb-2">Rincian Barang</h6>

            <div className="table-responsive">
              <table className="table table-sm table-bordered table-theme">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Pilih</th>
                    <th>Nama Barang</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Subtotal</th>
                    <th>Jenis Pengadaan</th>
                    <th>Jenis Barang</th>
                  </tr>
                </thead>
                <tbody>
                  {konsolidasiData.items.map((it, i) => (
                    <tr key={i}>

                      <td className="text-center">{i + 1}</td>

                      {/* CHECKBOX */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={it.checked}
                          onChange={(e) => {
                            const checked = e.target.checked;

                            setKonsolidasiData(p => ({
                              ...p,
                              items: p.items.map((x, idx) =>
                                idx === i
                                  ? {
                                    ...x,
                                    checked,
                                    nominal_konsolidasi: checked
                                      ? x.nominal_konsolidasi ?? x.subtotal
                                      : null,
                                  }
                                  : x
                              ),
                            }));
                          }}
                        />
                      </td>

                      <td>{it.item_name}</td>

                      <td className="text-end">{formatNumber(it.qty)}</td>

                      <td className="text-end fw-semibold">
                        {formatCurrency(it.subtotal)}
                      </td>

                      {/* Jenis Pengadaan */}
                      <td>
                        <select
                          className="form-control form-control-sm form-control form-control-sm-sm"
                          value={it.jenis_pengadaan}
                          onChange={(e) =>
                            updateItem(i, "jenis_pengadaan", e.target.value)
                          }
                        >
                          <option value="Pembelian">Pembelian</option>
                          <option value="Hibah">Hibah</option>
                        </select>
                      </td>

                      {/* Jenis Barang */}
                      <td>
                        <select
                          className="form-control form-control-sm form-control form-control-sm-sm"
                          value={it.jenis_item}
                          onChange={(e) =>
                            updateItem(i, "jenis_item", e.target.value)
                          }
                        >
                          <option value="Obat">Obat</option>
                          <option value="BMHP">BMHP</option>
                          <option value="Reagen">Reagen</option>
                          <option value="Konsinyasi">Konsinyasi</option>
                          <option value="Alat">Alat Lainnya</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-start">
                <strong>Total Konsolidasi:</strong>
                <div className="text-end mt-3 row">
                  <div className="col-md-4">
                    <strong>Total Tagihan:</strong>
                    <div className="fw-bold muted mt-2">
                      {formatCurrency(konsolidasiData.nettoprice)}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <strong>Total Diajukan:</strong>
                    <input
                      type="text"
                      className="form-control form-control-sm text-end fw-bold"
                      value={totalDiajukanDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, ""); // ambil angka saja
                        const number = Number(raw || 0);

                        setKonsolidasiData(p => ({
                          ...p,
                          total_diajukan: number
                        }));

                        setTotalDiajukanDisplay(formatRibuan(number));
                      }}
                    />
                  </div>

                  <div className="mt-2 col-md-4">
                    <strong>Selisih:</strong>
                    <div
                      className={`fw-bold ${selisih > 0
                        ? "text-danger"
                        : selisih < 0
                          ? "text-warning"
                          : "text-success"
                        }`}
                    >
                      {selisih > 0 ? "+" : ""}
                      {formatRibuan(selisih)}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKonsolidasiModal(false)}>
            Batal
          </Button>
          <Button variant="warning" onClick={submitKonsolidasi}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Konsolidasi Tagihan</h6>
        </div>

        <div className="card-body px-3 py-3">
          {/* ================= FILTER ================= */}
          <div className="d-flex flex-wrap align-items-end mb-3">
            <div className="me-2">
              <label className="form-label fw-semibold mb-1">
                Filter Tanggal
              </label>
              <select
                className="form-control form-control-sm"
                value={filterDateType}
                onChange={(e) => setFilterDateType(e.target.value)}
              >
                <option value="tgl_po">Tgl PO</option>
                <option value="tgl_invoice">Tgl Faktur</option>
                <option value="tgl_inv_datang">Tgl Faktur Datang</option>
                <option value="tgl_jatuh_tempo">Tgl Jatuh Tempo</option>
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
                onChange={(e) => setProvider(e.target.value.trimStart())}
              />
              <input
                type="text"
                className="form-control form-control-sm me-2"
                placeholder="Invoice..."
                value={invoice}
                onChange={(e) => setInvoice(e.target.value.trimStart())}
              />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Nama barang..."
                value={drug}
                onChange={(e) => setDrug(e.target.value.trimStart())}
              />
            </div>
          </div>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th>No</th>
                  <th>PO / PO Acce</th>
                  <th>Tgl PO / PO Code</th>
                  <th>Invoice</th>
                  <th>Received / Due</th>
                  <th className="text-end">Total Tagihan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">Memuat data...</td>
                  </tr>
                ) : groupedByProvider.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">Tidak ada data</td>
                  </tr>
                ) : (
                  groupedByProvider.map((grp, pIdx) => (
                    <React.Fragment key={grp.prvdr_id}>

                      <tr><td colSpan="9" className="p-3" style={{ borderLeft: "0px", borderRight: "0px" }}></td></tr>
                      {/* ===== ROW PROVIDER ===== */}
                      <tr className="table-secondary fw-semibold">
                        <td colSpan="9">
                          🏢 {grp.prvdr_str}
                          <span className="ms-2 text-muted">
                            ({grp.data.length} invoice)
                          </span>
                        </td>
                      </tr>

                      {/* ===== ROW INVOICE ===== */}
                      {grp.data.map((inv, i) => {
                        const isLocked = inv.kunci_invoice === 1;

                        return (
                          <React.Fragment key={inv.po_acce_id}>
                            <tr>
                              <td>{i + 1}</td>
                              <td>
                                {inv.po_id}
                                <br />
                                {inv.po_acce_id}
                              </td>
                              <td>
                                {formatSortDateTime(inv.po_dt)}
                                <br />
                                {inv.po_code || "-"}
                              </td>
                              <td>
                                {inv.invoice_no}
                                <br />
                                {formatSortDateTime(inv.invoice_dt) || "-"}
                              </td>
                              <td>
                                {formatSortDateTime(inv.invoice_received_dt) || "-"}
                                <br />
                                {formatSortDateTime(inv.invoice_due_dt) || "-"}
                              </td>
                              <td className="text-end">
                                {formatCurrency(inv.total_tagihan)}
                              </td>
                              <td className="text-center">
                                {mirroredSet.has(inv.po_acce_id) ? (
                                  <span className="badge bg-success">
                                    Sudah Konsolidasi
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Belum Proses
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-outline-info mb-1"
                                  onClick={() => toggleDetail(inv)}
                                >
                                  {expandedRow === inv.po_acce_id ? "Tutup" : "Rincian"}
                                </button>

                                <br />

                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  disabled={mirroredSet.has(inv.po_acce_id)}
                                  onClick={() => openModalKonsolidasi(inv)}
                                >
                                  Konsolidasi
                                </button>
                              </td>
                            </tr>

                            {/* ===== DETAIL ROW ===== */}
                            {expandedRow === inv.po_acce_id && (
                              <tr className="bg-light">
                                <td />
                                <td colSpan="9">
                                  <div className="p-2">
                                    <strong>Detail Barang</strong>

                                    {/* ===== TABLE ITEM ===== */}
                                    <div className="table-responsive mt-2">
                                      <table className="table table-sm table-bordered table-theme">
                                        <thead>
                                          <tr>
                                            <th>No</th>
                                            <th>Nama Barang</th>
                                            <th className="text-end">Qty</th>
                                            <th className="text-end">Harga</th>
                                            <th className="text-end">PPN</th>
                                            <th className="text-end">Harga + PPN</th>
                                            <th className="text-end">Diskon</th>
                                            <th className="text-end">Subtotal</th>
                                            {/*<th className="text-end">Diajukan / Dibayar</th>*/}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {inv.items.map((it, j) => (
                                            <tr key={j}>
                                              <td>{j + 1}</td>
                                              <td>{it.item_name || "-"}</td>
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
                                                {formatCurrency(it.nettoprice)}
                                              </td>
                                              <td className="text-end">
                                                {formatCurrency(it.discount)}
                                              </td>
                                              <td className="text-end">
                                                {formatCurrency(it.subtotal)}
                                              </td>
                                              {/*<td className="text-end">
                                                {formatCurrency(inv.total_diajukan)} / {formatCurrency(inv.total_dibayar)}
                                              </td>*/}
                                            </tr>
                                          ))}
                                          <tr className="fw-semibold bg-light">
                                            <td
                                              colSpan="7"
                                              className="text-end"
                                            >
                                              Total
                                            </td>
                                            <td className="text-end">
                                              {formatCurrency(inv.total_tagihan)}
                                            </td>
                                            {/*<td className="text-end">
                                              {formatCurrency(inv.total_diajukan)} / {formatCurrency(inv.total_bayar)}
                                            </td>*/}
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* ===== ACTION ===== */}
                                    {!isLocked &&
                                      inv.status_pengolahan === "Proses Validasi" && (
                                        <div className="d-flex justify-content-end gap-2 mt-2">

                                          <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleKunciInvoice(inv.po_acce_id)}
                                          >
                                            Kunci Faktur
                                          </button>

                                        </div>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
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

export default KonsolidasiTagihan;
