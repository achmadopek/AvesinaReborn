import React, { useEffect, useMemo, useState } from "react";
import { formatSortDate } from "../../../utils/FormatDate";
import { formatNumber, formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchDataPengajuanSiapKirim,
  createPengiriman
} from "../../../api/wj_mobay/PengirimanBerkas";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

/**
 * ===============================
 * PengirimanBerkas (Clean)
 * ===============================
 */

const PengirimanBerkas = () => {

  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [expandedRowPrv, setExpandedRowPrv] = useState(null);
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

  const [selectedPengajuan, setSelectedPengajuan] = useState([]);
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

  const getTotalPengajuanProvider = (grp) => {
    return grp.data.reduce(
      (sum, inv) => sum + Number(inv.total_diajukan || 0),
      0
    );
  };

  const totalTagihan = useMemo(() => {
    if (selectedPengajuan.length === 0) return 0;

    let total = 0;

    data.forEach(provider => {
      provider.data.forEach(inv => {
        if (selectedPengajuan.some(p => p.pengajuan_id === inv.pengajuan_id)) {
          total += Number(inv.total_diajukan || 0);
        }
      });
    });

    return total;
  }, [selectedPengajuan, data]);

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
      const res = await fetchDataPengajuanSiapKirim({
        start,
        end,
        typeTglFilter: type,
      });

      setData(res.data || []);

    } catch (err) {
      console.error("ERROR LOAD DATA:", err);
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
    if (!keterangan && selectedPengajuan.length > 0) {
      setKeterangan(`Pengiriman ${selectedPengajuan.length} berkas pengajuan`);
    }
  }, [selectedPengajuan]);

  // -----------------------
  // FILTERED DATA
  // -----------------------
  const normalize = (v) => String(v || "").toLowerCase();

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
    return (data || []).map((providerObj) => {

      const filteredInvoices = (providerObj.data || []).filter((inv) => {

        const matchProvider =
          !provider ||
          normalize(providerObj.prvdr_str).includes(normalize(provider));

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

      const groups = {
        OBAT: [],
        BMHP: [],
        CAMPURAN: [],
        LAIN: [],
      };

      filteredInvoices.forEach((inv) => {
        const type = getInvoiceGroupType(inv);
        groups[type].push(inv);
      });

      return {
        ...providerObj,
        data: filteredInvoices,
        groups,
      };
    }).filter(p => p.data.length > 0);
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

  const toggleDetailProvider = (provider) => {
    setExpandedRowPrv(
      expandedRowPrv === provider.prvdr_id ? null : provider.prvdr_id
    );
  };

  const toggleDetail = (inv) => {
    setExpandedRow(
      expandedRow === inv.po_acce_id ? null : inv.po_acce_id
    );
  };

  const handleCreatePengiriman = async () => {
    if (selectedPengajuan.length === 0) {
      toast.warning("Pilih minimal 1 pengajuan");
      return;
    }

    try {
      const blob = await createPengiriman({
        no_pengiriman: noPengiriman,
        tanggal_pengiriman: tanggalPengiriman,
        tujuan,
        keterangan,
        pengajuan_ids: selectedPengajuan.map(p => p.pengajuan_id)
      });

      // bikin URL dari blob
      const url = window.URL.createObjectURL(blob);

      // trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `Pengiriman_${noPengiriman}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF berhasil didownload");

      setSelectedPengajuan([]);
      setNoPengiriman(generateNoPengiriman());

      loadData(startDate, endDate, filterDateType);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Gagal generate PDF");
    }
  };

  const generateNoPengiriman = () => {
    const now = new Date();
    return `PKT-${now.getTime()}`;
  };

  const [noPengiriman, setNoPengiriman] = useState(generateNoPengiriman());
  const [tanggalPengiriman, setTanggalPengiriman] = useState(today);

  const handleCheckAllProvider = (grp, checked) => {
    // ambil semua pengajuan unik dari provider
    const pengajuanList = [];

    grp.data.forEach(inv => {
      if (inv.kunci_invoice !== 1) {
        pengajuanList.push({
          pengajuan_id: inv.pengajuan_id,
          no_surat: inv.no_surat,
          tanggal_surat: inv.tanggal_surat
        });
      }
    });

    // bikin unique
    const uniquePengajuan = Object.values(
      Object.fromEntries(
        pengajuanList.map(p => [p.pengajuan_id, p])
      )
    );

    if (checked) {
      setSelectedPengajuan(prev => {
        const existingIds = prev.map(p => p.pengajuan_id);

        const newOnes = uniquePengajuan.filter(
          p => !existingIds.includes(p.pengajuan_id)
        );

        return [...prev, ...newOnes];
      });
    } else {
      setSelectedPengajuan(prev =>
        prev.filter(p => !uniquePengajuan.some(u => u.pengajuan_id === p.pengajuan_id))
      );
    }
  };

  const activeProviderId =
    selectedPengajuan.length > 0
      ? data.find(p =>
        p.data.some(inv => inv.pengajuan_id === selectedPengajuan[0].pengajuan_id)
      )?.prvdr_id
      : null;

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Pegiriman Berkas</h6>
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
                <option value="tgl_pengajuan">Tgl Diajukan</option>
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

          {/* ====== FORM PENGIRIMAN ============== */}
          <div className="card mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Form Pengiriman Berkas</h6>

              <div className="row g-2 mb-2">
                <div className="col-md-3">
                  <label className="form-label">No Pengiriman</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={noPengiriman}
                    disabled
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={tanggalPengiriman}
                    onChange={(e) => setTanggalPengiriman(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Tujuan</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-2">
                <div className="col-md-10">
                  <label className="form-label">Keterangan</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Contoh: Pengiriman berkas pengajuan bulan April"
                    value={keterangan || ""}
                    onChange={(e) => setKeterangan(e.target.value)}
                  />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <button
                    className="btn btn-success w-100"
                    disabled={selectedPengajuan.length === 0}
                    onClick={handleCreatePengiriman}
                  >
                    Kirim Berkas
                  </button>
                </div>
              </div>

              {/* ===== RINGKASAN ===== */}
              <div className="row mt-3">
                <div className="col-md-12">
                  <div className="p-3 border rounded bg-light">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="fw-semibold">
                          Jumlah Berkas Dipilih
                        </div>
                        <div className="text-muted small">
                          {selectedPengajuan.length} pengajuan
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-semibold">Total Nilai</div>
                        <div className="fs-5 fw-bold text-primary">
                          {formatCurrency(totalTagihan)}
                        </div>
                      </div>
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
                  <th colSpan={2}>No</th>
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
                    <td colSpan="10" className="text-center">Memuat data...</td>
                  </tr>
                ) : groupedByProvider.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">Tidak ada data</td>
                  </tr>
                ) : groupedByProvider.map((grp) => (
                  <React.Fragment key={`provider-${grp.prvdr_id}`}>

                    <tr><td colSpan="10" className="p-1" style={{ borderLeft: "0px", borderRight: "0px" }}></td></tr>
                    {/* ===== ROW PROVIDER ===== */}
                    <tr
                      className={`table-secondary fw-semibold`}
                    >
                      <td className="text-center">
                        <input
                          type="checkbox"
                          onChange={(e) => handleCheckAllProvider(grp, e.target.checked)}
                          checked={
                            grp.data.length > 0 &&
                            grp.data.every(inv =>
                              selectedPengajuan.some(p => p.pengajuan_id === inv.pengajuan_id)
                            )
                          }
                        />
                      </td>
                      <td className="text-center">🏢</td>
                      <td colSpan="7">
                        {grp.prvdr_str}
                        <span className="ms-2 text-muted">
                          ({grp.data.length} invoice / {
                            new Set(grp.data.map(i => i.pengajuan_id)).size
                          } pengajuan)
                        </span>
                      </td>
                      <td colSpan="2" className="text-end">
                        {formatCurrency(getTotalPengajuanProvider(grp))}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary mb-1"
                          onClick={() => toggleDetailProvider(grp)}
                        >
                          {expandedRowPrv === grp.prvdr_id
                            ? "Tutup"
                            : "Detail"}
                        </button>
                      </td>
                    </tr>

                    {/* ===== ROW INVOICE ===== */}
                    {expandedRowPrv === grp.prvdr_id &&
                      Object.entries(grp.groups).map(([groupName, invoices]) => {
                        if (invoices.length === 0) return null;

                        return (
                          <React.Fragment key={groupName}>
                            <tr className="table-light">
                              <td></td>

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
                                  <td colSpan="9" className="fw-semibold" style={{ backgroundColor: '#dae6f0' }}>
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
                                    className={`table-secondary fw-semibold`}
                                  >
                                    <td></td>
                                    <td className="text-center">{i + 1}</td>
                                    <td>
                                      {inv.srvc_unit_nm}
                                    </td>
                                    <td>
                                      {formatSortDate(inv.po_dt)}
                                      <br />
                                      {inv.po_code || "-"}
                                    </td>
                                    <td>
                                      {inv.invoice_no}
                                      <br />
                                      {formatSortDate(inv.invoice_dt) || "-"}
                                    </td>
                                    <td>
                                      {formatSortDate(inv.invoice_received_dt) || "-"}
                                      <br />
                                      {formatSortDate(inv.invoice_due_dt) || "-"}
                                    </td>
                                    <td>
                                      {formatSortDate(inv.invoice_consolidated_dt) || "-"}
                                      <br />
                                      {formatSortDate(inv.invoice_submitted_dt) || "-"}
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
                                      <td colSpan="11">
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

                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    }
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

export default PengirimanBerkas;
