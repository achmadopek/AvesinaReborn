import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchSupervisiData } from "../../api/wj_supervisi/Supervisi";
import {
  formatDate,
  formatSortDate,
  formatSortDateTime,
} from "../../utils/FormatDate";

import { toast } from "react-toastify";

const MonitoringSupervisi = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState([]);

  // ==========================
  // LOAD DATA
  // ==========================

  const loadData = async () => {
    try {
      setLoading(true);

      const result = await fetchSupervisiData();

      if (result.success) {
        setRows(result.data || []);
      }
    } catch (err) {
      console.error(err);

      toast.error("Gagal mengambil data supervisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================
  // STATUS BADGE
  // ==========================

  const renderStatus = (status) => {
    let cls = "secondary";

    if (status === "OPEN") cls = "warning";
    if (status === "REVIEW") cls = "info";
    if (status === "FINAL") cls = "success";

    return <span className={`badge bg-${cls}`}>{status}</span>;
  };

  // ==========================
  // VIEW
  // ==========================

  return (
    <div className="card shadow-sm">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Monitoring Supervisi</h6>
      </div>

      <div className="card-body">
        <button
          className="btn btn-primary mb-3"
          onClick={() => navigate("/supervisi/MonitoringSupervisi/Form")}
        >
          + Supervisi Baru
        </button>

        <br />

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr className="text-center">
                <th width="50">No</th>

                <th width="140">Tanggal</th>

                <th>Periode Dari</th>

                <th>Periode Hingga</th>

                <th width="120">Status</th>

                <th width="120">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="text-center">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    Belum ada data
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((item, index) => (
                  <tr key={item.supervisi_id} className="text-center">
                    <td>{index + 1}</td>

                    <td>{formatSortDate(item.tanggal_supervisi)}</td>

                    <td>{formatSortDateTime(item.periode_awal)}</td>

                    <td>{formatSortDateTime(item.periode_akhir)}</td>

                    <td>{renderStatus(item.status)}</td>

                    <td>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() =>
                          navigate(
                            `/supervisi/MonitoringSupervisi/Detail/${item.supervisi_id}`,
                          )
                        }
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitoringSupervisi;
