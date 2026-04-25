import { useEffect, useState } from "react";
import {
    createInstalasi,
    updateInstalasi
} from "../../api/admin/MasterInstalasiSPM";

import SearchSelectBidang from "../../components/search/SearchSelectBidang";
import SearchSelectPegawai from "../../components/search/SearchSelectPegawai";

const InstalasiSPMModal = ({ show, onClose, onSuccess, editData }) => {

    const defaultForm = {
        bidang_id: null,
        bidang_option: null,

        nama_instalasi: "",
        kode_instalasi: "",

        user_instalasi: null,
        user_option: null,

        kepala_instalasi: null,
        kepala_option: null
    };

    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);

    const isEdit = !!editData;

    // =============================
    // INIT EDIT DATA
    // =============================
    useEffect(() => {

        if (editData) {

            setForm({
                bidang_id: editData.bidang_id || null,
                nama_instalasi: editData.nama_instalasi || "",
                kode_instalasi: editData.kode_instalasi || "",

                user_instalasi: editData.user_instalasi || null,
                kepala_instalasi: editData.kepala_instalasi || null,

                bidang_option: editData.bidang_id
                    ? {
                        value: editData.bidang_id,
                        label: `${editData.kode_bidang || ''} - ${editData.nama_bidang || ''}`
                    }
                    : null,

                user_option: editData.user_instalasi
                    ? {
                        value: editData.user_instalasi,
                        label: editData.user_instalasi_nama || `User ID: ${editData.user_instalasi}`
                    }
                    : null,

                kepala_option: editData.kepala_instalasi
                    ? {
                        value: editData.kepala_instalasi,
                        label: editData.kepala_instalasi_nama || `ID: ${editData.kepala_instalasi}`
                    }
                    : null
            });

        } else {
            setForm(defaultForm);
        }

    }, [editData]);

    const handleClose = () => {
        setForm(defaultForm);
        onClose();
    };

    // =============================
    // SUBMIT
    // =============================
    const handleSubmit = async () => {

        try {

            setLoading(true);

            const payload = {
                bidang_id: form.bidang_id,
                nama_instalasi: form.nama_instalasi,
                kode_instalasi: form.kode_instalasi,
                user_instalasi: form.user_instalasi,
                kepala_instalasi: form.kepala_instalasi
            };

            if (isEdit) {
                await updateInstalasi(editData.id, payload);
            } else {
                await createInstalasi(payload);
            }

            onSuccess();
            handleClose();

        } catch (err) {

            console.error(err);
            alert("Gagal simpan");

        } finally {

            setLoading(false);

        }

    };

    if (!show) return null;

    return (

        <div className="modal d-block" style={{ background: "#00000066" }}>

            <div className="modal-dialog">

                <div className="modal-content">

                    <div className="modal-header">
                        <h6>{isEdit ? "Edit Instalasi" : "Tambah Instalasi"}</h6>
                        <button className="btn-close" onClick={handleClose} />
                    </div>

                    <div className="modal-body">

                        {/* KODE */}
                        <label>Kode Instalasi</label>
                        <input
                            className="form-control form-control-smmb-2"
                            value={form.kode_instalasi}
                            onChange={(e) =>
                                setForm({ ...form, kode_instalasi: e.target.value })
                            }
                        />

                        {/* NAMA */}
                        <label>Nama Instalasi</label>
                        <input
                            className="form-control form-control-smmb-2"
                            value={form.nama_instalasi}
                            onChange={(e) =>
                                setForm({ ...form, nama_instalasi: e.target.value })
                            }
                        />

                        {/* USER */}
                        <label>User Instalasi</label>
                        <SearchSelectPegawai
                            value={form.user_option}
                            onChange={(val) =>
                                setForm({
                                    ...form,
                                    user_instalasi: val ? val.value : null,
                                    user_option: val
                                })
                            }
                        />

                        {/* BIDANG */}
                        <label>Bidang / Bagian</label>
                        <SearchSelectBidang
                            value={form.bidang_option}
                            onChange={(val) =>
                                setForm({
                                    ...form,
                                    bidang_id: val ? val.value : null,
                                    bidang_option: val
                                })
                            }
                        />

                        {/* KEPALA */}
                        <label>Kepala Instalasi</label>
                        <SearchSelectPegawai
                            value={form.kepala_option}
                            onChange={(val) =>
                                setForm({
                                    ...form,
                                    kepala_instalasi: val ? val.value : null,
                                    kepala_option: val
                                })
                            }
                        />

                    </div>

                    <div className="modal-footer">

                        <button className="btn btn-secondary" onClick={handleClose}>
                            Batal
                        </button>

                        <button
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default InstalasiSPMModal;