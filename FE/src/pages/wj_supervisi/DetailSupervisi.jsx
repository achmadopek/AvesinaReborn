import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { formatSortDate, formatSortDateTime } from "../../utils/FormatDate";
import Swal from "sweetalert2";

import {
  fetchSupervisiDetail,
  saveSupervisiIgd,
  saveSupervisiHd,
  saveSupervisiIbs,
  saveSupervisiMutu,
  saveSupervisiKendala,
  saveSupervisiEksekutif,
  saveKebutuhanDetail,
  deleteKebutuhanDetail,
  saveKendalaDetail,
  deleteKendalaDetail,
  saveEksekutifDetail,
  deleteEksekutifDetail,
} from "../../api/wj_supervisi/Supervisi";

const DetailSupervisi = () => {
  const { supervisi_id } = useParams();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("IGD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // State untuk modal detail
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [uraian, setUraian] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);

  // State untuk menyimpan daftar detail
  const [kebutuhanList, setKebutuhanList] = useState([]);
  const [kendalaList, setKendalaList] = useState([]);
  const [eksekutifList, setEksekutifList] = useState([]);

  const isMounted = useRef(true);
  const loadingRef = useRef(false);

  const [form, setForm] = useState({
    pasien_total: "",
    pasien_hd_total: "",
    pasien_ibs_total: "",
    pasien_igd_lama: "",
    pasien_igd_baru: "",
    pasien_keluar_igd: "",
    pasien_rawat_inap: "",
    pasien_igd_sisa: "",
    kematian_igd_6_jam: "",
    kematian_ranap_lt_24_jam: "",
    kematian_ranap_gt_24_jam: "",
    catatan: "",
    pasien_reguler: "",
    pasien_isolasi: "",
    capd: "",
    pembiayaan_bpjs: "",
    catatan_hd: "",
    operasi_khusus: "",
    emergency: "",
    urgency: "",
    elektif: "",
    operasi_besar: "",
    operasi_sedang: "",
    operasi_kecil: "",
    operasi_batal_tunda: "",
    catatan_ibs: "",
    keluhan_pasien: "",
    insiden_keselamatan: "",
    kejadian_sentinel: "",
    infeksi_nosokomial: "",
    mutu_mortalitas_igd_6_jam: "",
    mutu_mortalitas_ranap_gt_24_jam: "",
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [supervisi_id]);

  useEffect(() => {
    if (data) {
      resetForm();
    }
  }, [data, activeTab]);

  const loadData = async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);

      const res = await fetchSupervisiDetail(supervisi_id);

      if (!isMounted.current) return;

      setData(res.data);
      setKebutuhanList(res.data.kendala?.kebutuhan_detail || []);
      setKendalaList(res.data.kendala?.kendala_detail || []);
      setEksekutifList(res.data.eksekutif?.detail || []);

      if (res.data) {
        resetForm(res.data);
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
        Swal.fire("Error", "Gagal memuat data supervisi", "error");
      }
    } finally {
      loadingRef.current = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const resetForm = (dataParam) => {
    const dataSource = dataParam || data;
    if (!dataSource) return;

    switch (activeTab) {
      case "IGD":
        setForm((prev) => ({
          ...prev,
          pasien_total: dataSource.igd?.pasien_total ?? "",
          pasien_igd_lama: dataSource.igd?.pasien_igd_lama ?? "",
          pasien_igd_baru: dataSource.igd?.pasien_igd_baru ?? "",
          pasien_keluar_igd: dataSource.igd?.pasien_keluar_igd ?? "",
          pasien_rawat_inap: dataSource.igd?.pasien_rawat_inap ?? "",
          pasien_igd_sisa: dataSource.igd?.pasien_igd_sisa ?? "",
          kematian_igd_6_jam: dataSource.igd?.kematian_igd_6_jam ?? "",
          kematian_ranap_lt_24_jam:
            dataSource.igd?.kematian_ranap_lt_24_jam ?? "",
          kematian_ranap_gt_24_jam:
            dataSource.igd?.kematian_ranap_gt_24_jam ?? "",
          catatan: dataSource.igd?.catatan ?? "",
        }));
        break;
      case "IBS":
        setForm((prev) => ({
          ...prev,
          pasien_ibs_total:
            dataSource.ibs?.pasien_ibs_total ??
            dataSource.ibs?.total_ibs_pasien ??
            "",
          operasi_khusus: dataSource.ibs?.operasi_khusus ?? "",
          emergency: dataSource.ibs?.emergency ?? "",
          urgency: dataSource.ibs?.urgency ?? "",
          elektif: dataSource.ibs?.elektif ?? "",
          operasi_besar: dataSource.ibs?.operasi_besar ?? "",
          operasi_sedang: dataSource.ibs?.operasi_sedang ?? "",
          operasi_kecil: dataSource.ibs?.operasi_kecil ?? "",
          operasi_batal_tunda: dataSource.ibs?.operasi_batal_tunda ?? "",
          catatan_ibs: dataSource.ibs?.catatan ?? "",
        }));
        break;
      case "HD":
        setForm((prev) => ({
          ...prev,
          pasien_hd_total:
            dataSource.hd?.pasien_hd_total ??
            dataSource.hd?.total_hd_pasien ??
            "",
          pasien_reguler: dataSource.hd?.pasien_reguler ?? "",
          pasien_isolasi: dataSource.hd?.pasien_isolasi ?? "",
          capd: dataSource.hd?.capd ?? "",
          pembiayaan_bpjs: dataSource.hd?.pembiayaan_bpjs ?? "",
          catatan_hd: dataSource.hd?.catatan ?? "",
        }));
        break;
      case "MUTU":
        setForm((prev) => ({
          ...prev,
          keluhan_pasien: dataSource.mutu?.keluhan_pasien ?? "",
          insiden_keselamatan: dataSource.mutu?.insiden_keselamatan ?? "",
          kejadian_sentinel: dataSource.mutu?.kejadian_sentinel ?? "",
          infeksi_nosokomial: dataSource.mutu?.infeksi_nosokomial ?? "",
          mutu_mortalitas_igd_6_jam:
            dataSource.mutu?.mutu_mortalitas_igd_6_jam ?? "",
          mutu_mortalitas_ranap_gt_24_jam:
            dataSource.mutu?.mutu_mortalitas_ranap_gt_24_jam ?? "",
        }));
        break;
      default:
        break;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setUraian("");
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setUraian(item.uraian);
    setShowModal(true);
  };

  // ===== FUNGSI UPDATE LIST =====
  const updateKebutuhanList = (newItem, isEdit = false) => {
    setKebutuhanList((prev) => {
      if (isEdit) {
        return prev.map((item) =>
          item.supervisi_kebutuhan_detail_id ===
          newItem.supervisi_kebutuhan_detail_id
            ? newItem
            : item,
        );
      } else {
        return [...prev, newItem];
      }
    });
  };

  const updateKendalaList = (newItem, isEdit = false) => {
    setKendalaList((prev) => {
      if (isEdit) {
        return prev.map((item) =>
          item.supervisi_kendala_detail_id ===
          newItem.supervisi_kendala_detail_id
            ? newItem
            : item,
        );
      } else {
        return [...prev, newItem];
      }
    });
  };

  const updateEksekutifList = (newItem, isEdit = false) => {
    setEksekutifList((prev) => {
      if (isEdit) {
        return prev.map((item) =>
          item.supervisi_eksekutif_detail_id ===
          newItem.supervisi_eksekutif_detail_id
            ? newItem
            : item,
        );
      } else {
        return [...prev, newItem];
      }
    });
  };

  const removeKebutuhanItem = (detailId) => {
    setKebutuhanList((prev) =>
      prev.filter((item) => item.supervisi_kebutuhan_detail_id !== detailId),
    );
  };

  const removeKendalaItem = (detailId) => {
    setKendalaList((prev) =>
      prev.filter((item) => item.supervisi_kendala_detail_id !== detailId),
    );
  };

  const removeEksekutifItem = (detailId) => {
    setEksekutifList((prev) =>
      prev.filter((item) => item.supervisi_eksekutif_detail_id !== detailId),
    );
  };

  // ===== HANDLE SAVE DETAIL =====
  const handleSaveDetail = async () => {
    if (!uraian.trim()) {
      Swal.fire("Peringatan", "Uraian tidak boleh kosong", "warning");
      return;
    }

    try {
      setSavingDetail(true);
      const user_id = localStorage.getItem("employee_id");
      let res;

      if (modalType === "KEBUTUHAN") {
        res = await saveKebutuhanDetail({
          supervisi_kebutuhan_detail_id:
            editingItem?.supervisi_kebutuhan_detail_id || null,
          supervisi_id,
          uraian: uraian.trim(),
          user_id,
        });

        if (res?.success && res?.data) {
          updateKebutuhanList(res.data, !!editingItem);
        }
      } else if (modalType === "KENDALA") {
        res = await saveKendalaDetail({
          supervisi_kendala_detail_id:
            editingItem?.supervisi_kendala_detail_id || null,
          supervisi_id,
          uraian: uraian.trim(),
          user_id,
        });

        if (res?.success && res?.data) {
          updateKendalaList(res.data, !!editingItem);
        }
      } else if (modalType === "EKSEKUTIF") {
        res = await saveEksekutifDetail({
          supervisi_eksekutif_detail_id:
            editingItem?.supervisi_eksekutif_detail_id || null,
          supervisi_id,
          uraian: uraian.trim(),
          user_id,
        });

        if (res?.success && res?.data) {
          updateEksekutifList(res.data, !!editingItem);
        }
      }

      if (res?.success) {
        setShowModal(false);
        setUraian("");
        setEditingItem(null);
        Swal.fire("Berhasil", res.message, "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menyimpan detail", "error");
    } finally {
      setSavingDetail(false);
    }
  };

  // ===== HANDLE DELETE DETAIL =====
  const handleDeleteDetail = async (type, item) => {
    let detailId = null;
    if (type === "KEBUTUHAN") {
      detailId = item.supervisi_kebutuhan_detail_id;
    } else if (type === "KENDALA") {
      detailId = item.supervisi_kendala_detail_id;
    } else if (type === "EKSEKUTIF") {
      detailId = item.supervisi_eksekutif_detail_id;
    }

    if (!detailId) {
      Swal.fire("Error", "ID detail tidak ditemukan", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Yakin ingin menghapus item ini?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      let res;

      if (type === "KEBUTUHAN") {
        res = await deleteKebutuhanDetail(detailId);
        if (res?.success) {
          removeKebutuhanItem(detailId);
        }
      } else if (type === "KENDALA") {
        res = await deleteKendalaDetail(detailId);
        if (res?.success) {
          removeKendalaItem(detailId);
        }
      } else if (type === "EKSEKUTIF") {
        res = await deleteEksekutifDetail(detailId);
        if (res?.success) {
          removeEksekutifItem(detailId);
        }
      }

      if (res?.success) {
        Swal.fire(
          "Berhasil",
          res.message || "Data berhasil dihapus",
          "success",
        );
      } else {
        throw new Error(res?.message || "Gagal menghapus data");
      }
    } catch (err) {
      console.error("Error deleting detail:", err);
      Swal.fire("Error", err.message || "Gagal menghapus detail", "error");
    }
  };

  // ===== HANDLE SAVE TAB =====
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        supervisi_id,
        user_id: localStorage.getItem("employee_id"),
      };

      let res;

      switch (activeTab) {
        case "IGD":
          res = await saveSupervisiIgd({
            ...payload,
            pasien_total: form.pasien_total,
            pasien_igd_lama: form.pasien_igd_lama,
            pasien_igd_baru: form.pasien_igd_baru,
            pasien_keluar_igd: form.pasien_keluar_igd,
            pasien_rawat_inap: form.pasien_rawat_inap,
            pasien_igd_sisa: form.pasien_igd_sisa,
            kematian_igd_6_jam: form.kematian_igd_6_jam,
            kematian_ranap_lt_24_jam: form.kematian_ranap_lt_24_jam,
            kematian_ranap_gt_24_jam: form.kematian_ranap_gt_24_jam,
            catatan: form.catatan,
          });
          break;
        case "HD":
          res = await saveSupervisiHd({
            ...payload,
            pasien_hd_total: form.pasien_hd_total,
            pasien_reguler: form.pasien_reguler,
            pasien_isolasi: form.pasien_isolasi,
            capd: form.capd,
            pembiayaan_bpjs: form.pembiayaan_bpjs,
            catatan: form.catatan_hd,
          });
          break;
        case "IBS":
          res = await saveSupervisiIbs({
            ...payload,
            pasien_ibs_total: form.pasien_ibs_total,
            operasi_khusus: form.operasi_khusus,
            emergency: form.emergency,
            urgency: form.urgency,
            elektif: form.elektif,
            operasi_besar: form.operasi_besar,
            operasi_sedang: form.operasi_sedang,
            operasi_kecil: form.operasi_kecil,
            operasi_batal_tunda: form.operasi_batal_tunda,
            catatan: form.catatan_ibs,
          });
          break;
        case "MUTU":
          res = await saveSupervisiMutu({
            ...payload,
            keluhan_pasien: form.keluhan_pasien,
            insiden_keselamatan: form.insiden_keselamatan,
            kejadian_sentinel: form.kejadian_sentinel,
            infeksi_nosokomial: form.infeksi_nosokomial,
            mutu_mortalitas_igd_6_jam: form.mutu_mortalitas_igd_6_jam,
            mutu_mortalitas_ranap_gt_24_jam:
              form.mutu_mortalitas_ranap_gt_24_jam,
          });
          break;
        case "KENDALA":
          res = await saveSupervisiKendala({
            supervisi_id,
            kebutuhan_detail: kebutuhanList,
            kendala_detail: kendalaList,
            user_id: payload.user_id,
          });
          break;
        case "EKSEKUTIF":
          res = await saveSupervisiEksekutif({
            supervisi_id,
            detail: eksekutifList,
            user_id: payload.user_id,
          });
          break;
        default:
          return;
      }

      if (res?.success) {
        Swal.fire("Berhasil", res.message, "success");
        await loadData();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menyimpan data", "error");
    } finally {
      setSaving(false);
    }
  };

  // ===== RENDER DETAIL ITEMS =====
  const renderDetailItems = (items, type, label) => {
    if (!Array.isArray(items)) {
      console.warn(`${label} is not an array:`, items);
      return <div className="text-danger">Error: Data tidak valid</div>;
    }

    return (
      <>
        <div className="d-flex justify-content-between mb-2">
          <h6>{label}</h6>
          <Button
            size="sm"
            variant="primary"
            onClick={() => openAddModal(type)}
          >
            + Tambah
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-muted text-center py-3">
            Belum ada data {label.toLowerCase()}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th width="50" className="text-center">
                    No
                  </th>
                  <th>Uraian</th>
                  <th width="180" className="text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  // Ambil ID berdasarkan tipe
                  let id = null;
                  if (type === "KEBUTUHAN") {
                    id = item.supervisi_kebutuhan_detail_id;
                  } else if (type === "KENDALA") {
                    id = item.supervisi_kendala_detail_id;
                  } else if (type === "EKSEKUTIF") {
                    id = item.supervisi_eksekutif_detail_id;
                  }

                  const key = id || `temp-${idx}`;

                  return (
                    <tr key={key}>
                      <td className="text-center">{idx + 1}</td>
                      <td
                        className="text-wrap"
                        style={{ maxWidth: "400px", wordBreak: "break-word" }}
                      >
                        {item.uraian || "-"}
                      </td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-1"
                          onClick={() => openEditModal(type, item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteDetail(type, item)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  if (loading || !data) {
    return <div className="text-center py-5">Loading...</div>;
  }

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Detail Supervisi</h6>
        </div>
        <div className="card-body">
          <Row>
            <Col md={6}>
              <strong>Tanggal:</strong> {formatSortDate(data.tanggal_supervisi)}
            </Col>
            <Col md={6}>
              <strong>Status:</strong>{" "}
              <span
                className={`badge bg-${data.status === "OPEN" ? "warning" : data.status === "REVIEW" ? "info" : "success"}`}
              >
                {data.status}
              </span>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <strong>Periode:</strong> {formatSortDateTime(data.periode_awal)}{" "}
              s/d {formatSortDateTime(data.periode_akhir)}
            </Col>
          </Row>
        </div>
      </div>

      <ul className="nav nav-tabs mt-3">
        {["IGD", "IBS", "HD", "MUTU", "KENDALA", "EKSEKUTIF"].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-top-0">
        <div className="card-body">
          {activeTab === "IGD" && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Pasien</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_total"
                      value={form.pasien_total}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien IGD Lama</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_igd_lama"
                      value={form.pasien_igd_lama}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien IGD Baru</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_igd_baru"
                      value={form.pasien_igd_baru}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien Keluar dari IGD</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_keluar_igd"
                      value={form.pasien_keluar_igd}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien Pindah ke Rawat Inap</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_rawat_inap"
                      value={form.pasien_rawat_inap}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sisa Pasien di IGD</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_igd_sisa"
                      value={form.pasien_igd_sisa}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mortalitas IGD ≤ 6 jam</Form.Label>
                    <Form.Control
                      type="number"
                      name="kematian_igd_6_jam"
                      value={form.kematian_igd_6_jam}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mortalitas Ranap &lt; 24 jam</Form.Label>
                    <Form.Control
                      type="number"
                      name="kematian_ranap_lt_24_jam"
                      value={form.kematian_ranap_lt_24_jam}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mortalitas Ranap &gt; 24 jam</Form.Label>
                    <Form.Control
                      type="number"
                      name="kematian_ranap_gt_24_jam"
                      value={form.kematian_ranap_gt_24_jam}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Catatan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="catatan"
                  value={form.catatan}
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}

          {activeTab === "IBS" && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Emergency</Form.Label>
                    <Form.Control
                      type="number"
                      name="emergency"
                      value={form.emergency}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Urgency</Form.Label>
                    <Form.Control
                      type="number"
                      name="urgency"
                      value={form.urgency}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Elektif</Form.Label>
                    <Form.Control
                      type="number"
                      name="elektif"
                      value={form.elektif}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Operasi Besar</Form.Label>
                    <Form.Control
                      type="number"
                      name="operasi_besar"
                      value={form.operasi_besar}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Operasi Sedang</Form.Label>
                    <Form.Control
                      type="number"
                      name="operasi_sedang"
                      value={form.operasi_sedang}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Operasi Kecil</Form.Label>
                    <Form.Control
                      type="number"
                      name="operasi_kecil"
                      value={form.operasi_kecil}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Operasi Khusus</Form.Label>
                    <Form.Control
                      type="number"
                      name="operasi_khusus"
                      value={form.operasi_khusus}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Operasi Batal / Tunda</Form.Label>
                    <Form.Control
                      type="number"
                      name="operasi_batal_tunda"
                      value={form.operasi_batal_tunda}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien IBS Total</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_ibs_total"
                      value={form.pasien_ibs_total}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Catatan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="catatan_ibs"
                  value={form.catatan_ibs}
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}

          {activeTab === "HD" && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien Total</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_hd_total"
                      value={form.pasien_hd_total}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien Reguler</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_reguler"
                      value={form.pasien_reguler}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pasien Isolasi</Form.Label>
                    <Form.Control
                      type="number"
                      name="pasien_isolasi"
                      value={form.pasien_isolasi}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>CAPD</Form.Label>
                    <Form.Control
                      type="number"
                      name="capd"
                      value={form.capd}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pembiayaan BPJS</Form.Label>
                    <Form.Control
                      type="number"
                      name="pembiayaan_bpjs"
                      value={form.pembiayaan_bpjs}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Catatan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="catatan_hd"
                  value={form.catatan_hd}
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}

          {activeTab === "MUTU" && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Insiden Keselamatan</Form.Label>
                    <Form.Control
                      type="number"
                      name="insiden_keselamatan"
                      value={form.insiden_keselamatan}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kejadian Sentinel</Form.Label>
                    <Form.Control
                      type="number"
                      name="kejadian_sentinel"
                      value={form.kejadian_sentinel}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Infeksi Nosokomial</Form.Label>
                    <Form.Control
                      type="number"
                      name="infeksi_nosokomial"
                      value={form.infeksi_nosokomial}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mortalitas IGD ≤ 6 jam</Form.Label>
                    <Form.Control
                      type="number"
                      name="mutu_mortalitas_igd_6_jam"
                      value={form.mutu_mortalitas_igd_6_jam}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mortalitas Ranap &gt; 24 jam</Form.Label>
                    <Form.Control
                      type="number"
                      name="mutu_mortalitas_ranap_gt_24_jam"
                      value={form.mutu_mortalitas_ranap_gt_24_jam}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Keluhan / Catatan Mutu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="keluhan_pasien"
                  value={form.keluhan_pasien}
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}

          {activeTab === "KENDALA" && (
            <>
              {renderDetailItems(kebutuhanList, "KEBUTUHAN", "Kebutuhan")}
              <hr className="my-4" />
              {renderDetailItems(kendalaList, "KENDALA", "Kendala")}
            </>
          )}

          {activeTab === "EKSEKUTIF" && (
            <>
              {renderDetailItems(
                eksekutifList,
                "EKSEKUTIF",
                "Ringkasan Eksekutif",
              )}
            </>
          )}

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" onClick={loadData} disabled={saving}>
              Muat Ulang
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Simpan"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal untuk Detail */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "Edit" : "Tambah"} {modalType}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Uraian</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Masukkan uraian..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveDetail}
            disabled={savingDetail}
          >
            {savingDetail ? <Spinner size="sm" animation="border" /> : "Simpan"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DetailSupervisi;
