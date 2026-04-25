import { useEffect, useState } from "react";
import {
  fetchPegawaiById,
  updateRekening,
  createRekening,
  validityRekening,
} from "../../../../api/wj_thp/MasterKeuangan";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

import { useNotification } from "../../../../context/NotificationContext";

const RekeningPegawai = ({ item, form, fetchData, setForm }) => {
  // State data pegawai dan loading
  const [pegawai, setPegawai] = useState(null);
  const [loading, setLoading] = useState(false);

  // State modal
  const [showRekeningModal, setShowRekeningModal] = useState(false);
  const [formMode, setFormMode] = useState("create"); // atau 'edit'

  const { role, peg_id, peg_id: verifierId } = useAuth();
  const { notificationCount, loadNotificationCount } = useNotification();

  const fetchDetail = async () => {
    if (!item?.id) return;
    setLoading(true);
    try {
      const data = await fetchPegawaiById(item.id);
      setPegawai(data);
    } catch (error) {
      console.error("Gagal mengambil detail pegawai:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ambil detail pegawai setiap kali item berubah
  useEffect(() => {
    fetchDetail();
  }, [item]);

  // Buka modal edit akun user
  const handleOpenEdit = (rekening) => {
    setFormMode("edit");
    setRekeningForm(rekening);
    setShowRekeningModal(true);
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setRekeningForm({
      rek_number: "",
      rek_name: "",
      bank_name: "",
      bank_code: "",
      description: "",
    });
    setShowRekeningModal(true);
  };

  const rekenings = pegawai?.rekenings || [];

  const [rekeningForm, setRekeningForm] = useState({
    rek_number: "",
    rek_name: "",
    bank_name: "",
    bank_code: "",
    description: "",
  });

  const handleChangeRekening = (e) => {
    const { name, value } = e.target;
    setRekeningForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRekening = async () => {
    try {
      // Ganti dengan API create rekening
      await createRekening({
        peg_id: item.id,
        verified_by: verifierId,
        ...rekeningForm,
      });

      toast.success("Rekening berhasil ditambahkan.");
      setShowRekeningModal(false);

      // Optional: reload data rekening pegawai
      const updated = await fetchPegawaiById(item.id);
      setPegawai(updated);

      loadNotificationCount();
    } catch (error) {
      console.error(
        "Gagal tambah rekening:",
        error.response?.data || error.message
      );
      toast.error("Terjadi kesalahan saat menyimpan rekening.");
    }
  };

  const handleUpdateRekening = async () => {
    try {
      await updateRekening(rekeningForm.id, {
        rek_number: rekeningForm.rek_number,
        rek_name: rekeningForm.rek_name,
        bank_name: rekeningForm.bank_name,
        bank_code: rekeningForm.bank_code,
        description: rekeningForm.description,
        status: rekeningForm.status || "Aktif", // Default jika belum ada
        verified_by: verifierId || null,
      });

      toast.success("Rekening berhasil diperbarui.");
      setShowRekeningModal(false);

      // Reload data pegawai
      const updated = await fetchPegawaiById(pegawai.id);
      setPegawai(updated);
    } catch (error) {
      console.error(
        "Gagal update rekening:",
        error.response?.data || error.message
      );
      toast.error("Terjadi kesalahan saat memperbarui rekening.");
    }
  };

  const handleValidity = async () => {
    if (!rekeningForm?.id) {
      toast.error("Rekening tidak ditemukan.");
      return;
    }

    try {
      await validityRekening(rekeningForm.id, peg_id);
      toast.success("Data berhasil divalidasi");
      fetchDetail();
      setShowRekeningModal(false); // tutup modal setelah validasi
    } catch (err) {
      console.error(err);
      toast.error("Gagal memvalidasi data");
    }
  };

  // Fungsi untuk membatalkan verifikasi data pegawai
  const handleCancelValidity = async () => {
    if (!rekeningForm?.rek_validation_by) return;

    //if (rekeningForm?.rek_validation_by) {
    //toast.info("Data sudah divalidasi dan tidak dapat dibatalkan verifikasinya.");
    //return;
    //}
    try {
      await validityRekening(rekeningForm.id, null);
      toast.success("Validasi dibatalkan");
      fetchDetail();
      setShowRekeningModal(false); // tutup modal setelah validasi
    } catch (err) {
      console.error("Batal validasi error:", err);
      toast.error("Gagal membatalkan validasi");
    }
  };

  if (loading) return <div>Memuat data pegawai...</div>;
  if (!pegawai)
    return <div className="text-muted-theme-theme">Tidak ada data pegawai.</div>;

  return (
    <>
      {/* Informasi Akun User */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Rekening Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          {rekenings.length > 0 ? (
            rekenings.map((rekening) => (
              <div key={rekening.id} className="mb-3 border-bottom pb-2">
                <div className="row mb-2">
                  <div className="col-4 fw-bold">No Rek.</div>
                  <div className="col-8 text-muted-theme">{rekening.rek_number}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">A/N</div>
                  <div className="col-8 text-muted-theme text-capitalize">
                    {rekening.rek_name}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Ket.</div>
                  <div className="col-8 text-muted-theme text-capitalize">
                    {rekening.description}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Status Rek</div>
                  <div className="col-8 text-muted-theme text-capitalize">
                    {rekening.status}
                  </div>
                </div>
                <div className="row mb-2 align-items-center">
                  <div className="col-4 fw-bold">Ver-Val</div>
                  <div className="col-3 text-muted-theme text-capitalize">
                    {rekening.rek_verification_by ? (
                      <span style={{ color: "green", fontSize: "8pt" }}>
                        ✅
                      </span>
                    ) : (
                      <span style={{ color: "red", fontSize: "8pt" }}>❌</span>
                    )}
                    -
                    {rekening.rek_validation_by ? (
                      <span style={{ color: "green", fontSize: "8pt" }}>
                        ✅
                      </span>
                    ) : (
                      <span style={{ color: "red", fontSize: "8pt" }}>❌</span>
                    )}
                  </div>
                  <div className="col-5 d-flex justify-content-end">
                    <button
                      className="btn btn-outline-success btn-sm me-2"
                      onClick={() => handleOpenEdit(rekening)}
                    >
                      Kelola
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="text-muted-theme-theme">Belum memiliki Rekening</div>
            </>
          )}
          <div className="mb-3 mt-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={handleOpenCreate}
            >
              Tambah Rekening
            </button>
          </div>
        </div>
      </div>

      {showRekeningModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div
                className={`modal-header ${formMode === "create" ? "bg-primary" : "bg-success"
                  } text-white`}
              >
                <h5 className="modal-title">
                  {formMode === "create"
                    ? "Tambah Rekening Pegawai"
                    : "Ubah Rekening Pegawai"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowRekeningModal(false)}
                />
              </div>

              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Nomor Rekening</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="rek_number"
                      value={rekeningForm.rek_number || ""}
                      onChange={handleChangeRekening}
                      required
                      disabled={formMode === "edit"} // Optional: disable rek_number saat edit
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="rek_name"
                      value={rekeningForm.rek_name || ""}
                      onChange={handleChangeRekening}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nama Bank</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="bank_name"
                      value={rekeningForm.bank_name || ""}
                      onChange={handleChangeRekening}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Kode Bank</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="bank_code"
                      value={rekeningForm.bank_code || ""}
                      onChange={handleChangeRekening}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Keterangan</label>
                    <textarea
                      className="form-control form-control-sm"
                      name="description"
                      value={rekeningForm.description || ""}
                      onChange={handleChangeRekening}
                    />
                  </div>
                </form>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowRekeningModal(false)}
                >
                  Batal
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={
                    formMode === "create"
                      ? handleSubmitRekening
                      : handleUpdateRekening
                  }
                >
                  {formMode === "create"
                    ? "Simpan Rekening"
                    : "Perbarui Rekening"}
                </button>

                {role === "keuangan" &&
                  rekeningForm?.rek_verification_by &&
                  !rekeningForm?.rek_validation_by && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning"
                      onClick={handleValidity}
                    >
                      Validasi
                    </button>
                  )}

                {role === "keuangan" &&
                  rekeningForm?.rek_verification_by &&
                  rekeningForm?.rek_validation_by && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleCancelValidity}
                    >
                      Batal Validasi
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RekeningPegawai;
