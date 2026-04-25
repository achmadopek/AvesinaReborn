import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Keuangan = ({ setShowSidebar, isMobile, setShowRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
    const [openMenus, setOpenMenus] = useState({
        Keuangan: true,        // Main dropdown "Services"
        MasterAccounting: true,
        ImportGaji: true,
        PayrolPegawai: true,
        EnrollPegawai: true,        // Main dropdown "Services"
    });

    // Toggle a specific dropdown (menu, submenu, or sub-submenu)
    const toggleDropdown = (menu) => {
        setOpenMenus((prevState) => ({
            ...prevState,
            [menu]: !prevState[menu],  // Toggle the specific menu/submenu/sub-submenu
        }));
    };

    return (

        <div>
            {/* First-level Dropdown */}
            <li className="sidebar-item-x">
                <Link
                    to="#"
                    onClick={() => toggleDropdown('Keuangan')}
                    className="sidebar-link-x d-flex justify-content-between align-items-center"
                >
                    <div className="d-flex align-items-center">
                        <i className="fas fa-coins fa-fw me-2"></i> {/* Ikon Master */}
                        <span>Keuangan</span>
                    </div>
                    <i className={`fa ${openMenus.Keuangan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                </Link>

                {openMenus.Keuangan && (
                    <ul className="submenu">
                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown('MasterAccounting')}
                                className="submenu-link d-flex justify-content-between align-items-center"
                            >
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-calculator fa-md me-2"></i>
                                    <span>Master Akuntansi</span>
                                </div>
                                <i className={`fa ${openMenus.MasterAccounting ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}
                                ></i>
                            </Link>

                            {openMenus.MasterAccounting && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/thp/MasterKeuangan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Rekening Pegawai</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/thp/KomponenPenghasilan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Komponen Penghasilan</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/thp/KomponenPotongan`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Komponen Potongan</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown('ImportGaji')}
                                className="submenu-link d-flex justify-content-between align-items-center"
                            >
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-file-excel fa-md me-2"></i>
                                    <span>Import Penghasilan</span>
                                </div>
                                <i className={`fa ${openMenus.ImportGaji ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}
                                ></i>
                            </Link>

                            {openMenus.ImportGaji && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/thp/ImportGajiPegawai`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Import Gaji</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/thp/ImportJPJMPegawai`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Import JPJM</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown('PayrolPegawai')}
                                className="submenu-link d-flex justify-content-between align-items-center"
                            >
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-cash-register fa-md me-2"></i>
                                    <span>Payroll Pegawai</span>
                                </div>
                                <i
                                    className={`fa ${openMenus.PayrolPegawai ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}
                                ></i>
                            </Link>

                            {openMenus.PayrolPegawai && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/thp/PenghasilanPegawai`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Penghasilan Pegawai</span>
                                        </Link>
                                    </li>
                                    <li className="submenu-item">
                                        <Link to={`/thp/PotonganPegawai`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Potongan Pegawai</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link
                                to="#"
                                onClick={() => toggleDropdown('EnrollPegawai')}
                                className="submenu-link d-flex justify-content-between align-items-center"
                            >
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-wallet fa-md me-2"></i>
                                    <span>Enroll Pegawai</span>
                                </div>
                                <i
                                    className={`fa ${openMenus.EnrollPegawai ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}
                                ></i>
                            </Link>

                            {openMenus.EnrollPegawai && (
                                <ul className="submenu">
                                    <li className="submenu-item">
                                        <Link to={`/thp/EndrollTHP`} className="submenu-link-xx d-flex align-items-center">
                                            <i className="far fa-circle fa-xs me-2"></i>
                                            <span>Endroll THP</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                    </ul>
                )}
            </li>
        </div>

    );
};

export default Keuangan;