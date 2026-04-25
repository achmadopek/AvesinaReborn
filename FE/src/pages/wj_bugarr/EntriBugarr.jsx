import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { saveBugarr, getElemenBugarr, getRuangan } from "../../api/wj_bugarr/MonitoringBugarr";

const EntriBugarr = () => {

    const [tanggal, setTanggal] = useState("");
    const [ruangan, setRuangan] = useState("");
    const [listRuangan, setListRuangan] = useState([]);
    const [elemen, setElemen] = useState([]);

    const [foto, setFoto] = useState({});
    const [keterangan, setKeterangan] = useState({});

    const [saving, setSaving] = useState(false);

    // ==========================
    // LOAD MASTER
    // ==========================

    useEffect(() => {

        const loadData = async () => {

            try {

                const el = await getElemenBugarr();
                const rg = await getRuangan();

                setElemen(el.data || []);
                setListRuangan(rg.data || []);

            } catch {
                toast.error("Gagal load master data");
            }

        };

        loadData();

    }, []);

    // ==========================
    // HANDLE FOTO
    // ==========================

    const handleFoto = (kode, file) => {

        setFoto({
            ...foto,
            [kode]: file
        });

    };

    // ==========================
    // HANDLE KETERANGAN
    // ==========================

    const handleKet = (kode, val) => {

        setKeterangan({
            ...keterangan,
            [kode]: val
        });

    };

    // ==========================
    // SAVE
    // ==========================
    const handleSave = async () => {

        if (!tanggal) {
            toast.warning("Tanggal laporan wajib diisi");
            return;
        }

        if (!ruangan) {
            toast.warning("Ruangan wajib dipilih");
            return;
        }

        try {

            setSaving(true);

            const formData = new FormData();

            formData.append("tanggal_laporan", tanggal);
            formData.append("id_ruangan", ruangan);

            // ====================
            // LOOP ELEMEN
            // ====================

            elemen.forEach((el) => {

                const key = el.kode.toLowerCase();

                if (foto[key]) {
                    formData.append(key, foto[key]);
                }

                formData.append(`keterangan[${key}]`, keterangan[key] || "");

            });

            await saveBugarr(formData);

            toast.success("Laporan BUGARR berhasil disimpan");

            console.log(formData);

            setFoto({});
            setKeterangan({});

        } catch (err) {

            console.error(err);
            toast.error("Gagal menyimpan laporan");

        } finally {

            setSaving(false);

        }
    };

    return (
        <div className="card shadow-sm">

            <div className="card-header py-2 px-3">
                <h6 className="mb-0">Upload Laporan BUGARR</h6>
            </div>

            <div className="card-body">

                {/* HEADER */}
                <div className="row mb-4">

                    <div className="col-md-4">
                        <label className="form-label">Ruangan</label>
                        <select
                            className="form-control form-control-sm"
                            value={ruangan}
                            onChange={(e) => setRuangan(e.target.value)}
                        >
                            <option value="">Pilih Ruangan</option>
                            {listRuangan.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.nama_ruangan}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                        />
                    </div>

                </div>

                {/* DETAIL ELEMEN */}

                <div className="table-responsive">
                    <table className="table table-bordered">

                        <thead className="table-light">
                            <tr>
                                <th width="200">Elemen</th>
                                <th width="250">Foto</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>

                        <tbody>

                            {elemen.map((el) => {

                                const key = el.kode.toLowerCase();

                                return (

                                    <tr key={el.id}>

                                        <td>
                                            <strong>{el.nama}</strong>
                                        </td>

                                        <td>

                                            <input
                                                type="file"
                                                className="form-control form-control-sm"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleFoto(key, e.target.files[0])
                                                }
                                            />

                                        </td>

                                        <td>

                                            <textarea
                                                className="form-control form-control-sm"
                                                rows="2"
                                                placeholder="Keterangan..."
                                                value={keterangan[key] || ""}
                                                onChange={(e) =>
                                                    handleKet(key, e.target.value)
                                                }
                                            />

                                        </td>

                                    </tr>

                                );

                            })}

                        </tbody>

                    </table>
                </div>

            </div>

            <div className="card-footer text-end">

                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Menyimpan..." : "Simpan Laporan"}
                </button>

            </div>

        </div>
    );
};

export default EntriBugarr;