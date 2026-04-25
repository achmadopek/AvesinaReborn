import { useEffect, useState } from "react";
import {
    fetchPaginatedData,
    deleteInstalasi
} from "../../api/admin/MasterInstalasiSPM";

import InstalasiSPMModal from "./InstalasiSPMModal";

const MasterInstalasiSPM = ({ limit = 10 }) => {

    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchKode, setSearchKode] = useState('');
    const [searchNama, setSearchNama] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const loadData = async () => {

        try {

            const res = await fetchPaginatedData(
                page,
                limit,
                searchKode,
                searchNama
            );

            setData(res.data);
            setTotalPages(res.totalPages);

        } catch (err) {
            console.error(err);
        }

    };

    useEffect(() => {
        loadData();
    }, [page, searchKode, searchNama]);

    const handleEdit = (row) => {
        setEditData(row);
        setShowModal(true);
    };

    const handleDelete = async (id) => {

        if (!confirm("Hapus instalasi ini?")) return;

        await deleteInstalasi(id);
        loadData();

    };

    return (
        <>
            <InstalasiSPMModal
                show={showModal}
                editData={editData}
                onClose={() => {
                    setShowModal(false);
                    setEditData(null);
                }}
                onSuccess={loadData}
            />

            <div className="card shadow-sm">

                <div className="card-header py-2 px-3">
                    <h6 className="mb-0">Master Instalasi SPM</h6>
                </div>

                <div className="card-body px-3 py-2">

                    {/* FILTER */}
                    <div className="mb-3 d-flex align-items-end gap-2 flex-wrap">

                        <div style={{ minWidth: 180 }}>
                            <label>Kode Instalasi</label>

                            <input
                                className="form-control form-control-sm"
                                placeholder="Kode instalasi"
                                value={searchKode}
                                onChange={(e) => setSearchKode(e.target.value)}
                            />
                        </div>

                        <div style={{ minWidth: 220 }}>
                            <label>Nama Instalasi</label>

                            <input
                                className="form-control form-control-sm"
                                placeholder="Nama instalasi"
                                value={searchNama}
                                onChange={(e) => setSearchNama(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setPage(1);
                                loadData();
                            }}
                        >
                            Cari
                        </button>

                        <button
                            className="btn btn-success ms-auto"
                            onClick={() => setShowModal(true)}
                        >
                            + Tambah
                        </button>

                    </div>

                    {/* TABLE */}
                    <div className="table-responsive">

                        <table className="table table-bordered table-sm">

                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode</th>
                                    <th>Nama</th>
                                    <th>Bidang</th>
                                    <th>Kepala</th>
                                    <th>PIC Instalasi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody>

                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                )}

                                {data.map((row, i) => (
                                    <tr key={row.id}>
                                        <td>{(page - 1) * limit + i + 1}</td>
                                        <td>{row.kode_instalasi}</td>
                                        <td>{row.nama_instalasi}</td>
                                        <td>{row.nama_bidang}</td>
                                        <td>{row.kepala_instalasi_nama || '-'}</td>
                                        <td>{row.user_instalasi_nama || '-'}</td>

                                        <td>
                                            <button
                                                className="btn btn-sm btn-warning me-1"
                                                onClick={() => handleEdit(row)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(row.id)}
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-2">

                        <div>Page {page} / {totalPages}</div>

                        <div>
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </button>

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>

                    </div>

                </div>

            </div>
        </>
    );

};

export default MasterInstalasiSPM;