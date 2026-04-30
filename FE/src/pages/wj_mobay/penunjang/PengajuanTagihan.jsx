import React, { useEffect, useMemo, useState } from "react";
import { formatSortDate, formatSortDateTime } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchPaginatedDataPengajuanPembayaran,
  createSuratPengantar,
  hapusKonsolidasi
} from "../../../api/wj_mobay/PengajuanTagihan";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

/**
 * ===============================
 * PengajuanTagihan (Clean)
 * ===============================
 */

const PengajuanTagihan = () => {

  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  const [loading, setLoading] = useState(false);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("invoice_consolidated_dt");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isKeteranganManual, setIsKeteranganManual] = useState(false);

  const generateNoSurat = () => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `SP-${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  };

  const [noSurat, setNoSurat] = useState(generateNoSurat());
  const today = new Date().toISOString().split("T")[0];
  const [tanggalSurat, setTanggalSurat] = useState(today);
  const [tujuan, setTujuan] = useState("Bendahara Pengeluaran");
  const [keterangan, setKeterangan] = useState("");
  const [jenisPengajuan, setJenisPengajuan] = useState("V5");

  const selectedProviderData = useMemo(() => {
    if (selectedInvoices.length === 0) return null;

    const providerId = selectedInvoices[0].provider_id;
    return data.find(d => d.prvdr_id === providerId) || null;
  }, [selectedInvoices, data]);

  const totalTagihan = useMemo(() => {
    return selectedInvoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0),
      0
    );
  }, [selectedInvoices]);

  // -----------------------
  // HELPERS
  // -----------------------
  const normalizeInvoice = (inv) => {
    const items = inv.items || [];

    return {
      po_acce_id: inv.po_acce_id,

      // PROVIDER FINAL (SOURCE OF TRUTH)
      prvdr_id: inv.prvdr_id ?? "__UNKNOWN__",
      prvdr_str: inv.prvdr_str ?? "PROVIDER TIDAK DIKETAHUI",
      prvdr_address: inv.prvdr_address ?? "-",

      srvc_unit_nm: inv.srvc_unit_nm,
      invoice_no: inv.invoice_no,

      id: inv.id,

      po_dt: inv.po_dt,
      po_code: inv.po_code,

      invoice_dt: inv.invoice_dt,
      invoice_due_dt: inv.invoice_due_dt,
      invoice_received_dt: inv.invoice_received_dt,
      invoice_consolidated_dt: inv.invoice_consolidated_dt,
      invoice_submitted_dt: inv.invoice_submitted_dt,

      status_pengolahan: inv.status_pengolahan,
      catatan_verifikasi: inv.catatan_verifikasi,
      status_validasi: inv.status_validasi || "Belum Validasi",
      status_pembayaran: inv.status_pembayaran || "Belum Bayar",

      kunci_invoice: Number(inv.kunci_invoice ?? 0),

      total_tagihan: Number(inv.total_tagihan ?? 0),
      total_diajukan: Number(inv.total_diajukan ?? 0),
      total_bayar: Number(inv.total_bayar ?? 0),
      selisih_bayar: Number(inv.selisih_bayar ?? 0),

      items,
    };
  };

  const getJenisBelanja = () => {
    if (selectedInvoices.length === 0) return "";

    // ambil semua invoice dari data utama
    const selectedFull = data.filter(d =>
      selectedInvoices.some(s => s.id === d.id)
    );

    const jenisSet = new Set();

    selectedFull.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.jenis_item) {
          jenisSet.add(it.jenis_item);
        }
      });
    });

    if (jenisSet.size === 0) return "";

    const jenisArr = Array.from(jenisSet);

    if (jenisArr.length === 1) {
      return `Pembayaran ${jenisArr[0]}`;
    }

    return `Pembayaran ${jenisArr.join(" & ")}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Belum Proses":
        return "bg-secondary";
      case "Proses Pengajuan":
        return "bg-primary";
      case "Proses Pengantaran":
        return "bg-warning";
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
          normalize(it.drug_nm).includes(normalize(drug))
        );

      return matchProvider && matchInvoice && matchDrug;
    });
  }, [data, provider, invoice, drug]);

  const getInvoiceGroupType = (inv) => {
    const items = inv.items || [];

    if (items.length === 0) return "LAIN";

    const allObat = items.every(it => it.jenis_item === "Obat");
    const allBmhp = items.every(it => it.jenis_item === "BMHP");

    if (allObat) return "OBAT";
    if (allBmhp) return "BMHP";

    return "CAMPURAN";
  };

  const groupedByProvider = useMemo(() => {
    const map = {};

    filteredData.forEach((inv) => {
      const providerKey = inv.prvdr_id || "UNKNOWN";
      const groupType = getInvoiceGroupType(inv);

      if (!map[providerKey]) {
        map[providerKey] = {
          prvdr_id: inv.prvdr_id,
          prvdr_str: inv.prvdr_str,
          data: [],
          groups: {
            OBAT: [],
            BMHP: [],
            CAMPURAN: [],
          },
        };
      }

      map[providerKey].data.push(inv);
      map[providerKey].groups[groupType].push(inv);
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

  const handleSubmitSurat = async () => {

    if (!noSurat || !tanggalSurat) {
      toast.warning("No surat dan tanggal wajib diisi");
      return;
    }

    if (selectedInvoices.length === 0) {
      toast.warning("Pilih minimal 1 invoice");
      return;
    }

    try {

      const blob = await createSuratPengantar({
        no_surat: noSurat,
        tanggal_surat: tanggalSurat,
        tujuan,
        keterangan,
        jenis_pengajuan: jenisPengajuan,
        invoice_ids: selectedInvoices.map(p => p.id),
      });

      //matikan dulu, jika diperlukan aktifkan lagi cetak lembar pengajuan
      /*const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Surat_Pengantar_${noSurat}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url); */

      toast.success("Surat pengantar berhasil dibuat");

      // reset form
      setSelectedInvoices([]);
      setTanggalSurat(today);
      setTujuan("Verifikator Pengajuan Pembayaran");
      setKeterangan("");

      setExpandedRow(null);

      loadData(startDate, endDate, filterDateType);

    } catch (err) {

      console.error(err);

      toast.error(
        err?.response?.data?.message ||
        "Gagal membuat surat pengantar"
      );

    }
  };

  const handleHapusKonsolidasi = async (po_acce_id) => {
    const result = await Swal.fire({
      title: "Yakin?",
      text: "Data konsolidasi akan dihapus!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    // kalau user klik batal
    if (!result.isConfirmed) return;

    try {
      await hapusKonsolidasi({ po_acce_id });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Konsolidasi berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
      });

      loadData(startDate, endDate, filterDateType);
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Gagal",
        text:
          err?.response?.data?.message ||
          "Gagal menghapus konsolidasi",
      });
    }
  };

  const handleCheckboxChange = (inv) => {
    setSelectedInvoices((prev) => {
      const alreadySelected = prev.find((p) => p.id === inv.id);

      if (alreadySelected) {
        return prev.filter((p) => p.id !== inv.id);
      }

      // kalau belum ada pilihan → bebas pilih
      if (prev.length === 0) {
        return [{ id: inv.id, provider_id: inv.prvdr_id, total: inv.total_diajukan }];
      }

      // kalau sudah ada → cek provider harus sama
      const firstProvider = prev[0].provider_id;
      if (firstProvider !== inv.prvdr_id) {
        toast.warning("Surat pengantar hanya boleh untuk 1 provider");
        return prev;
      }

      return [
        ...prev,
        { id: inv.id, provider_id: inv.prvdr_id, total: inv.total_diajukan },
      ];
    });
  };

  const handleCheckAllProvider = (grp, checked) => {
    const providerInvoices = grp.data
      .filter(inv => inv.kunci_invoice !== 1)
      .map(inv => ({
        id: inv.id,
        provider_id: inv.prvdr_id,
        prvdr_address: inv.prvdr_address,
        total: inv.total_diajukan
      }));

    if (checked) {
      setSelectedInvoices(prev => {
        const existingIds = prev.map(p => p.id);

        const newOnes = providerInvoices.filter(
          inv => !existingIds.includes(inv.id)
        );

        return [...prev, ...newOnes];
      });
    } else {
      setSelectedInvoices(prev =>
        prev.filter(p => p.provider_id !== grp.prvdr_id)
      );
    }
  };

  const handleCheckAllGroup = (grp, groupName, checked) => {
    const groupInvoices = grp.groups[groupName]
      .filter(inv => inv.kunci_invoice !== 1)
      .map(inv => ({
        id: inv.id,
        provider_id: inv.prvdr_id,
        prvdr_address: inv.prvdr_address,
        total: inv.total_diajukan
      }));

    if (checked) {
      setSelectedInvoices(prev => {
        const existingIds = prev.map(p => p.id);

        const newOnes = groupInvoices.filter(
          inv => !existingIds.includes(inv.id)
        );

        return [...prev, ...newOnes];
      });
    } else {
      setSelectedInvoices(prev =>
        prev.filter(p => !groupInvoices.some(g => g.id === p.id))
      );
    }
  };

  useEffect(() => {
    if (isKeteranganManual) return;

    const autoText = getJenisBelanja();

    if (autoText) {
      setKeterangan(autoText);
    }
  }, [selectedInvoices, data]);

  const activeProviderId =
    selectedInvoices.length > 0 ? selectedInvoices[0].provider_id : null;

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Pengajuan Tagihan</h6>
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
                <option value="tgl_konsolidasi">Tgl Konsolidasi</option>
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

          {/* ====== FORM SURAT ============== */}
          <div className="card mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Form Surat Pengantar</h6>

              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <label className="form-label">Provider</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={selectedProviderData?.prvdr_str || ""}
                    disabled
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Alamat Provider</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={selectedProviderData?.prvdr_address || ""}
                    disabled
                  />
                </div>
              </div>

              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label">No Surat</label>
                  <input
                    type="text"
                    disabled
                    className="form-control form-control-sm"
                    value={noSurat}
                    onChange={(e) => setNoSurat(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Jenis Pengajuan</label>
                  <select
                    className="form-control form-control-sm"
                    value={jenisPengajuan}
                    onChange={(e) => setJenisPengajuan(e.target.value)}
                  >
                    <option value="V5">V5</option>
                    <option value="V6">V6</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Tanggal Surat</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Kepada</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                  />
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-10">
                  <label className="form-label">Kegiatan Belanja</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={keterangan || ""}
                    onChange={(e) => {
                      setIsKeteranganManual(true);
                      setKeterangan(e.target.value);
                    }}
                  />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <button
                    className="btn btn-success w-100"
                    disabled={selectedInvoices.length === 0}
                    onClick={handleSubmitSurat}
                  >
                    Simpan Pengajuan
                  </button>
                </div>
              </div>

              {/* ===== TOTAL PENGAJUAN ===== */}
              <div className="row mt-3">
                <div className="col-md-12">
                  <div className="p-3 border rounded bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">
                        Total Pengajuan ({selectedInvoices.length} Invoice)
                      </span>

                      <span className="fs-5 fw-bold text-primary">
                        {formatCurrency(totalTagihan)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th>No</th>
                  <th colSpan={2}>
                    Pilih
                  </th>
                  <th>Unit / <br />Provider</th>
                  <th>Tgl PO / <br />PO Code</th>
                  <th>No Faktur / <br />Tgl Faktur</th>
                  <th>Tgl Diterima / <br />Tgl Jatuh Tempo</th>
                  <th>Tgl Konsolidasi / <br />Tgl Diajukan</th>
                  <th>Jml Tagihan / <br />Jml Diajukan</th>
                  <th>Jml Dibayar / <br />Jml Hutang <br /><i className="small text-muted">(Diajukan - Dibayar)</i></th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="text-center">Memuat data...</td>
                  </tr>
                ) : groupedByProvider.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center">Tidak ada data</td>
                  </tr>
                ) : groupedByProvider.map((grp) => (
                  <React.Fragment key={`provider-${grp.prvdr_id}`}>

                    <tr><td colSpan="11" className="p-3" style={{ borderLeft: "0px", borderRight: "0px" }}></td></tr>
                    {/* ===== ROW PROVIDER ===== */}
                    <tr
                      className={`table-secondary fw-semibold ${activeProviderId && activeProviderId !== grp.prvdr_id
                        ? "opacity-50"
                        : ""
                        }`}
                    >
                      <td className="text-center">
                        <input
                          type="checkbox"
                          disabled={
                            activeProviderId && activeProviderId !== grp.prvdr_id
                          }
                          onChange={(e) => handleCheckAllProvider(grp, e.target.checked)}
                          checked={
                            grp.data.filter(inv => inv.kunci_invoice !== 1).length > 0 &&
                            grp.data
                              .filter(inv => inv.kunci_invoice !== 1)
                              .every(inv =>
                                selectedInvoices.some(p => p.id === inv.id)
                              )
                          }
                        />
                      </td>
                      <td className="text-center">🏢</td>
                      <td colSpan="10">
                        {grp.prvdr_str}
                        <span className="ms-2 text-muted">
                          ({grp.data.length} invoice)
                        </span>
                      </td>
                    </tr>

                    {/* ===== ROW INVOICE ===== */}
                    {Object.entries(grp.groups).map(([groupName, invoices]) => {
                      if (invoices.length === 0) return null;

                      return (
                        <React.Fragment key={groupName}>
                          <tr className="table-light">
                            <td></td>
                            <td className="text-center" style={{ backgroundColor: '#dae6f0' }}>
                              <input
                                type="checkbox"
                                disabled={
                                  activeProviderId && activeProviderId !== grp.prvdr_id
                                }
                                onChange={(e) =>
                                  handleCheckAllGroup(grp, groupName, e.target.checked)
                                }
                                checked={
                                  invoices.filter(inv => inv.kunci_invoice !== 1).length > 0 &&
                                  invoices
                                    .filter(inv => inv.kunci_invoice !== 1)
                                    .every(inv =>
                                      selectedInvoices.some(p => p.id === inv.id)
                                    )
                                }
                              />
                            </td>

                            {groupName === "OBAT" && (
                              <>
                                <td className="text-center" style={{ backgroundColor: '#dae6f0' }}>
                                  <i className="fas fa-pills me-2 text-primary"></i>
                                </td>
                                <td colSpan="10" className="fw-semibold" style={{ backgroundColor: '#dae6f0' }}>
                                  Invoice OBAT
                                </td>
                              </>
                            )}

                            {groupName === "BMHP" && (
                              <>
                                <td className="text-center" style={{ backgroundColor: '#dae6f0' }}>
                                  <i className="fas fa-syringe me-2 text-success"></i>
                                </td>
                                <td colSpan="10" className="fw-semibold" style={{ backgroundColor: '#dae6f0' }}>
                                  Invoice BMHP
                                </td>
                              </>
                            )}

                            {groupName === "CAMPURAN" && (
                              <>
                                <td className="text-center" style={{ backgroundColor: '#dae6f0' }}>
                                  <i className="fas fa-layer-group me-2 text-warning"></i>
                                </td>
                                <td colSpan="10" className="fw-semibold" style={{ backgroundColor: '#dae6f0' }}>
                                  Invoice Campuran
                                </td>
                              </>
                            )}
                          </tr>
                          {invoices.map((inv, i) => {

                            const isLocked = inv.kunci_invoice === 1;

                            return (
                              <React.Fragment key={inv.po_acce_id}>
                                <tr
                                  className={`table-secondary fw-semibold ${activeProviderId && activeProviderId !== grp.prvdr_id
                                    ? "opacity-50"
                                    : ""
                                    }`}
                                >
                                  <td></td>
                                  <td className="text-center">{i + 1}</td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      disabled={
                                        isLocked ||
                                        (activeProviderId && activeProviderId !== inv.prvdr_id)
                                      }
                                      checked={selectedInvoices.some((p) => p.id === inv.id)}
                                      onChange={() => handleCheckboxChange(inv)}
                                    />
                                  </td>
                                  <td>
                                    {inv.srvc_unit_nm}
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
                                  <td>
                                    {formatSortDateTime(inv.invoice_consolidated_dt) || "-"}
                                    <br />
                                    {formatSortDateTime(inv.invoice_submitted_dt) || "-"}
                                  </td>
                                  <td className="text-end">
                                    {formatCurrency(inv.total_tagihan)}
                                    <br />
                                    {formatCurrency(inv.total_diajukan)}
                                  </td>
                                  <td className="text-end">
                                    {formatCurrency(inv.total_bayar)}
                                    <br />
                                    {formatCurrency(inv.total_diajukan - inv.total_bayar)} {/*Jml Hutang*/}
                                  </td>
                                  <td className="text-center">
                                    <span className="badge bg-primary">
                                      {inv.status_validasi}
                                    </span>
                                    <br />
                                    <span className="badge bg-info">
                                      {inv.status_pembayaran}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span
                                      className={`badge ${getStatusBadgeClass(
                                        inv.status_pengolahan
                                      )}`}
                                    >
                                      {inv.status_pengolahan}
                                    </span>
                                    {isLocked && (
                                      <>
                                        <br />
                                        <i className="fas fa-lock text-danger" />
                                      </>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <div className="justify-content-center">
                                      <button
                                        className="btn btn-sm btn-outline-info mb-1"
                                        onClick={() => toggleDetail(inv)}
                                      >
                                        {expandedRow === inv.po_acce_id
                                          ? "Tutup"
                                          : "Rincian"}
                                      </button>
                                    </div>

                                  </td>
                                </tr>

                                {/* ===== DETAIL ROW ===== */}
                                {expandedRow === inv.po_acce_id && (
                                  <tr className="bg-light">
                                    <td />
                                    <td colSpan="12">
                                      <div className="p-2">
                                        <strong>Detail Barang</strong>

                                        {/* ===== TABLE ITEM ===== */}
                                        <div className="table-responsive mt-2">
                                          <table className="table table-sm table-bordered table-theme">
                                            <thead>
                                              <tr>
                                                <th>No</th>
                                                <th>Nama Barang</th>
                                                <th className="text-end">Jml</th>
                                                <th className="text-end">Harga</th>
                                                <th className="text-end">PPN</th>
                                                <th className="text-end">
                                                  Harga + PPN
                                                </th>
                                                <th className="text-end">
                                                  Disc
                                                </th>
                                                <th className="text-end">
                                                  Subtotal
                                                </th>
                                                <th className="text-end">
                                                  Diajukan / Dibayarkan
                                                </th>
                                                <th>Jenis Item</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {inv.items.map((it, j) => (
                                                <tr key={j}>
                                                  <td className="text-center">{j + 1}</td>
                                                  <td>{it.drug_nm || "-"}</td>
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
                                                  <td className="text-end">
                                                    {formatCurrency(it.nominal_ajukan)} / {it.nominal_bayar <= 0 ? (
                                                      <span className="text-muted fst-italic">
                                                        Disesuaikan di Total
                                                      </span>
                                                    ) : (
                                                      formatCurrency(it.nominal_bayar)
                                                    )}
                                                  </td>
                                                  <td className="text-center">{it.jenis_item}</td>
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
                                                <td className="text-end">
                                                  {formatCurrency(inv.total_diajukan)} / {formatCurrency(inv.total_bayar)}
                                                </td>
                                                <td></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>

                                        <div className="row">
                                          <div className="col-md-10">
                                            <strong>Catatan Validasi : </strong>
                                            <i>{inv.catatan_verifikasi}</i>
                                          </div>

                                          <div className="col-md-2 d-flex justify-content-end">
                                            <button
                                              className="btn btn-md btn-danger"
                                              onClick={() => handleHapusKonsolidasi(inv.po_acce_id)}
                                            >
                                              Hapus Konsolidasi
                                            </button>
                                          </div>
                                        </div>

                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PengajuanTagihan;
