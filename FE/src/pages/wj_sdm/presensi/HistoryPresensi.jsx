import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getHistoryPresensi,
  fetchPresensiById,
} from "../../../api/wj_sdm/PresensiPegawai";
import { formatNumber } from "../../../utils/FormatNumber";
import { formatDateToPeriode } from "../../../utils/FormatDate";
import Modal from "react-bootstrap/Modal";

const HistoryPresensi = ({ pegId: propPegId }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [historyPresensi, setHistoryPresensi] = useState([]);
  const [detailPresensi, setDetailPresensi] = useState(null);

  // Update activePegId jika props berubah
  const { peg_id: authPegId } = useAuth();
  const pegId = propPegId || authPegId;

  useEffect(() => {
    if (!pegId) return;

    setLoading(true);
    getHistoryPresensi(pegId)
      .then((data) => {
        setHistoryPresensi(data);
      })
      .catch((err) => {
        console.error("Gagal ambil history Presensi:", err);
        setHistoryPresensi([]);
      })
      .finally(() => setLoading(false));
  }, [pegId]);

  const handleShowDetail = async (id) => {
    try {
      const data = await fetchPresensiById(id);
      if (data) {
        setDetailPresensi(data);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Gagal ambil detail presensi:", err);
    }
  };

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">History Presensi</h6>
        </div>
        <div className="card-body px-3 py-2">
          {loading ? (
            <div>Loading history...</div>
          ) : historyPresensi.length === 0 ? (
            <div className="text-center text-muted-theme">
              Belum Ada History Presensi
            </div>
          ) : (
            historyPresensi.map((item, i) => (
              <div key={i} className="border p-2 mb-2">
                <div className="row mb-2">
                  <div className="col-4 fw-bold text-left">
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleShowDetail(item.id)}
                    >
                      Rincian
                    </button>
                  </div>
                  <div className="col-8 text-muted-theme fw-bold text-right">
                    Periode: {formatDateToPeriode(item.periode)}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4">Alpha</div>
                  <div className="col-8 text-muted-theme text-right">
                    {item.prosentase_alpha} %
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4">
                    <strong>Potong</strong>
                  </div>
                  <div className="col-8 text-muted-theme text-right">
                    <strong>Rp {formatNumber(Number(item.nilai))}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {showModal && detailPresensi && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-sae text-light">
            <Modal.Title>Detail Presensi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <table className="table table-theme table-bordered table-sm">
              <tbody>
                <tr>
                  <th style={{ width: "40%" }}>Nama Pegawai</th>
                  <td>{detailPresensi.pegawai?.nama_pegawai || "-"}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>{detailPresensi.pegawai?.employee_sts || "-"}</td>
                </tr>
                <tr>
                  <th>Periode</th>
                  <td>{formatDateToPeriode(detailPresensi.periode)}</td>
                </tr>
                <tr>
                  <th>Alpha</th>
                  <td>{detailPresensi.prosentase_alpha} %</td>
                </tr>
                <tr>
                  <th>Nilai</th>
                  <td>Rp. {formatNumber(detailPresensi.nilai)}</td>
                </tr>
                <tr>
                  <th>Validasi Oleh</th>
                  <td>{detailPresensi.validated_by_name || "-"}</td>
                </tr>
                <tr>
                  <th>Verifikasi Oleh</th>
                  <td>{detailPresensi.verified_by_name || "-"}</td>
                </tr>
              </tbody>
            </table>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default HistoryPresensi;
