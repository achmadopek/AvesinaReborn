import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getHistoryKegiatan,
  fetchKegiatanById,
} from "../../../api/wj_sdm/KegiatanPegawai";
import { formatNumber } from "../../../utils/FormatNumber";
import { formatDateInput } from "../../../utils/FormatDate";
import Modal from "react-bootstrap/Modal";

const HistoryKegiatan = ({ pegId: propPegId }) => {
  const { peg_id: authPegId } = useAuth(); // dari auth context
  const pegId = propPegId || authPegId; // prioritaskan prop jika tersedia

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [historyKegiatan, setHistoryKegiatan] = useState([]);
  const [detailKegiatan, setDetailKegiatan] = useState({ pesertas: [] });

  useEffect(() => {
    if (!pegId) return;

    setLoading(true);
    getHistoryKegiatan(pegId)
      .then((data) => setHistoryKegiatan(data))
      .catch((err) => {
        console.error("Gagal ambil history THP:", err);
        setHistoryKegiatan([]);
      })
      .finally(() => setLoading(false));
  }, [pegId]);

  // Jika perlu dipastikan formatnya "YYYY-MM-DD"
  const handleShowDetail = async (id) => {
    try {
      const data = await fetchKegiatanById(id);

      if (data) {
        setDetailKegiatan({
          ...data,
          pesertas: Array.isArray(data.pesertas) ? data.pesertas : [],
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error("Gagal ambil detail Kegiatan:", err);
    }
  };

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">History Kegiatan</h6>
        </div>
        <div className="card-body px-3 py-2">
          {loading ? (
            <div>Loading history...</div>
          ) : historyKegiatan.length === 0 ? (
            <div className="text-center text-muted-theme">
              Belum Ada History Kegiatan
            </div>
          ) : (
            historyKegiatan.map((item, i) => (
              <div key={i} className="border p-2 mb-2">
                <div className="row mb-2">
                  <div className="col-4 fw-bold text-left">
                    <button
                      className="btn btn-outline-success btn-sm"
                      style={{}}
                      onClick={() => handleShowDetail(item.id)}
                    >
                      Rincian
                    </button>
                  </div>
                  <div className="col-8 text-muted-theme fw-bold text-right">
                    Tgl: {formatDateInput(item.tgl_kegiatan)}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fs-1">Kode</div>
                  <div className="col-8 text-muted-theme text-right">
                    {item.kode_kegiatan}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4">
                    <strong>Honor</strong>
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

      {showModal && detailKegiatan && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-sae text-light">
            <Modal.Title>Detail Kegiatan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {Array.isArray(detailKegiatan.pesertas) &&
              detailKegiatan.pesertas.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <table className="table table-theme table-bordered table-sm">
                    <tbody>
                      <tr>
                        <th style={{ width: "40%" }}>Nama Pegawai</th>
                        <td>{item.employee_nm}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>{item.employee_sts}</td>
                      </tr>
                      <tr>
                        <th style={{ width: "40%" }}>Nama Kegiatan</th>
                        <td>{detailKegiatan.event_nm}</td>
                      </tr>
                      <tr>
                        <th>Tanggal</th>
                        <td>{formatDateInput(detailKegiatan.event_dt)}</td>
                      </tr>
                      <tr>
                        <th>Lokasi</th>
                        <td>{detailKegiatan.location_nm}</td>
                      </tr>
                      <tr>
                        <th>Nilai</th>
                        <td>Rp. {formatNumber(item.nilai)}</td>
                      </tr>
                      <tr>
                        <th>Validasi Oleh</th>
                        <td>{detailKegiatan.validated_by_name || "-"}</td>
                      </tr>
                      <tr>
                        <th>Verifikasi Oleh</th>
                        <td>{detailKegiatan.verified_by_name || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
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

export default HistoryKegiatan;
