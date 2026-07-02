import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  Button,
  Badge,
  Table,
  Modal,
  Form,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";

import Swal from "sweetalert2";

import { fetchDireksiIssueDetail } from "../../api/wj_supervisi/DireksiIssue";

import {
  saveDireksiPlan,
  deleteDireksiPlan,
} from "../../api/wj_supervisi/DireksiPlan";

import { useAuth } from "../../context/AuthContext";

const DetailDireksiIssue = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const { direksi_issue_id } = useParams();

  const [loading, setLoading] = useState(true);

  const [issue, setIssue] = useState(null);

  const [plans, setPlans] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [saving, setSaving] = useState(false);

  const [formPlan, setFormPlan] = useState({
    direksi_plan_id: "",
    uraian_tindakan: "",
    pic: "",
    status: "OPEN",
    target_selesai: "",
    tanggal_selesai: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetchDireksiIssueDetail(direksi_issue_id);

      setIssue(res.data.issue);
      setPlans(res.data.plans || []);
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

  const openAddPlan = () => {
    setFormPlan({
      direksi_plan_id: "",
      uraian_tindakan: "",
      pic: "",
      status: "OPEN",
      target_selesai: "",
      tanggal_selesai: "",
    });

    setShowModal(true);
  };

  const openEditPlan = (plan) => {
    setFormPlan(plan);
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);

      await saveDireksiPlan({
        ...formPlan,
        direksi_plan_id: formPlan.direksi_plan_id || `PLAN${Date.now()}`,
        direksi_issue_id,
        user_id: user?.employee_id || user?.user_id,
      });

      Swal.fire("Berhasil", "Plan berhasil disimpan", "success");

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Gagal menyimpan plan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (direksi_plan_id) => {
    const confirm = await Swal.fire({
      title: "Hapus Plan ?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteDireksiPlan(direksi_plan_id);
      Swal.fire("Berhasil", "Plan berhasil dihapus", "success");
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menghapus plan", "error");
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
    <>
      {" "}
      <Card className="mb-3">
        <Card.Body>
          {" "}
          <div className="d-flex justify-content-between">
            <div>
              <h4>{issue?.judul}</h4>
              <p>{issue?.deskripsi}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate("/supervisi/MonitoringDireksiIssue")}
            >
              Kembali
            </Button>
          </div>
          <Row>
            <Col md={3}>
              <strong>Prioritas</strong>
              <br />

              <Badge bg="danger">{issue?.prioritas}</Badge>
            </Col>

            <Col md={3}>
              <strong>Status</strong>
              <br />

              <Badge bg="primary">{issue?.status}</Badge>
            </Col>

            <Col md={3}>
              <strong>PIC</strong>
              <br />
              {issue?.pic}
            </Col>

            <Col md={3}>
              <strong>Target</strong>
              <br />
              {issue?.target_selesai}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <h5>Rencana Aksi Cepat</h5>

            <Button onClick={openAddPlan}>
              <i className="bi bi-plus-circle me-2"></i>
              Tambah Plan
            </Button>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Uraian</th>
                <th>PIC</th>
                <th>Status</th>
                <th>Target</th>
                <th width="120">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    Belum ada plan
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.direksi_plan_id}>
                    <td>{plan.uraian_tindakan}</td>

                    <td>{plan.pic}</td>

                    <td>{plan.status}</td>

                    <td>{plan.target_selesai}</td>

                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => openEditPlan(plan)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeletePlan(plan.direksi_plan_id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Plan Aksi Cepat</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Uraian Tindakan</Form.Label>

            <Form.Control
              as="textarea"
              rows={4}
              value={formPlan.uraian_tindakan}
              onChange={(e) =>
                setFormPlan({
                  ...formPlan,
                  uraian_tindakan: e.target.value,
                })
              }
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Label>PIC</Form.Label>

              <Form.Control
                value={formPlan.pic}
                onChange={(e) =>
                  setFormPlan({
                    ...formPlan,
                    pic: e.target.value,
                  })
                }
              />
            </Col>

            <Col md={6}>
              <Form.Label>Status</Form.Label>

              <Form.Select
                value={formPlan.status}
                onChange={(e) => {
                  const status = e.target.value;

                  setFormPlan((prev) => ({
                    ...prev,
                    status,
                    ...(status === "DONE" && !prev.tanggal_selesai
                      ? {
                          tanggal_selesai: new Date()
                            .toISOString()
                            .slice(0, 10),
                        }
                      : {}),
                  }));
                }}
              >
                <option value="OPEN">OPEN</option>

                <option value="PROGRESS">PROGRESS</option>

                <option value="DONE">DONE</option>

                <option value="CANCEL">CANCEL</option>
              </Form.Select>
            </Col>

            <Col md={6} className="mt-3">
              <Form.Label>Target Selesai</Form.Label>

              <Form.Control
                type="date"
                value={formPlan.target_selesai}
                onChange={(e) =>
                  setFormPlan({
                    ...formPlan,
                    target_selesai: e.target.value,
                  })
                }
              />
            </Col>

            <Col md={6} className="mt-3">
              <Form.Label>Tanggal Selesai</Form.Label>

              <Form.Control
                type="date"
                value={formPlan.tanggal_selesai}
                onChange={(e) =>
                  setFormPlan({
                    ...formPlan,
                    tanggal_selesai: e.target.value,
                  })
                }
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Tutup
          </Button>

          <Button onClick={handleSavePlan} disabled={saving}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DetailDireksiIssue;
