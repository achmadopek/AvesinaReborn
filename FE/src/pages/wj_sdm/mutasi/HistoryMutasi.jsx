import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getHistoryMutasi,
  fetchMutasiById,
} from "../../../api/wj_sdm/MutasiPegawai";
import { formatDateInput } from "../../../utils/FormatDate";
import Modal from "react-bootstrap/Modal";

const HistoryMutasi = ({ pegId: propPegId }) => {
  const { peg_id: authPegId } = useAuth();
  const [activePegId, setActivePegId] = useState(propPegId || authPegId);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [historyMutasi, setHistoryMutasi] = useState([]);
  const [detailMutasi, setDetailMutasi] = useState(null);

  // Sinkronisasi pegId prop
  useEffect(() => {
    setActivePegId(propPegId || authPegId);
  }, [propPegId, authPegId]);

  // Ambil data mutasi berdasarkan pegId aktif
  useEffect(() => {
    if (!activePegId) return;

    setLoading(true);
    getHistoryMutasi(activePegId)
      .then((data) => setHistoryMutasi(data))
      .catch((err) => {
        console.error("Gagal ambil history mutasi:", err);
        setHistoryMutasi([]);
      })
      .finally(() => setLoading(false));
  }, [activePegId]);

  const handleShowDetail = async (id) => {
    try {
      const data = await fetchMutasiById(id);
      if (data) {
        setDetailMutasi(data);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Gagal ambil detail mutasi:", err);
    }
  };

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">History Mutasi</h6>
        </div>
        <div className="card-body px-3 py-2">
          {loading ? (
            <div>Loading history...</div>
          ) : historyMutasi.length === 0 ? (
            <div className="text-center text-muted-theme">
              Belum Ada History Mutasi
            </div>
          ) : (
            historyMutasi.map((item, i) => (
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
                    Tgl: {formatDateInput(item.tgl_mutasi)}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4">Unit</div>
                  <div className="col-8 text-muted-theme text-right">
                    {item.nama_unit}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4">
                    <strong>Jab.</strong>
                  </div>
                  <div className="col-8 text-muted-theme text-right">
                    <strong>{item.jabatan}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {showModal && detailMutasi && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-sae text-light">
            <Modal.Title>Detail Mutasi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <table className="table table-theme table-bordered table-sm">
              <tbody>
                <tr>
                  <th style={{ width: "40%" }}>Nama Pegawai</th>
                  <td>{detailMutasi.nama_pegawai || "-"}</td>
                </tr>
                <tr>
                  <th>Jabatan</th>
                  <td>{detailMutasi.jabatan || "-"}</td>
                </tr>
                <tr>
                  <th>Unit Mutasi</th>
                  <td>{detailMutasi.unit_nm || "-"}</td>
                </tr>
                <tr>
                  <th>Tanggal</th>
                  <td>{formatDateInput(detailMutasi.mutation_dt)}</td>
                </tr>
                <tr>
                  <th>Validasi Oleh</th>
                  <td>{detailMutasi.validated_by_username || "-"}</td>
                </tr>
                <tr>
                  <th>Verifikasi Oleh</th>
                  <td>{detailMutasi.verified_by_username || "-"}</td>
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

export default HistoryMutasi;
