import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, Row, Col, Form, Button, Spinner } from "react-bootstrap";

import Swal from "sweetalert2";

import {
  fetchDireksiIssueDetail,
  saveDireksiIssue,
} from "../../api/wj_supervisi/DireksiIssue";

import { useAuth } from "../../context/AuthContext";

const FormDireksiIssue = () => {
  const navigate = useNavigate();
  const { direksi_issue_id } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    direksi_issue_id: "",
    judul: "",
    deskripsi: "",
    prioritas: "SEDANG",
    status: "OPEN",
    is_fokus_hari_ini: 0,
    pic: "",
    tanggal_mulai: "",
    target_selesai: "",
    tanggal_selesai: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "status" && value === "DONE" && !prev.tanggal_selesai
        ? { tanggal_selesai: new Date().toISOString().slice(0, 10) }
        : {}),
    }));
  };

  const loadData = async () => {
    if (!direksi_issue_id) return;

    try {
      setLoading(true);

      const res = await fetchDireksiIssueDetail(direksi_issue_id);

      if (res.data?.issue) {
        setForm({
          ...res.data.issue,
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Gagal mengambil detail issue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [direksi_issue_id]);

  const handleSave = async () => {
    try {
      setSaving(true);

      await saveDireksiIssue({
        ...form,
        user_id: user?.employee_id || user?.user_id,
      });

      Swal.fire("Berhasil", "Issue berhasil disimpan", "success");

      navigate("/supervisi/MonitoringDireksiIssue");
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Gagal menyimpan issue", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        {" "}
        <Spinner />{" "}
      </div>
    );
  }

  return (
    <Card>
      <Card.Body>
        {" "}
        <h4 className="mb-4">
          {direksi_issue_id ? "Edit Issue" : "Tambah Issue"}{" "}
        </h4>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Judul</Form.Label>

            <Form.Control
              name="judul"
              value={form.judul}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Deskripsi</Form.Label>

            <Form.Control
              as="textarea"
              rows={5}
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
            />
          </Form.Group>

          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Prioritas</Form.Label>

                <Form.Select
                  name="prioritas"
                  value={form.prioritas}
                  onChange={handleChange}
                >
                  <option value="RENDAH">RENDAH</option>

                  <option value="SEDANG">SEDANG</option>

                  <option value="TINGGI">TINGGI</option>

                  <option value="KRITIS">KRITIS</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>

                <Form.Select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="OPEN">OPEN</option>

                  <option value="PROGRESS">PROGRESS</option>

                  <option value="DONE">DONE</option>

                  <option value="CANCEL">CANCEL</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>PIC</Form.Label>

                <Form.Control
                  name="pic"
                  value={form.pic}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fokus Hari Ini</Form.Label>

                <Form.Check
                  type="switch"
                  checked={form.is_fokus_hari_ini == 1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_fokus_hari_ini: e.target.checked ? 1 : 0,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Mulai</Form.Label>

                <Form.Control
                  type="date"
                  name="tanggal_mulai"
                  value={form.tanggal_mulai || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Target Selesai</Form.Label>

                <Form.Control
                  type="date"
                  name="target_selesai"
                  value={form.target_selesai || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Selesai</Form.Label>

                <Form.Control
                  type="date"
                  name="tanggal_selesai"
                  value={form.tanggal_selesai || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/supervisi/MonitoringDireksiIssue")}
            >
              Kembali
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Simpan"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormDireksiIssue;
