import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getHistoryTHP, getDetailTHP } from "../../api/wj_thp/LaporanTHP";
import { formatNumber } from "../../utils/FormatNumber";
import { formatDateToPeriode, formatDateInput } from "../../utils/FormatDate";
import Modal from "react-bootstrap/Modal";

const HistoryTakeHomePay = ({ pegId: propPegId }) => {
  const { peg_id: authPegId } = useAuth();
  const [activePegId, setActivePegId] = useState(propPegId || authPegId);

  const [historyThp, setHistoryThp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailTHP, setDetailTHP] = useState({ penghasilan: [], potongan: [] });

  // Update pegId saat prop atau auth berubah
  useEffect(() => {
    setActivePegId(propPegId || authPegId);
  }, [propPegId, authPegId]);

  // Fetch data THP
  useEffect(() => {
    if (!activePegId) return;
    setLoading(true);

    getHistoryTHP(activePegId)
      .then((data) => setHistoryThp(data))
      .catch((err) => {
        console.error("Gagal ambil history THP:", err);
        setHistoryThp([]);
      })
      .finally(() => setLoading(false));
  }, [activePegId]);

  const handleShowDetail = async (peg_id, periode) => {
    try {
      const formattedPeriode =
        periode.length === 7 ? `${periode}-01` : formatDateInput(periode);
      const data = await getDetailTHP(peg_id, formattedPeriode);
      if (data) {
        setDetailTHP({
          penghasilan: Array.isArray(data.penghasilan) ? data.penghasilan : [],
          potongan: Array.isArray(data.potongan) ? data.potongan : [],
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error("Gagal ambil detail THP:", err);
    }
  };

  // Helper untuk menghitung jumlah total
  const total = (arr) => arr.reduce((sum, item) => sum + (item.nilai || 0), 0);

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">History Take Home Pay</h6>
        </div>
        <div className="card-body px-3 py-2">
          {loading ? (
            <div>Loading history...</div>
          ) : historyThp.length === 0 ? (
            <div className="text-center text-muted-theme">
              Belum Ada History Take Home Pay
            </div>
          ) : (
            historyThp.map((item, i) => (
              <div key={i} className="border p-2 mb-2">
                <div className="row mb-2">
                  <div className="col-5 fw-bold text-left">
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() =>
                        handleShowDetail(item.peg_id, item.periode)
                      }
                    >
                      Rincian
                    </button>
                  </div>
                  <div className="col-7 text-muted-theme fw-bold text-end">
                    Periode: {formatDateToPeriode(item.periode)}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-5 fw-bold">Penghasilan</div>
                  <div className="col-7 text-muted-theme text-end">
                    Rp {formatNumber(Number(item.total_penghasilan || 0))}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-5 fw-bold">Potongan</div>
                  <div className="col-7 text-muted-theme text-end">
                    Rp {formatNumber(Number(item.total_potongan || 0))}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-5 fw-bold">
                    <strong>My THP</strong>
                  </div>
                  <div className="col-7 text-muted-theme text-end">
                    <strong>Rp {formatNumber(Number(item.thp || 0))}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail THP */}
      {showModal && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-sae text-light">
            <Modal.Title>Detail Take Home Pay</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <table className="table table-theme table-sm">
              <thead>
                <tr>
                  <th>
                    <h4>PENGHASILAN</h4>
                  </th>
                  <th className="text-end">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {detailTHP.penghasilan.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.penghasilan_code}</td>
                    <td className="text-end">Rp {formatNumber(item.nilai)}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Jumlah</strong>
                  </td>
                  <td className="text-end">
                    <strong>
                      Rp {formatNumber(total(detailTHP.penghasilan))}
                    </strong>
                  </td>
                </tr>
              </tbody>

              <thead>
                <tr>
                  <th>
                    <h4>POTONGAN</h4>
                  </th>
                  <th className="text-end">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {detailTHP.potongan.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.potongan_code}</td>
                    <td className="text-end">Rp {formatNumber(item.nilai)}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Jumlah</strong>
                  </td>
                  <td className="text-end">
                    <strong>
                      Rp {formatNumber(total(detailTHP.potongan))}
                    </strong>
                  </td>
                </tr>
              </tbody>

              <thead>
                <tr>
                  <th colSpan={2}>
                    <h4>TAKE HOME PAY</h4>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <h1 className="text-center">
                      Rp{" "}
                      {formatNumber(
                        total(detailTHP.penghasilan) - total(detailTHP.potongan)
                      )}
                    </h1>
                    <i className="fa fa-info">
                      {" "}
                      Data ini bersifat pribadi dan rahasia.
                    </i>
                  </td>
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

export default HistoryTakeHomePay;
