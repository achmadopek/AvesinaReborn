import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, Badge, Spinner, Table } from "react-bootstrap";

import Swal from "sweetalert2";

import {
  fetchDireksiIssueData,
  deleteDireksiIssue,
} from "../../api/wj_supervisi/DireksiIssue";

const MonitoringDireksiIssue = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetchDireksiIssueData();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal mengambil data issue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (direksi_issue_id) => {
    const confirm = await Swal.fire({
      title: "Hapus Issue?",
      text: "Data tidak akan tampil lagi",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteDireksiIssue(direksi_issue_id);
      Swal.fire("Berhasil", "Issue berhasil dihapus", "success");
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menghapus issue", "error");
    }
  };

  const getPriorityBadge = (prioritas) => {
    switch (prioritas) {
      case "KRITIS":
        return "danger";
      case "TINGGI":
        return "warning";
      case "SEDANG":
        return "info";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DONE":
        return "success";
      case "PROGRESS":
        return "primary";
      case "CANCEL":
        return "dark";
      default:
        return "secondary";
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Monitoring Fokus Direksi</h6>
      </div>

      <div className="card-body">
        <button
          className="btn btn-primary mb-3"
          onClick={() => navigate("/supervisi/MonitoringDireksiIssue/Form")}
        >
          + Tambah Issue
        </button>

        <br />

        {loading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr className="text-center">
                  <th>Judul</th>
                  <th>Prioritas</th>
                  <th>PIC</th>
                  <th>Status</th>
                  <th>Fokus</th>
                  <th>Plan</th>
                  <th width="180">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      Belum ada data
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.direksi_issue_id}>
                      <td>
                        <strong>{item.judul}</strong>
                      </td>
                      <td>
                        <Badge bg={getPriorityBadge(item.prioritas)}>
                          {item.prioritas}
                        </Badge>
                      </td>
                      <td>{item.pic}</td>
                      <td>
                        <Badge bg={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td>
                        {item.is_fokus_hari_ini === 1 ? (
                          <Badge bg="danger">Fokus</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{item.total_plan}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() =>
                              navigate(
                                `/supervisi/MonitoringDireksiIssue/Detail/${item.direksi_issue_id}`,
                              )
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() =>
                              navigate(
                                `/supervisi/MonitoringDireksiIssue/Form/${item.direksi_issue_id}`,
                              )
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(item.direksi_issue_id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDireksiIssue;
