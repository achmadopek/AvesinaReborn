import { useContext, useEffect, useState } from "react";
import {
  fetchKegiatanById,
  addPeserta,
  updatePeserta,
  deletePeserta,
  searchPegawaiByName,
} from "../../../api/wj_sdm/KegiatanPegawai";
import { useAuth, AuthContext } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import AsyncSelect from "react-select/async";
import {
  formatNumber,
  parseNumber,
  extractRawNumber,
} from "../../../utils/FormatNumber";

const loadOptions = async (inputValue) => {
  if (!inputValue || inputValue.length < 3) return [];
  try {
    const results = await searchPegawaiByName(inputValue);
    return results.map((p) => ({
      value: p.id,
      label: `${p.employee_nm} - ${p.nip}`,
      pegawai: p,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const PesertaKegiatan = ({ item }) => {
  const [kegiatan, setKegiatan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPesertaModal, setShowPesertaModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formMode, setFormMode] = useState("create");

  const { peg_id: verifierId } = useAuth();
  const { role } = useContext(AuthContext);
  const [nilai, setNilai] = useState("");

  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedPegawai, setSelectedPegawai] = useState(null);

  const [pesertaForm, setPesertaForm] = useState({
    peg_id: "",
    employee_nm: "",
    jabatan: "",
    golongan: "",
    instansi: "",
    nip: "",
    nilai: "",
  });

  useEffect(() => {
    if (!item?.id) return;
    setLoading(true);
    fetchKegiatanById(item.id)
      .then((data) => setKegiatan(data))
      .catch((err) => console.error("Gagal mengambil detail kegiatan:", err))
      .finally(() => setLoading(false));
  }, [item]);

  const pesertas = kegiatan?.pesertas || [];

  const handleOpenDelete = (peserta) => {
    setPesertaForm(peserta);
    setShowDeleteConfirm(true);
  };

  const handleDeletePeserta = async () => {
    try {
      await deletePeserta(pesertaForm.id);
      toast.success(
        `Peserta kegiatan atasnama "${pesertaForm.employee_nm}" berhasil dihapus.`
      );
      const updated = await fetchKegiatanById(item.id);
      setKegiatan(updated);
    } catch (error) {
      console.error("Gagal hapus peserta:", error);
      toast.error("Terjadi kesalahan saat hapus peserta.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setPesertaForm({
      peg_id: "",
      employee_nm: "",
      jabatan: "",
      golongan: "",
      instansi: "",
      nip: "",
    });
    setSelectedOption(null);
    setSelectedPegawai(null);
    setShowPesertaModal(true);
  };

  const handleSelectChange = (option) => {
    setSelectedOption(option);
    if (option) {
      const p = option.pegawai;
      setSelectedPegawai(p);
      setPesertaForm({
        peg_id: p.id,
        employee_nm: p.employee_nm,
        jabatan: p.jabatan || "",
        golongan: p.golongan || "",
        instansi: p.instansi || "",
        nip: p.nip || "",
      });
    } else {
      setSelectedPegawai(null);
      setPesertaForm({
        peg_id: "",
        employee_nm: "",
        jabatan: "",
        golongan: "",
        instansi: "",
        nip: "",
      });
    }
  };

  const handleNilaiChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // hanya angka
    setNilai(raw);
  };

  const handleSavePesertaSubmit = async () => {
    if (!selectedPegawai) {
      toast.warning("Pilih pegawai dulu sebelum menyimpan peserta.");
      return;
    }
    const nilaiNumber = Number(extractRawNumber(nilai));
    if (nilaiNumber < 0) {
      toast.warning("Nilai tidak boleh kurang dari 0.");
      return;
    }

    try {
      if (formMode === "create") {
        await addPeserta({
          peg_id: selectedPegawai.id,
          event_id: item.id,
          nilai: nilaiNumber,
          verified_by: verifierId,
        });
        toast.success("Peserta berhasil ditambahkan.");
      } else if (formMode === "edit") {
        await updatePeserta(pesertaForm.id, {
          peg_id: selectedPegawai.id,
          event_id: item.id,
          nilai: nilaiNumber,
          verified_by: verifierId,
        });
        toast.success("Data peserta berhasil diperbarui.");
      }

      setShowPesertaModal(false);
      setSelectedPegawai(null);
      setSelectedOption(null);
      setNilai("");

      const updated = await fetchKegiatanById(item.id);
      setKegiatan(updated);
    } catch (error) {
      console.error(
        "Gagal simpan peserta:",
        error.response?.data || error.message
      );
      toast.error(
        "Terjadi kesalahan. " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleOpenEdit = (peserta) => {
    setFormMode("edit");
    setPesertaForm({
      id: peserta.id,
      peg_id: peserta.peg_id,
      employee_nm: peserta.employee_nm,
      jabatan: peserta.jabatan || "",
      golongan: peserta.golongan || "",
      instansi: peserta.instansi || "",
      nip: peserta.nip || "",
    });
    setNilai(formatNumber(peserta.nilai || "0"));

    setSelectedOption({
      value: peserta.peg_id,
      label: `${peserta.employee_nm} - ${peserta.nip}`,
      pegawai: {
        id: peserta.peg_id,
        employee_nm: peserta.employee_nm,
        jabatan: peserta.jabatan,
        golongan: peserta.golongan,
        instansi: peserta.instansi,
        nip: peserta.nip,
      },
    });

    setSelectedPegawai({
      id: peserta.peg_id,
      employee_nm: peserta.employee_nm,
      jabatan: peserta.jabatan,
      golongan: peserta.golongan,
      instansi: peserta.instansi,
      nip: peserta.nip,
    });

    setShowPesertaModal(true);
  };

  if (loading) return <div>Memuat data kegiatan...</div>;

  return (
    <>
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Peserta Kegiatan</h6>
        </div>
        <div className="card-body px-3 py-2">
          {pesertas.length > 0 ? (
            pesertas.map((peserta) => (
              <div key={peserta.id} className="mb-3 border-bottom pb-2">
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Nama</div>
                  <div className="col-8 text-muted-theme">{peserta.employee_nm}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Status</div>
                  <div className="col-8 text-muted-theme">{peserta.employee_sts}</div>
                </div>
                <div className="row mb-2 align-items-center">
                  <div className="col-4 fw-bold">Nilai</div>
                  <div className="col-8 text-muted-theme">
                    {formatNumber(peserta.nilai)}
                  </div>
                </div>
                {role !== "keuangan" && ( //munculkan selama bukan keuangan
                  <div className="row mb-4">
                    <div className="col-12 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleOpenEdit(peserta)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleOpenDelete(peserta)}
                        style={{ marginLeft: "10px" }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-muted-theme-theme">Belum ada peserta</div>
          )}
          {role !== "keuangan" && ( //munculkan selama bukan keuangan
            <div className="mb-3 mt-2">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleOpenCreate}
              >
                Tambah Peserta
              </button>
            </div>
          )}
        </div>
      </div>

      {showPesertaModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div
                className={`modal-header ${formMode === "create" ? "bg-primary" : "bg-success"
                  } text-white`}
              >
                <h5 className="modal-title">
                  {formMode === "create"
                    ? "Tambah Peserta Kegiatan"
                    : "Ubah Data Peserta"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPesertaModal(false)}
                />
              </div>

              <div className="modal-body">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSavePesertaSubmit();
                  }}
                >
                  <div className="mb-3">
                    <label className="form-label">Cari Nama Pegawai</label>
                    <AsyncSelect
                      cacheOptions
                      loadOptions={loadOptions}
                      defaultOptions
                      onChange={handleSelectChange}
                      value={selectedOption}
                      placeholder="Ketik nama pegawai..."
                      isClearable
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nilai (Rp)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={nilai ? formatNumber(nilai) : ""}
                      onChange={handleNilaiChange}
                      placeholder="Masukkan nominal rupiah"
                    />

                  </div>

                  <div className="modal-footer px-0">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPesertaModal(false)}
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn btn-outline-primary">
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Konfirmasi Hapus Peserta</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(false)}
                />
              </div>
              <div className="modal-body">
                <p>
                  Yakin ingin hapus Peserta kegiatan atas nama <br />
                  <strong>{pesertaForm.employee_nm}</strong> ?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={handleDeletePeserta}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PesertaKegiatan;
