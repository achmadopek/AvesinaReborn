import { useEffect, useState } from "react";
import { searchMasterUnit, createUnit, updateUnit } from "../../api/admin/MasterUnitSPM";

import SearchSelectPegawai from "../../components/search/SearchSelectPegawai";
import SearchSelectBidang from "../../components/search/SearchSelectBidang";
import SearchSelectInstalasi from "../../components/search/SearchSelectInstalasi";
import SearchSelectGroupPelayanan from "../../components/search/SearchSelectGroupPelayanan";

const UnitSPMModal = ({ show, onClose, onSuccess, editData }) => {

    const defaultForm = {
        bidang_id: null,
        bidang_option: null,

        instalasi_id: null,
        instalasi_option: null,

        group_pelayanan_id: [],   // array
        group_option: [],         // multi select

        srvc_unit_id: "",
        nama_unit: "",
        kode_unit: "",

        kepala_unit: null,
        kepala_unit_option: null,

        status: 1 // default aktif
    };

    const [form, setForm] = useState(defaultForm);

    const [masterOptions, setMasterOptions] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const isEdit = !!editData;

    useEffect(() => {

        if (editData) {

            setForm({
                ...editData,

                bidang_option: editData.bidang_id
                    ? {
                        value: editData.bidang_id,
                        label: `${editData.kode_bidang || ''} - ${editData.nama_bidang || ''}`
                    }
                    : null,

                instalasi_option: editData.instalasi_id
                    ? {
                        value: editData.instalasi_id,
                        label: `${editData.kode_instalasi || ''} - ${editData.nama_instalasi || ''}`
                    }
                    : null,

                group_option: editData.group_pelayanan
                    ? editData.group_pelayanan.map(g => ({
                        value: g.id,
                        label: `${g.kode_group || ''} - ${g.nama_group || ''}`
                    }))
                    : [],

                group_pelayanan_id: editData.group_pelayanan
                    ? editData.group_pelayanan.map(g => g.id)
                    : [],

                kepala_unit_option: editData.kepala_unit
                    ? {
                        value: editData.kepala_unit,
                        label: editData.kepala_unit_nama
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

    const handleSearch = async (value) => {

        setSearch(value);

        if (value.length < 2) return;

        const res = await searchMasterUnit(value);

        setMasterOptions(res);

    };

    const handleSelectMaster = (unit) => {

        setForm({
            ...form,
            srvc_unit_id: unit.srvc_unit_id,
            kode_unit: unit.service_unit_code,
            nama_unit: unit.srvc_unit_nm
        });

        setSearch(`${unit.service_unit_code} - ${unit.srvc_unit_nm}`);
        setMasterOptions([]);

    };

    const handleSubmit = async () => {

        try {

            setLoading(true);

            const payload = {
                bidang_id: form.bidang_id || 0,
                instalasi_id: form.instalasi_id || 0,
                group_pelayanan_id: form.group_pelayanan_id || [],
                srvc_unit_id: form.srvc_unit_id,
                nama_unit: form.nama_unit,
                kode_unit: form.kode_unit,
                kepala_unit: form.kepala_unit,
                status: form.status
            };

            if (isEdit) {
                await updateUnit(editData.id, payload);
            } else {
                await createUnit(payload);
            }

            onSuccess();
            onClose();

        } catch (err) {

            console.error(err);
            alert("Gagal menyimpan");

        } finally {

            setLoading(false);

        }

    };

    if (!show) return null;

    return (

        <div className="modal d-block" style={{ background: "#00000066" }}>

            <div className="modal-dialog">

                <div className="modal-content">

                    <div className="modal-header py-2">

                        <h6 className="mb-0">
                            {isEdit ? "Edit Unit SPM" : "Tambah Unit SPM"}
                        </h6>

                        <button
                            className="btn-close"
                            onClick={handleClose}
                        />

                    </div>

                    <div className="modal-body">

                        {/* SEARCH MASTER UNIT */}

                        {!isEdit && (
                            <div className="mb-3 position-relative">

                                <label>Cari Master Unit</label>

                                <input
                                    className="form-control form-control-sm"
                                    placeholder="ketik nama unit..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />

                                {masterOptions.length > 0 && (

                                    <div
                                        className="border bg-white position-absolute w-100"
                                        style={{ zIndex: 10, maxHeight: 200, overflowY: "auto" }}
                                    >

                                        {masterOptions.map(u => (

                                            <div
                                                key={u.srvc_unit_id}
                                                className="p-2 border-bottom hover-pointer"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleSelectMaster(u)}
                                            >

                                                {u.service_unit_code} - {u.srvc_unit_nm}

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>
                        )}

                        {/* KODE UNIT */}

                        <div className="mb-2">

                            <label>Kode Unit</label>

                            <input
                                className="form-control form-control-sm"
                                value={form.kode_unit}
                                onChange={(e) =>
                                    setForm({ ...form, kode_unit: e.target.value })
                                }
                            />

                        </div>

                        {/* NAMA UNIT */}

                        <div className="mb-2">

                            <label>Nama Unit</label>

                            <input
                                className="form-control form-control-sm"
                                value={form.nama_unit}
                                onChange={(e) =>
                                    setForm({ ...form, nama_unit: e.target.value })
                                }
                            />

                        </div>

                        {/* CARI BIDANG */}
                        <div className="mb-3">

                            <label>Bidang</label>

                            <SearchSelectBidang
                                value={form.bidang_option}
                                onChange={(val) =>
                                    setForm({
                                        ...form,
                                        bidang_id: val ? val.value : null,
                                        bidang_option: val,
                                        instalasi_id: null,
                                        instalasi_option: null
                                    })
                                }
                            />

                        </div>

                        {/* CARI INSTALASI */}
                        <div className="mb-3">

                            <label>Instalasi</label>

                            <SearchSelectInstalasi
                                value={form.instalasi_option}
                                bidangId={form.bidang_id}
                                isDisabled={!form.bidang_id}
                                onChange={(val) =>
                                    setForm({
                                        ...form,
                                        instalasi_id: val ? val.value : null,
                                        instalasi_option: val
                                    })
                                }
                            />

                        </div>

                        {/* CARI GROUP PELAYANAN */}
                        <div className="mb-3">

                            <label>Group Pelayanan</label>

                            <SearchSelectGroupPelayanan
                                isMulti
                                value={form.group_option}
                                onChange={(vals) =>
                                    setForm({
                                        ...form,
                                        group_pelayanan_id: vals ? vals.map(v => v.value) : [],
                                        group_option: vals || []
                                    })
                                }
                            />

                        </div>

                        {/* KEPALA UNIT */}
                        <div className="mb-2">

                            <label>Kepala Unit</label>

                            <SearchSelectPegawai
                                value={form.kepala_unit_option || null}
                                onChange={(selected) =>
                                    setForm({
                                        ...form,
                                        kepala_unit: selected ? selected.value : null,
                                        kepala_unit_option: selected,
                                    })
                                }
                                placeholder="Cari kepala unit..."
                            />

                        </div>

                        {/* STATUS UNIT */}
                        <div className="mb-3">

                            <label className="form-label d-block">Status Unit</label>

                            <div className="form-check form-check-inline">

                                <input
                                    type="radio"
                                    name="status"
                                    id="status_aktif"
                                    className="form-check-input"
                                    value={1}
                                    checked={form.status === 1}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            status: parseInt(e.target.value)
                                        })
                                    }
                                />

                                <label className="form-check-label ms-2" htmlFor="status_aktif">
                                    Aktif
                                </label>

                            </div>

                            <div className="form-check form-check-inline">

                                <input
                                    type="radio"
                                    name="status"
                                    id="status_nonaktif"
                                    className="form-check-input"
                                    value={0}
                                    checked={form.status === 0}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            status: parseInt(e.target.value)
                                        })
                                    }
                                />

                                <label className="form-check-label ms-2" htmlFor="status_nonaktif">
                                    Non Aktif
                                </label>

                            </div>

                        </div>

                    </div>

                    <div className="modal-footer py-2">

                        <button
                            className="btn btn-secondary"
                            onClick={handleClose}
                        >
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

export default UnitSPMModal;