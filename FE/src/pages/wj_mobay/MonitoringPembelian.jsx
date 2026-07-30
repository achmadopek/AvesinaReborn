import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  fetchMonitoringPembelian,
  fetchMonitoringDetail,
} from "../../api/wj_mobay/MonitoringPembelian";
import { formatCurrency } from "../../utils/FormatNumber";
import { formatSortDate } from "../../utils/FormatDate";

const MonitoringPembelian = () => {
  const today = new Date().toISOString().split("T")[0];

  const [filter, setFilter] = useState({
    start: today,
    end: today,
    status: "",
    jenis: "", // Tambahkan filter jenis
  });

  const [data, setData] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [rincianData, setRincianData] = useState([]);
  const [headerData, setHeaderData] = useState(null);

  const { units } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!units?.length) return;

    try {
      const res = await fetchMonitoringPembelian(filter, units);
      setData(res.data || []);
    } catch (err) {
      toast.error("Gagal ambil data pembelian");
    }
  };

  useEffect(() => {
    if (units?.length > 0) {
      loadData();
    }
  }, [units]);

  const handleDetail = async (id) => {
    try {
      const res = await fetchMonitoringDetail(id);
      setHeaderData(res.header);
      setDetailData(res.detail || []);
      setRincianData(res.rincian || []);
      setShowDetail(true);
    } catch (err) {
      toast.error("Gagal memuat detail");
    }
  };

  // Fungsi untuk mendapatkan badge jenis transaksi
  const getJenisBadge = (jenis) => {
    const styles = {
      BARANG: "primary",
      JASA_TANPA_RINCIAN: "success",
      JASA_DENGAN_RINCIAN: "info",
    };
    const labels = {
      BARANG: "Pembelian Barang",
      JASA_TANPA_RINCIAN: "Jasa (Tanpa Rincian)",
      JASA_DENGAN_RINCIAN: "Jasa (Dengan Rincian)",
    };
    return (
      <Badge bg={styles[jenis] || "secondary"}>{labels[jenis] || jenis}</Badge>
    );
  };

  // Fungsi untuk get edit path
  const getEditPath = (row) => {
    if (row.jenis_transaksi === "BARANG") {
      return `/mobay/PembelianBarang/${row.id}`;
    } else {
      return `/mobay/PengadaanJasa/${row.id}`;
    }
  };

  return (
    <>
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <strong>Monitoring Pembelian & Pengadaan Jasa</strong>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-2">
              <label>Tanggal Awal</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filter.start}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    start: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-2">
              <label>Tanggal Akhir</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filter.end}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    end: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-2">
              <label>Status</label>
              <select
                className="form-control form-control-sm"
                value={filter.status}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    status: e.target.value,
                  })
                }
              >
                <option value="">Semua</option>
                <option value="DRAFT">DRAFT</option>
                <option value="FINAL">FINAL</option>
              </select>
            </div>

            <div className="col-md-3">
              <label>Jenis Transaksi</label>
              <select
                className="form-control form-control-sm"
                value={filter.jenis}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    jenis: e.target.value,
                  })
                }
              >
                <option value="">Semua</option>
                <option value="BARANG">Pembelian Barang</option>
                <option value="JASA">Jasa (Tanpa Rincian)</option>
                <option value="JASA_RINCIAN">Jasa (Dengan Rincian)</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary btn-sm" onClick={loadData}>
                Cari
              </button>
            </div>
          </div>
        </div>
      </div>

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No Pembelian</th>
            <th>Unit</th>
            <th>Supplier</th>
            <th>No Nota</th>
            <th>Total</th>
            <th>Jenis</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id}>
              <td>{idx + 1}</td>
              <td>{formatSortDate(row.tanggal_beli)}</td>
              <td>{row.nomor_pembelian}</td>
              <td>{row.unit_nm}</td>
              <td>{row.supplier}</td>
              <td>{row.nomor_nota}</td>
              <td className="text-end">{formatCurrency(row.total)}</td>
              <td>{getJenisBadge(row.jenis_transaksi)}</td>
              <td className="text-center">
                <span
                  className={`badge ${
                    row.status === "FINAL" ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {row.status}
                </span>
              </td>
              <td className="text-center">
                <button
                  className="btn btn-info btn-sm me-1"
                  onClick={() => handleDetail(row.id)}
                >
                  Detail
                </button>

                {row.status === "DRAFT" && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => navigate(getEditPath(row))}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL DETAIL */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Detail Transaksi - {headerData?.nomor_pembelian}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="row mb-3">
            <div className="col-md-3">
              <strong>Tanggal:</strong>{" "}
              {formatSortDate(headerData?.tanggal_beli)}
            </div>
            <div className="col-md-3">
              <strong>Supplier:</strong> {headerData?.supplier || "-"}
            </div>
            <div className="col-md-3">
              <strong>No Nota:</strong> {headerData?.nomor_nota || "-"}
            </div>
            <div className="col-md-3">
              <strong>Status:</strong>{" "}
              <span
                className={`badge ${headerData?.status === "FINAL" ? "bg-success" : "bg-secondary"}`}
              >
                {headerData?.status}
              </span>
            </div>
          </div>

          <hr />

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Qty</th>
                <th>Satuan</th>
                <th>Harga</th>
                <th>Subtotal</th>
                <th>Rincian</th>
              </tr>
            </thead>

            <tbody>
              {detailData.map((item, idx) => {
                // Cek apakah item ini memiliki rincian
                const hasRincian = item.has_rincian === 1;

                return (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td>{idx + 1}</td>
                      <td>{item.nama_barang}</td>
                      <td>{item.qty}</td>
                      <td>{item.satuan}</td>
                      <td>{formatCurrency(item.harga)}</td>
                      <td>{formatCurrency(item.subtotal)}</td>
                      <td>
                        {hasRincian && (
                          <Badge bg="info">
                            Ada Rincian ({rincianData.length})
                          </Badge>
                        )}
                        {!hasRincian && (
                          <Badge bg="secondary">Tanpa Rincian</Badge>
                        )}
                      </td>
                    </tr>

                    {/* Tampilkan rincian jika ada */}
                    {hasRincian && rincianData.length > 0 && (
                      <tr>
                        <td colSpan="7" className="p-0">
                          <table className="table table-bordered table-sm mb-0 bg-light">
                            <thead>
                              <tr>
                                <th width="30">#</th>
                                <th>Nama Item</th>
                                <th width="80">Qty</th>
                                <th width="100">Satuan</th>
                                <th width="150">Harga</th>
                                <th width="150">Subtotal</th>
                                <th width="80">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rincianData.map((r, ridx) => (
                                <tr key={r.id}>
                                  <td className="text-center">
                                    {idx + 1}.{ridx + 1}
                                  </td>
                                  <td>{r.nama_item}</td>
                                  <td>{r.qty}</td>
                                  <td>{r.satuan}</td>
                                  <td>{formatCurrency(r.harga)}</td>
                                  <td>{formatCurrency(r.subtotal)}</td>
                                  <td className="text-center">
                                    <span className="badge bg-success">
                                      Rincian
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {/* Total rincian */}
                              <tr className="table-active">
                                <td colSpan="4" className="text-end fw-bold">
                                  Total Rincian:
                                </td>
                                <td colSpan="2" className="text-end fw-bold">
                                  {formatCurrency(
                                    rincianData.reduce(
                                      (sum, r) => sum + Number(r.subtotal || 0),
                                      0,
                                    ),
                                  )}
                                </td>
                                <td></td>
                              </tr>
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

          <div className="text-end">
            <h5>
              Total Keseluruhan:{" "}
              <strong>{formatCurrency(headerData?.total)}</strong>
            </h5>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MonitoringPembelian;
