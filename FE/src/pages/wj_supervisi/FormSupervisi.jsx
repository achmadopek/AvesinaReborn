import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

import { useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";

import {
  fetchSupervisiDetail,
  saveSupervisi,
} from "../../api/wj_supervisi/Supervisi";

const FormSupervisi = () => {
  const navigate = useNavigate();

  const { supervisi_id } = useParams();

  const isEdit = !!supervisi_id;

  const [loading, setLoading] = useState(false);

  const getDefaultForm = () => {
    const now = new Date();

    // tanggal supervisi = hari ini
    const tanggalSupervisi = now.toISOString().split("T")[0];

    // kemarin jam 07:00
    const periodeAwalDate = new Date(now);
    periodeAwalDate.setDate(periodeAwalDate.getDate() - 1);
    periodeAwalDate.setHours(7, 0, 0, 0);

    // hari ini jam 07:00
    const periodeAkhirDate = new Date(now);
    periodeAkhirDate.setHours(7, 0, 0, 0);

    const formatDatetimeLocal = (date) => {
      const pad = (n) => String(n).padStart(2, "0");

      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
          date.getDate(),
        )}` + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
      );
    };

    return {
      supervisi_id: "",
      tanggal_supervisi: tanggalSupervisi,
      periode_awal: formatDatetimeLocal(periodeAwalDate),
      periode_akhir: formatDatetimeLocal(periodeAkhirDate),
      status: "OPEN",
    };
  };

  const [form, setForm] = useState(getDefaultForm());

  // ==========================
  // LOAD DETAIL
  // ==========================

  useEffect(() => {
    if (isEdit) {
      loadDetail();
    }
  }, [supervisi_id]);

  const loadDetail = async () => {
    try {
      setLoading(true);

      const res = await fetchSupervisiDetail(supervisi_id);

      if (res.success && res.data) {
        setForm({
          supervisi_id: res.data.supervisi_id || "",

          tanggal_supervisi: res.data.tanggal_supervisi?.substring(0, 10) || "",

          periode_awal:
            res.data.periode_awal?.replace(" ", "T")?.substring(0, 16) || "",

          periode_akhir:
            res.data.periode_akhir?.replace(" ", "T")?.substring(0, 16) || "",

          status: res.data.status || "OPEN",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // HANDLE
  // ==========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================
  // SAVE
  // ==========================

  const handleSave = async () => {
    try {
      if (!form.tanggal_supervisi) {
        Swal.fire("Validasi", "Tanggal Supervisi wajib diisi", "warning");
        return;
      }

      if (!form.periode_awal || !form.periode_akhir) {
        Swal.fire("Validasi", "Periode awal dan akhir wajib diisi", "warning");
        return;
      }

      // Validasi periode awal tidak boleh lebih besar dari periode akhir
      if (new Date(form.periode_awal) > new Date(form.periode_akhir)) {
        Swal.fire(
          "Validasi",
          "Periode awal tidak boleh lebih besar dari periode akhir",
          "warning",
        );
        return;
      }

      setLoading(true);

      const payload = {
        ...form,
        user_id: localStorage.getItem("employee_id"),
      };

      if (!isEdit) {
        delete payload.supervisi_id;
      }

      const res = await saveSupervisi(payload);

      if (res.success) {
        Swal.fire("Berhasil", res.message, "success");

        const id = res.supervisi_id || form.supervisi_id;

        navigate(`/supervisi/MonitoringSupervisi/Detail/${id}`);
      }
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Gagal menyimpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // RENDER
  // ==========================

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          {isEdit ? "Edit Supervisi" : "Tambah Supervisi"}
        </h5>
      </Card.Header>

      <Card.Body>
        <Row>
          {isEdit && (
            <Col md={4}>
              <Form.Group>
                <Form.Label>ID Supervisi</Form.Label>

                <Form.Control value={form.supervisi_id} disabled />
              </Form.Group>
            </Col>
          )}

          <Col md={6}>
            <Form.Group>
              <Form.Label>Tanggal Supervisi</Form.Label>

              <Form.Control
                type="date"
                name="tanggal_supervisi"
                value={form.tanggal_supervisi}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Status</Form.Label>

              <Form.Select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="OPEN">OPEN</option>

                <option value="REVIEW">REVIEW</option>

                <option value="FINAL">FINAL</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Periode Awal</Form.Label>

              <Form.Control
                type="datetime-local"
                name="periode_awal"
                value={form.periode_awal}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Periode Akhir</Form.Label>

              <Form.Control
                type="datetime-local"
                name="periode_akhir"
                value={form.periode_akhir}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <hr />

        <div className="d-flex gap-2 justify-content-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Kembali
          </Button>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : "Simpan"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FormSupervisi;
