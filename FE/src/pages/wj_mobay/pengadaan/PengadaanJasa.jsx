import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchUnitList,
  fetchBarangList,
  fetchKategoriBarang,
  savePembelianBarang,
  saveBarangBaru,
  submitFinalisasi,
  getPembelianById,
} from "../../../api/wj_mobay/PengadaanJasa";
import { formatCurrency } from "../../../utils/FormatNumber";
import Select from "react-select";
import { useParams } from "react-router-dom";

const PengadaanJasa = () => {
  const { id } = useParams();
  const { units, peg_id } = useAuth();

  const [unitId, setUnitId] = useState("");
  const [unitList, setUnitList] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);

  const [jenisJasa, setJenisJasa] = useState("TANPA_RINCIAN");

  const [showBarangModal, setShowBarangModal] = useState(false);
  const [showRincianModal, setShowRincianModal] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const [header, setHeader] = useState({
    id: null,
    status: "DRAFT",
    tanggal_beli: today,
    tanggal_terima: today,
    supplier: "",
    nomor_nota: "",
    keterangan: "",
  });

  // DETAIL JASA - Setiap row bisa punya rincian atau tidak
  const [details, setDetails] = useState([]);

  const [barangBaru, setBarangBaru] = useState({
    kategori_id: "",
    nama_barang: "",
    satuan: "",
    harga_satuan: "",
  });

  const [rincianBaru, setRincianBaru] = useState({
    nama_item: "",
    qty: 1,
    satuan: "",
    harga: 0,
  });

  // =========================
  // READ ONLY
  // =========================

  const isDraft = header.status === "DRAFT";
  const isFinal = header.status === "FINAL";

  // =========================
  // LOAD DATA
  // =========================

  const loadUnit = async () => {
    try {
      const res = await fetchUnitList(units);
      setUnitList(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat unit");
    }
  };

  useEffect(() => {
    loadUnit();
  }, []);

  useEffect(() => {
    if (unitList.length > 0) {
      setUnitId(unitList[0].unit_id);
    }
  }, [unitList]);

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

  const loadPembelian = async (id) => {
    try {
      const res = await getPembelianById(id);

      setHeader(res.header);
      setUnitId(res.header.unit_id);

      // Set details dengan rincian masing-masing
      const loadedDetails = res.detail || [];

      // Kelompokkan rincian berdasarkan jasa_id (pembelian_id)
      // Karena rincian terhubung ke pembelian_id, semua rincian untuk transaksi ini
      // akan kita distribusikan ke detail yang memiliki has_rincian = 1
      if (res.rincian && res.rincian.length > 0) {
        // Cari detail mana yang memiliki rincian (has_rincian = 1)
        const detailWithRincian = loadedDetails.find(
          (d) => d.has_rincian === 1,
        );

        if (detailWithRincian) {
          // Tambahkan rincian ke detail yang memiliki has_rincian = 1
          loadedDetails.forEach((d, idx) => {
            if (d.has_rincian === 1) {
              d.rincian = res.rincian;
              d.showRincian = true; // Auto expand
            } else {
              d.rincian = [];
              d.showRincian = false;
            }
          });
        } else {
          // Jika tidak ada detail dengan has_rincian, tapi ada rincian
          // Ini kasus khusus: jasa tanpa detail tapi ada rincian
          // Buat detail baru dari rincian
          const newDetail = {
            id: null,
            barang_id: null,
            satuan: "",
            qty: 1,
            harga: res.rincian.reduce(
              (sum, r) => sum + Number(r.subtotal || 0),
              0,
            ),
            subtotal: res.rincian.reduce(
              (sum, r) => sum + Number(r.subtotal || 0),
              0,
            ),
            has_rincian: 1,
            rincian: res.rincian,
            showRincian: true,
          };
          loadedDetails.push(newDetail);
        }
      } else {
        // Tidak ada rincian
        loadedDetails.forEach((d) => {
          d.rincian = [];
          d.showRincian = false;
        });
      }

      // Set state
      setDetails(loadedDetails);

      // Jika ada rincian, set jenisJasa ke DENGAN_RINCIAN
      if (res.rincian && res.rincian.length > 0) {
        setJenisJasa("DENGAN_RINCIAN");
      } else {
        setJenisJasa("TANPA_RINCIAN");
      }
    } catch (err) {
      toast.error("Gagal memuat data pembelian");
    }
  };

  useEffect(() => {
    if (id) {
      loadPembelian(id);
    }
  }, [id]);

  useEffect(() => {
    loadKategori();
  }, []);

  useEffect(() => {
    loadBarang();
  }, []);

  // =========================
  // FUNGSI CRUD DETAIL JASA
  // =========================

  const addRow = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: null,
        barang_id: "",
        satuan: "",
        qty: 1,
        harga: 0,
        subtotal: 0,
        has_rincian: false,
        rincian: [],
        // Flag untuk toggle tampilan rincian di UI
        showRincian: false,
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
              barang_id: selected?.id || "",
              satuan: selected?.satuan || "",
              harga: selected?.last_price || 0,
              subtotal: (row.qty || 1) * (selected?.last_price || 0),
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

        // Hitung subtotal dari qty * harga
        if (field === "qty" || field === "harga") {
          newRow.subtotal = Number(newRow.qty || 0) * Number(newRow.harga || 0);
        }

        return newRow;
      }),
    );
  };

  const handleDeleteRow = (idx) => {
    if (!isDraft) {
      toast.warning("Tidak dapat menghapus item pada status FINAL");
      return;
    }

    setDetails((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleRincian = (idx) => {
    setDetails((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, showRincian: !row.showRincian } : row,
      ),
    );
  };

  // =========================
  // FUNGSI CRUD RINCIAN
  // =========================

  const openRincianModal = (idx) => {
    setSelectedRowIndex(idx);
    setShowRincianModal(true);
  };

  const handleSaveRincian = () => {
    if (!rincianBaru.nama_item) {
      toast.warning("Nama item wajib diisi");
      return;
    }
    if (!rincianBaru.satuan) {
      toast.warning("Satuan wajib diisi");
      return;
    }
    if (Number(rincianBaru.harga) <= 0) {
      toast.warning("Harga harus lebih dari 0");
      return;
    }

    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== selectedRowIndex) return row;

        const newRincian = [...(row.rincian || []), { ...rincianBaru }];
        const subtotalRincian = newRincian.reduce(
          (sum, item) => sum + Number(item.qty || 0) * Number(item.harga || 0),
          0,
        );

        return {
          ...row,
          rincian: newRincian,
          has_rincian: true,
          // Update harga jasa = total rincian
          harga: subtotalRincian,
          subtotal: subtotalRincian * Number(row.qty || 1),
        };
      }),
    );

    setRincianBaru({
      nama_item: "",
      qty: 1,
      satuan: "",
      harga: 0,
    });
    setShowRincianModal(false);
    toast.success("Rincian berhasil ditambahkan");
  };

  const updateRincianRow = (jasaIdx, rincianIdx, field, value) => {
    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== jasaIdx) return row;

        const updatedRincian = row.rincian.map((r, j) =>
          j === rincianIdx ? { ...r, [field]: value } : r,
        );

        const subtotalRincian = updatedRincian.reduce(
          (sum, item) => sum + Number(item.qty || 0) * Number(item.harga || 0),
          0,
        );

        return {
          ...row,
          rincian: updatedRincian,
          harga: subtotalRincian,
          subtotal: subtotalRincian * Number(row.qty || 1),
        };
      }),
    );
  };

  const handleDeleteRincianRow = (jasaIdx, rincianIdx) => {
    if (!isDraft) {
      toast.warning("Tidak dapat menghapus rincian pada status FINAL");
      return;
    }

    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== jasaIdx) return row;

        const updatedRincian = row.rincian.filter((_, j) => j !== rincianIdx);
        const subtotalRincian = updatedRincian.reduce(
          (sum, item) => sum + Number(item.qty || 0) * Number(item.harga || 0),
          0,
        );

        return {
          ...row,
          rincian: updatedRincian,
          has_rincian: updatedRincian.length > 0,
          harga: subtotalRincian,
          subtotal: subtotalRincian * Number(row.qty || 1),
        };
      }),
    );
  };

  // =========================
  // TOTAL
  // =========================

  const grandTotal = useMemo(() => {
    return details.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  }, [details]);

  // =========================
  // SAVE & FINALISASI
  // =========================
  const handleSave = async () => {
    try {
      // Validasi minimal 1 item
      if (details.length === 0) {
        toast.warning("Minimal harus ada 1 item jasa");
        return;
      }

      // Validasi setiap item
      for (let i = 0; i < details.length; i++) {
        const item = details[i];
        if (!item.barang_id) {
          toast.warning(`Item ${i + 1}: Nama jasa wajib dipilih`);
          return;
        }
        if (Number(item.harga) <= 0) {
          toast.warning(`Item ${i + 1}: Harga harus lebih dari 0`);
          return;
        }
      }

      // Siapkan data untuk API - rincian disertakan di dalam details
      const detailPayload = details.map((d) => ({
        barang_id: d.barang_id,
        satuan: d.satuan,
        qty: d.qty || 1,
        harga: d.harga,
        subtotal: d.subtotal,
        has_rincian: d.has_rincian || false,
        rincian: d.rincian || [], // <-- KIRIM RINCIAN DI SINI
      }));

      // DEBUG: Cek payload
      console.log(
        "📦 Payload yang dikirim:",
        JSON.stringify(
          {
            header: {
              ...header,
              unit_id: unitId,
            },
            details: detailPayload,
            employee_id: peg_id,
            units,
          },
          null,
          2,
        ),
      );

      const res = await savePembelianBarang({
        header: {
          ...header,
          unit_id: unitId,
        },
        details: detailPayload,
        employee_id: peg_id,
        units,
      });

      if (res?.id) {
        setHeader((prev) => ({
          ...prev,
          id: res.id,
        }));
      }

      toast.success(res.message || "Pembelian berhasil disimpan");
    } catch (err) {
      console.error("❌ Error save:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    }
  };

  const handleFinalisasi = async () => {
    try {
      await submitFinalisasi(header.id);
      toast.success("Pembelian berhasil difinalisasi");
      setHeader((prev) => ({
        ...prev,
        status: "FINAL",
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal finalisasi");
    }
  };

  const handleSaveBarang = async () => {
    try {
      if (!barangBaru.nama_barang) {
        toast.warning("Nama jasa wajib diisi");
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
      // TAMBAHKAN VALIDASI HARGA SATUAN
      if (!barangBaru.harga_satuan || Number(barangBaru.harga_satuan) <= 0) {
        toast.warning("Harga satuan wajib diisi dan harus lebih dari 0");
        return;
      }

      await saveBarangBaru(barangBaru);
      toast.success("Jasa berhasil ditambahkan");
      setShowBarangModal(false);
      setBarangBaru({
        kategori_id: "",
        nama_barang: "",
        satuan: "",
        harga_satuan: "", // RESET
      });
      await loadBarang();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan jasa");
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <>
      <div className="card shadow-sm mb-3">
        <div className="card-header">
          <strong>Pengadaan Jasa</strong>
        </div>

        <div className="card-body">
          {/* HEADER FORM */}
          <div className="row">
            <div className="col-md-3 mb-2">
              <label>Tanggal Pengadaan</label>
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
              <label>Tanggal Pelaksanaan</label>
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
                {unitList.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.unit_nm}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-2">
              <label>Supplier/Pelaksana</label>
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
              <label>No Nota/Faktur</label>
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

          {/* DETAIL JASA */}
          <div className="card shadow-sm mt-4">
            <div className="card-header d-flex justify-content-between">
              <strong>Detail Jasa</strong>
              <div>
                <button
                  className="btn btn-sm btn-success me-2"
                  onClick={addRow}
                  disabled={!isDraft}
                >
                  + Tambah Jasa
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowBarangModal(true)}
                  disabled={!isDraft}
                >
                  + Jasa Baru
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              <table className="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th width="50">No</th>
                    <th>Nama Jasa</th>
                    <th width="150">Harga</th>
                    <th width="180">Subtotal</th>
                    <th width="150">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {details.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Belum ada item
                      </td>
                    </tr>
                  )}

                  {details.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <tr>
                        <td>{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Select
                              className="flex-grow-1"
                              placeholder="Cari Jasa..."
                              isDisabled={!isDraft}
                              value={
                                barangList
                                  .map((b) => ({
                                    value: b.id,
                                    label: b.nama_barang,
                                  }))
                                  .find((x) => x.value === row.barang_id) ||
                                null
                              }
                              options={barangList.map((b) => ({
                                value: b.id,
                                label: b.nama_barang,
                              }))}
                              onChange={(selected) =>
                                handleBarangChange(idx, selected?.value)
                              }
                            />
                            <button
                              className="btn btn-sm btn-outline-info ms-2"
                              onClick={() => toggleRincian(idx)}
                              disabled={!isDraft}
                              title={
                                row.showRincian
                                  ? "Sembunyikan rincian"
                                  : "Tampilkan rincian"
                              }
                            >
                              {row.showRincian ? "▲" : "▼"}
                            </button>
                            {row.has_rincian && (
                              <span className="badge bg-info ms-2">
                                Rincian
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm text-end"
                            value={row.harga}
                            onChange={(e) =>
                              updateRow(idx, "harga", e.target.value)
                            }
                            disabled={!isDraft || row.has_rincian}
                          />
                        </td>
                        <td className="text-end">
                          {formatCurrency(row.subtotal || 0)}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-info me-1"
                            onClick={() => openRincianModal(idx)}
                            disabled={!isDraft}
                            title="Tambah Rincian"
                          >
                            <i className="fas fa-list"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteRow(idx)}
                            disabled={!isDraft}
                          >
                            <i className="fas fa-trash"></i> Hapus
                          </button>
                        </td>
                      </tr>

                      {/* RINCIAN JASA */}
                      {row.showRincian &&
                        row.rincian &&
                        row.rincian.length > 0 && (
                          <tr>
                            <td colSpan="5" className="p-0">
                              <table className="table table-bordered table-sm mb-0 bg-light">
                                <thead>
                                  <tr>
                                    <th width="50">#</th>
                                    <th>Nama Item</th>
                                    <th width="80">Qty</th>
                                    <th width="100">Satuan</th>
                                    <th width="150">Harga</th>
                                    <th width="150">Subtotal</th>
                                    <th width="80">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.rincian.map((r, ridx) => (
                                    <tr key={ridx}>
                                      <td className="text-center">
                                        {idx + 1}.{ridx + 1}
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={r.nama_item}
                                          onChange={(e) =>
                                            updateRincianRow(
                                              idx,
                                              ridx,
                                              "nama_item",
                                              e.target.value,
                                            )
                                          }
                                          disabled={!isDraft}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          min="1"
                                          className="form-control form-control-sm"
                                          value={r.qty}
                                          onChange={(e) =>
                                            updateRincianRow(
                                              idx,
                                              ridx,
                                              "qty",
                                              e.target.value,
                                            )
                                          }
                                          disabled={!isDraft}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={r.satuan}
                                          onChange={(e) =>
                                            updateRincianRow(
                                              idx,
                                              ridx,
                                              "satuan",
                                              e.target.value,
                                            )
                                          }
                                          disabled={!isDraft}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-end"
                                          value={r.harga}
                                          onChange={(e) =>
                                            updateRincianRow(
                                              idx,
                                              ridx,
                                              "harga",
                                              e.target.value,
                                            )
                                          }
                                          disabled={!isDraft}
                                        />
                                      </td>
                                      <td className="text-end">
                                        {formatCurrency(
                                          Number(r.qty || 0) *
                                            Number(r.harga || 0),
                                        )}
                                      </td>
                                      <td className="text-center">
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() =>
                                            handleDeleteRincianRow(idx, ridx)
                                          }
                                          disabled={!isDraft}
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
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
            {isDraft && (
              <button className="btn btn-success" onClick={handleSave}>
                Simpan
              </button>
            )}

            {header.id && isDraft && (
              <button
                className="btn btn-warning ms-2"
                onClick={handleFinalisasi}
              >
                Finalisasi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH JASA BARU */}
      <Modal
        show={showBarangModal}
        onHide={() => setShowBarangModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Tambah Jasa Baru</Modal.Title>
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
              <label className="form-label">Nama Jasa</label>
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
                placeholder="Contoh: Paket, Hari, Orang, dll"
                value={barangBaru.satuan}
                onChange={(e) =>
                  setBarangBaru({
                    ...barangBaru,
                    satuan: e.target.value,
                  })
                }
              />
            </div>

            {/* TAMBAHKAN INPUT HARGA SATUAN */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Harga Satuan</label>
              <input
                type="number"
                className="form-control"
                placeholder="Masukkan harga satuan"
                value={barangBaru.harga_satuan || ""}
                onChange={(e) =>
                  setBarangBaru({
                    ...barangBaru,
                    harga_satuan: e.target.value,
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
            Simpan Jasa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL TAMBAH RINCIAN */}
      <Modal
        show={showRincianModal}
        onHide={() => setShowRincianModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Tambah Rincian Jasa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Nama Item</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masukkan nama item"
              value={rincianBaru.nama_item}
              onChange={(e) =>
                setRincianBaru({ ...rincianBaru, nama_item: e.target.value })
              }
            />
          </div>
          <div className="row">
            <div className="col-md-2 mb-3">
              <label className="form-label">Qty</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={rincianBaru.qty}
                onChange={(e) =>
                  setRincianBaru({ ...rincianBaru, qty: e.target.value })
                }
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Satuan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Unit, Buah, Orang"
                value={rincianBaru.satuan}
                onChange={(e) =>
                  setRincianBaru({ ...rincianBaru, satuan: e.target.value })
                }
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Harga Satuan</label>
              <input
                type="number"
                className="form-control"
                value={rincianBaru.harga}
                onChange={(e) =>
                  setRincianBaru({ ...rincianBaru, harga: e.target.value })
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRincianModal(false);
              setRincianBaru({
                nama_item: "",
                qty: 1,
                satuan: "",
                harga: 0,
              });
            }}
          >
            Batal
          </Button>
          <Button variant="success" onClick={handleSaveRincian}>
            Simpan Rincian
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PengadaanJasa;
