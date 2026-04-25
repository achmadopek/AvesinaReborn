import { useEffect, useState } from "react";
import { fetchPaginatedData, deleteUnit } from "../../api/admin/MasterUnitSPM";
import UnitSPMModal from "../admin/UnitSPMModal";

const MasterUnitSPM = ({ isMobile, limit = 10 }) => {

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

        if (!confirm("Nonaktifkan unit ini?")) return;

        await deleteUnit(id);

        loadData();

    };


    /* ===============================
     RENDER
    =============================== */

    return (

        <>
            <UnitSPMModal
                show={showModal}
                editData={editData}
                onClose={() => {
                    setShowModal(false);
                    setEditData(null);
                }}
                onSuccess={loadData}
            />


            <div className="card shadow-sm card-theme">

                <div className="card-header py-2 px-3">
                    <h6 className="mb-0">Master Unit SPM</h6>
                </div>

                <div className="card-body px-3 py-2">

                    {/* ===============================
                        FILTER / SEARCH
                    =============================== */}

                    <div className="mb-3 d-flex align-items-end gap-2 flex-wrap">

                        <div style={{ minWidth: 180 }}>
                            <label>Kode Unit</label>

                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Cari kode unit"
                                value={searchKode}
                                onChange={(e) => setSearchKode(e.target.value)}
                            />

                        </div>

                        <div style={{ minWidth: 220 }}>
                            <label>Nama Unit</label>

                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Cari nama unit"
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
                            + Tambah Unit
                        </button>

                    </div>

                    <hr />

                    {/* ===============================
                        TABLE DATA
                    =============================== */}

                    <div className="table-responsive">

                        <table className="table table-theme table-bordered table-sm">

                            <thead>

                                <tr>

                                    <th style={{ width: 50 }}>No</th>
                                    <th>Kode Unit</th>
                                    <th>Nama Unit</th>
                                    <th>Master Unit</th>
                                    <th>Kepala Unit</th>
                                    <th>Group Pelayanan</th>
                                    <th>Status</th>
                                    <th style={{ width: 120 }}>Aksi</th>

                                </tr>

                            </thead>

                            <tbody>

                                {data.length === 0 && (

                                    <tr>
                                        <td colSpan="7" className="text-center text-muted">
                                            Tidak ada data
                                        </td>
                                    </tr>

                                )}

                                {data.map((row, i) => (

                                    <tr key={row.id}>

                                        <td>{(page - 1) * limit + i + 1}</td>

                                        <td>{row.kode_unit}</td>

                                        <td>{row.nama_unit}</td>

                                        <td>
                                            {row.master_kode} - {row.master_unit_nama}
                                        </td>

                                        <td>{row.kepala_unit_nama || '-'}</td>

                                        <td>
                                            {row.group_pelayanan?.length > 0
                                                ? row.group_pelayanan.map(g => g.nama_group).join(", ")
                                                : "-"
                                            }
                                        </td>

                                        <td>

                                            {row.status === 1 ? (

                                                <span className="badge bg-success">
                                                    Aktif
                                                </span>

                                            ) : (

                                                <span className="badge bg-secondary">
                                                    Nonaktif
                                                </span>

                                            )}

                                        </td>

                                        <td>

                                            <div className="d-flex gap-1">

                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => handleEdit(row)}
                                                >
                                                    Edit
                                                </button>

                                                {row.status === 1 && (

                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(row.id)}
                                                    >
                                                        Nonaktif
                                                    </button>

                                                )}

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                    {/* ===============================
          PAGINATION
      =============================== */}

                    <div className="d-flex justify-content-between align-items-center mt-2">

                        <div>
                            Page {page} / {totalPages}
                        </div>

                        <div className="d-flex gap-1">

                            <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </button>

                            <button
                                className="btn btn-sm btn-outline-secondary"
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

export default MasterUnitSPM;