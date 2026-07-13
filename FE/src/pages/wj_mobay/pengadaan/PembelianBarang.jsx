import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";

import { useAuth } from "../../../context/AuthContext";

import {
  fetchBarangList,
  fetchKategoriBarang,
  savePembelianBarang,
  saveBarangBaru,
} from "../../../api/wj_mobay/PembelianBarang";

import { formatCurrency } from "../../../utils/FormatNumber";

import Select from "react-select";

/**
 * ===============================
 * Pembelian Barang
 * ===============================
 */

const PembelianBarang = () => {
  // -----------------------
  // STATE
  // -----------------------

  const { units, peg_id } = useAuth();

  const [unitId, setUnitId] = useState("");

  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);

  const [showBarangModal, setShowBarangModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [header, setHeader] = useState({
    tanggal_beli: today,
    tanggal_terima: today,
    supplier: "",
    nomor_nota: "",
    keterangan: "",
  });

  const [details, setDetails] = useState([]);

  const [barangBaru, setBarangBaru] = useState({
    kategori_id: "",
    nama_barang: "",
    satuan: "",
  });

  useEffect(() => {
    if (units.length > 0) {
      setUnitId(units[0]);
    }
  }, [units]);

  const loadBarang = async () => {
    try {
      const res = await fetchBarangList();

      setBarangList(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat barang");
    }
  };

  const loadKategori = async () => {
    try {
      const res = await fetchKategoriBarang();

      setKategoriList(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat kategori");
    }
  };

  useEffect(() => {
    loadKategori();
  }, []);

  useEffect(() => {
    loadBarang();
  }, []);

  const addRow = () => {
    setDetails((prev) => [
      ...prev,
      {
        barang_id: "",
        satuan: "",
        qty: 1,
        harga: 0,
        subtotal: 0,
      },
    ]);
  };

  const handleBarangChange = (idx, barangId) => {
    const selected = barangList.find((b) => String(b.id) === String(barangId));

    setDetails((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              barang_id: selected.id,
              satuan: selected.satuan,
              harga: selected.last_price || 0,
              subtotal: row.qty * (selected.last_price || 0),
            }
          : row,
      ),
    );
  };

  const updateRow = (idx, field, value) => {
    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;

        const newRow = {
          ...row,
          [field]: value,
        };

        newRow.subtotal = Number(newRow.qty || 0) * Number(newRow.harga || 0);

        return newRow;
      }),
    );
  };

  const grandTotal = useMemo(() => {
    return details.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  }, [details]);

  const handleSave = async () => {
    try {
      await savePembelianBarang({
        header: {
          ...header,
          unit_id: unitId,
        },
        details,
        employee_id: peg_id,
        units,
      });

      toast.success("Pembelian berhasil disimpan");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    }
  };

  const handleSaveBarang = async () => {
    try {
      if (!barangBaru.nama_barang) {
        toast.warning("Nama barang wajib diisi");
        return;
      }

      if (!barangBaru.kategori_id) {
        toast.warning("Kategori wajib dipilih");
        return;
      }

      if (!barangBaru.satuan) {
        toast.warning("Satuan wajib diisi");
        return;
      }

      await saveBarangBaru(barangBaru);

      toast.success("Barang berhasil ditambahkan");

      setShowBarangModal(false);

      setBarangBaru({
        kategori_id: "",
        nama_barang: "",
        satuan: "",
      });

      await loadBarang();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan barang");
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ============================ FORM HEADER ============================ */}

      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <strong>Pembelian Barang</strong>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-2">
              <label>Tanggal Beli</label>

              <input
                type="date"
                className="form-control form-control-sm"
                value={header.tanggal_beli}
                onChange={(e) =>
                  setHeader({
                    ...header,
                    tanggal_beli: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-3 mb-2">
              <label>Tanggal Terima</label>

              <input
                type="date"
                className="form-control form-control-sm"
                value={header.tanggal_terima}
                onChange={(e) =>
                  setHeader({
                    ...header,
                    tanggal_terima: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-3 mb-2">
              <label>Unit</label>

              <select
                className="form-control form-control-sm"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-2">
              <label>Supplier</label>

              <input
                type="text"
                className="form-control form-control-sm"
                value={header.supplier}
                onChange={(e) =>
                  setHeader({
                    ...header,
                    supplier: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-4 mb-2">
              <label>No Nota</label>

              <input
                type="text"
                className="form-control form-control-sm"
                value={header.nomor_nota}
                onChange={(e) =>
                  setHeader({
                    ...header,
                    nomor_nota: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-8 mb-2">
              <label>Keterangan</label>

              <input
                type="text"
                className="form-control form-control-sm"
                value={header.keterangan}
                onChange={(e) =>
                  setHeader({
                    ...header,
                    keterangan: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <hr />

          {/* ============================ DETAIL BARANG ============================ */}

          <div className="card shadow-sm mt-4">
            <div className="card-header d-flex justify-content-between">
              <strong>Detail Barang</strong>

              <div>
                <button
                  className="btn btn-sm btn-success me-2"
                  onClick={addRow}
                >
                  + Tambah Baris
                </button>

                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowBarangModal(true)}
                >
                  + Barang Baru
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              <table className="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th width="50">No</th>
                    <th>Barang</th>
                    <th width="100">Qty</th>
                    <th width="120">Satuan</th>
                    <th width="180">Harga</th>
                    <th width="180">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {details.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Belum ada item
                      </td>
                    </tr>
                  )}

                  {details.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>

                      <td>
                        <Select
                          placeholder="Cari Barang..."
                          value={
                            barangList
                              .map((b) => ({
                                value: b.id,
                                label: b.nama_barang,
                              }))
                              .find((x) => x.value === row.barang_id) || null
                          }
                          options={barangList.map((b) => ({
                            value: b.id,
                            label: b.nama_barang,
                          }))}
                          onChange={(selected) =>
                            handleBarangChange(idx, selected?.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm pt-2"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(idx, "qty", e.target.value)
                          }
                        />
                      </td>

                      <td>{row.satuan}</td>

                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          value={row.harga}
                          onChange={(e) =>
                            updateRow(idx, "harga", e.target.value)
                          }
                        />
                      </td>

                      <td className="text-end">
                        {formatCurrency(row.subtotal || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-footer d-flex justify-content-between">
              <strong>Total :</strong>

              <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </div>

          <div className="mt-3 text-end">
            <button className="btn btn-success" onClick={handleSave}>
              Simpan Pembelian
            </button>
          </div>
        </div>
      </div>

      {/* MODAL BARANG */}

      <Modal
        show={showBarangModal}
        onHide={() => setShowBarangModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Tambah Barang Baru</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="row">
            <div className="col-md-12 mb-3">
              <label className="form-label">Kategori</label>

              <select
                className="form-control"
                value={barangBaru.kategori_id}
                onChange={(e) =>
                  setBarangBaru({
                    ...barangBaru,
                    kategori_id: e.target.value,
                  })
                }
              >
                <option value="">-- Pilih Kategori --</option>

                {kategoriList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Nama Barang</label>

              <input
                type="text"
                className="form-control"
                value={barangBaru.nama_barang}
                onChange={(e) =>
                  setBarangBaru({
                    ...barangBaru,
                    nama_barang: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Satuan</label>

              <input
                type="text"
                className="form-control"
                placeholder="Contoh: PCS, BOX, BOTOL"
                value={barangBaru.satuan}
                onChange={(e) =>
                  setBarangBaru({
                    ...barangBaru,
                    satuan: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBarangModal(false)}>
            Batal
          </Button>

          <Button variant="success" onClick={handleSaveBarang}>
            Simpan Barang
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PembelianBarang;
