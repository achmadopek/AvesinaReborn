import React, { useEffect, useMemo, useState } from "react";
import { formatSortDate } from "../../../utils/FormatDate";
import { formatCurrency } from "../../../utils/FormatNumber";
import {
  fetchSuratPengantar,
  getDetailSuratPengantar,
  terimaBerkas
} from "../../../api/wj_mobay/PenerimaanBerkas";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

/**
 * ===============================
 * PenerimaanBerkas (Clean)
 * ===============================
 */

const PenerimaanBerkas = () => {
  const { peg_id } = useAuth();

  // -----------------------
  // STATE
  // -----------------------
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPage, setTotalPage] = useState(0);

  // filter tanggal
  const [filterDateType, setFilterDateType] = useState("tgl_pengiriman");

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // filter text
  const [provider, setProvider] = useState("");
  const [invoice, setInvoice] = useState("");
  const [drug, setDrug] = useState("");

  const [suratList, setSuratList] = useState([]);
  const [expandedSurat, setExpandedSurat] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkedMap, setCheckedMap] = useState({});

  const loadSurat = async (customPage = page) => {
    setLoading(true);
    try {
      const res = await fetchSuratPengantar({
        page: customPage,
        limit,
        start: startDate,
        end: endDate,
        provider,
        invoice,
      });

      setSuratList(res.data || []);
      setTotalPage(res.totalPage || 0);
      setPage(res.page || 1);
    } catch (err) {
      toast.error("Gagal memuat surat pengantar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurat(1);
  }, []);

  const handleExpandSurat = async (suratId) => {
    if (expandedSurat === suratId) {
      setExpandedSurat(null);
      return;
    }

    setExpandedSurat(suratId);

    if (!detailMap[suratId]) {
      try {
        const detail = await getDetailSuratPengantar(suratId);

        setDetailMap((prev) => ({
          ...prev,
          [suratId]: detail,
        }));
      } catch (err) {
        toast.error("Gagal memuat detail surat");
      }
    }
  };

  const handleToggleInvoice = (invoiceId) => {
    setCheckedMap((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  const isAllChecked = (invoices) => {
    return invoices.every((inv) => checkedMap[inv.id]);
  };

  const handleCheckAll = (invoices) => {
    const allChecked = isAllChecked(invoices);

    const updates = {};
    invoices.forEach((inv) => {
      updates[inv.id] = !allChecked;
    });

    setCheckedMap((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleTerimaSurat = async (suratId, invoices) => {
    const belumDicek = invoices.some(
      (inv) => !checkedMap[inv.id]
    );

    if (belumDicek) {
      toast.warn("Masih ada invoice yang belum dicek");
      return;
    }

    try {
      await terimaBerkas(suratId, peg_id);
      toast.success("Berkas berhasil diterima");

      setExpandedSurat(null);
      setCheckedMap({});
      loadSurat();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Gagal menerima berkas"
      );
    }
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
  // ACTION HANDLERS
  // -----------------------
  const handleLoadData = () => {
    setPage(1);
    loadSurat(1);
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= CARD ================= */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Penerimaan Berkas Pengajuan</h6>
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
                <option value="tgl_surat">Tgl Pengiriman</option>
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
                  <th>Provider</th>
                  <th>Total Invoice</th>
                  <th>Total Diajukan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suratList.map((surat, i) => (
                  <React.Fragment key={surat.id}>
                    <tr>
                      <td className="text-center">{i + 1}</td>
                      <td>{surat.no_surat}</td>
                      <td>{formatSortDate(surat.tanggal_surat)}</td>
                      <td>{formatSortDate(surat.invoice_consolidated_dt)}</td>
                      <td>{formatSortDate(surat.invoice_submitted_dt)}</td>
                      <td>{surat.prvdr_str}</td>
                      <td>{surat.total_invoice}</td>
                      <td>{formatCurrency(surat.total_diajukan)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleExpandSurat(surat.id)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>

                    {/* DETAIL */}
                    {expandedSurat === surat.id &&
                      detailMap[surat.id] && (
                        <tr>
                          <td colSpan="9">
                            <div className="p-3 bg-light">
                              <table className="table table-sm table-bordered">
                                <thead>
                                  <tr>
                                    <th className="text-center">No</th>
                                    <th>Invoice</th>
                                    <th>Total Diajukan</th>
                                    <th>Status</th>
                                    <th className="text-center">
                                      <input
                                        type="checkbox"
                                        checked={isAllChecked(
                                          detailMap[surat.id].invoices
                                        )}
                                        onChange={() =>
                                          handleCheckAll(
                                            detailMap[surat.id].invoices
                                          )
                                        }
                                      />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detailMap[surat.id].invoices.map((inv, j) => (
                                    <tr key={inv.id}>
                                      <td className="text-center">{j + 1}</td>
                                      <td>{inv.invoice_no}</td>
                                      <td>{formatCurrency(inv.total_diajukan)}</td>
                                      <td>{inv.status_pengolahan}</td>
                                      <td className="text-center">
                                        <input
                                          type="checkbox"
                                          checked={checkedMap[inv.id] || false}
                                          onChange={() =>
                                            handleToggleInvoice(inv.id)
                                          }
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="text-end">
                                <button
                                  className="btn btn-success"
                                  onClick={() =>
                                    handleTerimaSurat(
                                      surat.id,
                                      detailMap[surat.id].invoices
                                    )
                                  }
                                >
                                  Terima Surat
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/*<div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => loadSurat(page - 1)}
              >
                Previous
              </button>

              <span>
                Halaman {page} dari {totalPage}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPage}
                onClick={() => loadSurat(page + 1)}
              >
                Next
              </button>
            </div>*/}
          </div>
        </div>
      </div>
    </>
  );
};

export default PenerimaanBerkas;
