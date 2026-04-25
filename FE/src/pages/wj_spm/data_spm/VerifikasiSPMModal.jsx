import Modal from "react-bootstrap/Modal";
import { useState, useEffect } from "react";
import { verifikasiSPMHarian } from "../../../api/wj_spm/VerifikasiSPM";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

const VerifikasiSPMModal = ({ show, onClose, data }) => {
  const [status, setStatus] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);

  const { peg_id, role } = useAuth();

  const isVerifier = role === "verifikator_spm";
  const isReadOnly = !isVerifier;

  useEffect(() => {
    if (data) {
      setStatus(data.status_verifikasi ?? null);
      setCatatan(data.catatan_verifikasi ?? "");
    }
  }, [data]);

  if (!data) return null;

  const getStatusLabel = (status) => {
    if (status === null) return "Belum diverifikasi";
    if (status === 1) return "Disetujui";
    if (status === 0) return "Ditolak";
    return "-";
  };

  const handleSubmit = async () => {
    if (status === null) return toast.warning("Pilih status verifikasi");

    setLoading(true);
    try {
      await verifikasiSPMHarian({
        harian_id: data.harian_id,
        status_verifikasi: status,
        catatan_verifikasi: catatan,
        verified_by: peg_id,
      });

      toast.success("Verifikasi berhasil");
      onClose(true);
    } catch {
      toast.error("Gagal verifikasi");
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={() => onClose(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Verifikasi SPM</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p><b>Tanggal:</b> {data.tanggal}</p>

        <div className="mb-2">
          <label className="d-block">Status</label>

          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="status_verifikasi"
              id="status_setuju"
              value={1}
              checked={status === 1}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStatus(val);
                if (val === 1) setCatatan("Ok");
              }}
              disabled={isReadOnly}
            />
            <label className="form-check-label" htmlFor="status_setuju">
              Disetujui
            </label>
          </div>

          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="status_verifikasi"
              id="status_tolak"
              value={0}
              checked={status === 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStatus(val);
                if (val === 0) setCatatan("Alasan ...");
              }}
              disabled={isReadOnly}
            />
            <label className="form-check-label" htmlFor="status_tolak">
              Ditolak
            </label>
          </div>
        </div>

        <div>
          <label>Catatan</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="alert alert-info mt-2">
          {getStatusLabel(data.status_verifikasi)}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button className="btn btn-secondary" onClick={() => onClose(false)}>
          Tutup
        </button>

        {isVerifier && (
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
            {data.status_verifikasi === null ? "Simpan Verifikasi" : "Update Verifikasi"}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default VerifikasiSPMModal;
