import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";

import TextAreaToolbar from "../../utils/TextAreaToolbar";

import {
  fetchSupervisiDetail,
  saveSupervisiIgd,
  saveSupervisiHd,
  saveSupervisiIbs,
  saveSupervisiMutu,
  saveSupervisiKendala,
  saveSupervisiEksekutif,
} from "../../api/wj_supervisi/Supervisi";

const DetailSupervisi = () => {
  const { supervisi_id } = useParams();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("IGD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // IGD & Rawat Inap
    pasien_total: "",
    pasien_igd_lama: "",
    pasien_igd_baru: "",
    pasien_keluar_igd: "",
    pasien_rawat_inap: "",
    pasien_igd_sisa: "",
    kematian_igd_6_jam: "",
    kematian_ranap_lt_24_jam: "",
    kematian_ranap_gt_24_jam: "",
    catatan: "",
    // HD
    pasien_reguler: "",
    pasien_isolasi: "",
    capd: "",
    pembiayaan_bpjs: "",
    catatan_hd: "",
    // IBS
    operasi_khusus: "",
    emergency: "",
    urgency: "",
    elektif: "",
    operasi_besar: "",
    operasi_sedang: "",
    operasi_kecil: "",
    operasi_batal_tunda: "",
    catatan_ibs: "",
    // Mutu
    keluhan_pasien: "",
    insiden_keselamatan: "",
    kejadian_sentinel: "",
    infeksi_nosokomial: "",
    mutu_mortalitas_igd_6_jam: "",
    mutu_mortalitas_ranap_gt_24_jam: "",
    // Kendala
    kebutuhan_utama: "",
    kendala_utama: "",
    // Eksekutif
    ringkasan_eksekutif: "",
  });

  useEffect(() => {
    loadData();
  }, [supervisi_id]);

  useEffect(() => {
    if (data) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetchSupervisiDetail(supervisi_id);

      setData(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memuat data supervisi", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!data) {
      return;
    }

    switch (activeTab) {
      case "IGD":
        setForm((prev) => ({
          ...prev,
          pasien_total: data.igd?.pasien_total ?? "",
          pasien_igd_lama: data.igd?.pasien_igd_lama ?? "",
          pasien_igd_baru: data.igd?.pasien_igd_baru ?? "",
          pasien_keluar_igd: data.igd?.pasien_keluar_igd ?? "",
          pasien_rawat_inap: data.igd?.pasien_rawat_inap ?? "",
          pasien_igd_sisa: data.igd?.pasien_igd_sisa ?? "",
          kematian_igd_6_jam: data.igd?.kematian_igd_6_jam ?? "",
          kematian_ranap_lt_24_jam: data.igd?.kematian_ranap_lt_24_jam ?? "",
          kematian_ranap_gt_24_jam: data.igd?.kematian_ranap_gt_24_jam ?? "",
          catatan: data.igd?.catatan ?? "",
        }));
        break;
      case "HD":
        setForm((prev) => ({
          ...prev,
          pasien_reguler: data.hd?.pasien_reguler ?? "",
          pasien_isolasi: data.hd?.pasien_isolasi ?? "",
          capd: data.hd?.capd ?? "",
          pembiayaan_bpjs: data.hd?.pembiayaan_bpjs ?? "",
          catatan_hd: data.hd?.catatan ?? "",
        }));
        break;
      case "IBS":
        setForm((prev) => ({
          ...prev,
          operasi_khusus: data.ibs?.operasi_khusus ?? "",
          emergency: data.ibs?.emergency ?? "",
          urgency: data.ibs?.urgency ?? "",
          elektif: data.ibs?.elektif ?? "",
          operasi_besar: data.ibs?.operasi_besar ?? "",
          operasi_sedang: data.ibs?.operasi_sedang ?? "",
          operasi_kecil: data.ibs?.operasi_kecil ?? "",
          operasi_batal_tunda: data.ibs?.operasi_batal_tunda ?? "",
          catatan_ibs: data.ibs?.catatan ?? "",
        }));
        break;
      case "MUTU":
        setForm((prev) => ({
          ...prev,
          keluhan_pasien: data.mutu?.keluhan_pasien ?? "",
          insiden_keselamatan: data.mutu?.insiden_keselamatan ?? "",
          kejadian_sentinel: data.mutu?.kejadian_sentinel ?? "",
          infeksi_nosokomial: data.mutu?.infeksi_nosokomial ?? "",
          mutu_mortalitas_igd_6_jam: data.mutu?.mutu_mortalitas_igd_6_jam ?? "",
          mutu_mortalitas_ranap_gt_24_jam:
            data.mutu?.mutu_mortalitas_ranap_gt_24_jam ?? "",
        }));
        break;
      case "KENDALA":
        setForm((prev) => ({
          ...prev,
          kebutuhan_utama: data.kendala?.kebutuhan_utama ?? "",
          kendala_utama: data.kendala?.kendala_utama ?? "",
        }));
        break;
      case "EKSEKUTIF":
        setForm((prev) => ({
          ...prev,
          ringkasan_eksekutif: data.eksekutif?.ringkasan_eksekutif ?? "",
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
            ...payload,
            kebutuhan_utama: form.kebutuhan_utama,
            kendala_utama: form.kendala_utama,
          });
          break;
        case "EKSEKUTIF":
          res = await saveSupervisiEksekutif({
            ...payload,
            ringkasan_eksekutif: form.ringkasan_eksekutif,
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

  if (loading || !data) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Supervisi</h6>
        </div>

        <div className="card-body">
          <div>Tanggal : {data.tanggal_supervisi}</div>

          <div>Status : {data.status}</div>
        </div>
      </div>

      <ul className="nav nav-tabs mt-3">
        {["IGD", "HD", "IBS", "MUTU", "KENDALA", "EKSEKUTIF"].map((tab) => (
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

          {activeTab === "HD" && (
            <>
              <Row>
                <Col md={6}>
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
                <Col md={6}>
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
                <Col md={6}>
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
                <Col md={6}>
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
              <TextAreaToolbar
                label="Kebutuhan Utama"
                name="kebutuhan_utama"
                value={form.kebutuhan_utama}
                onChange={handleChange}
                rows={6}
                placeholder="- Kebutuhan 1"
              />

              <TextAreaToolbar
                label="Kendala Utama"
                name="kendala_utama"
                value={form.kendala_utama}
                onChange={handleChange}
                rows={6}
                placeholder="- Kendala 1"
              />
            </>
          )}

          {activeTab === "EKSEKUTIF" && (
            <TextAreaToolbar
              label="Ringkasan Eksekutif"
              name="ringkasan_eksekutif"
              value={form.ringkasan_eksekutif}
              onChange={handleChange}
              rows={8}
              placeholder="Tuliskan ringkasan eksekutif..."
            />
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={loadData} disabled={saving}>
              Muat Ulang
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailSupervisi;
