import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";

import { useNavigate } from "react-router-dom";

import {
  fetchMonitoringPembelian,
  fetchMonitoringDetail,
} from "../../api/wj_mobay/MonitoringPembelian";

import { formatCurrency } from "../../utils/FormatNumber";
import { formatSortDate } from "../../utils/FormatDate";

/**
 * ===============================
 * Monitoring Pembelian
 * ===============================
 */

const MonitoringPembelian = () => {
  // -----------------------
  // STATE
  // -----------------------

  const today = new Date().toISOString().split("T")[0];

  const [filter, setFilter] = useState({
    start: today,
    end: today,
    status: "",
  });

  const [data, setData] = useState([]);

  const [showDetail, setShowDetail] = useState(false);

  const [detailData, setDetailData] = useState([]);

  const { units } = useAuth();

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

      setDetailData(res.detail || []);

      setShowDetail(true);
    } catch (err) {
      toast.error("Gagal memuat detail");
    }
  };

  const navigate = useNavigate();

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <strong>Monitoring Pembelian</strong>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
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

            <div className="col-md-3">
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

            <div className="col-md-3">
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
                    onClick={() => navigate(`/mobay/PembelianBarang/${row.id}`)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Detail Pembelian</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Barang</th>
                <th>Qty</th>
                <th>Satuan</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {detailData.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_barang}</td>

                  <td>{item.qty}</td>

                  <td>{item.satuan}</td>

                  <td>{formatCurrency(item.harga)}</td>

                  <td>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MonitoringPembelian;
