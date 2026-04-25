import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const EIS = ({ setShowSidebar, isMobile, setRightContent }) => {

    // Track the state of each dropdown (menu, submenu, and sub-submenu)
      const [openMenus, setOpenMenus] = useState({
        services: false,        // Main dropdown "Services"
        webDevelopment: false,  // Submenu "Web Development"
        pendaftaran: false,     // Sub-submenu "Pendaftaran"
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
            <Link to="#" onClick={() => toggleDropdown('EIS')} className="sidebar-link-x d-flex justify-content-between">
            EIS 
            <i className={`fa ${openMenus.EIS ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.EIS && (
            <ul className="submenu">

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('DataPasien')} className="submenu-link d-flex justify-content-between">
                        Data Pasien
                        <i className={`fa ${openMenus.DataPasien ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.DataPasien && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Domisili Pasien
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Domisili Kunjungan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Karakteristik Pasien
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Karakteristik Kunjungan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Debitur
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Medis')} className="submenu-link d-flex justify-content-between">
                        Medis
                        <i className={`fa ${openMenus.Medis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Medis && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Rawat Inap
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                ALOS
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Bor
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                BTO
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                TOI
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Barber Johnson
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Keuangan')} className="submenu-link d-flex justify-content-between">
                        Keuangan
                        <i className={`fa ${openMenus.Keuangan ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Keuangan && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pendapatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemasukan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pendapatan Dokter
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Laboratorium')} className="submenu-link d-flex justify-content-between">
                        Laboratorium
                        <i className={`fa ${openMenus.Laboratorium ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Laboratorium && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pendapatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('Inventory')} className="submenu-link d-flex justify-content-between">
                        Inventory
                        <i className={`fa ${openMenus.Inventory ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.Inventory && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Obat/Alat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Mutasi Obat/Alat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemakaian Obat/Alat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pemesanan Obat/Alat
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Penjualan Obat Psikotropi
                                </Link>
                            </li>
                        </ul>
                    )}
                    </li>

                    <li className="submenu-item">
                    <Link to="#" onClick={() => toggleDropdown('DashBoard')} className="submenu-link d-flex justify-content-between">
                        DashBoard
                        <i className={`fa ${openMenus.DashBoard ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                    </Link>
                    {openMenus.DashBoard && (
                        <ul className="submenu">
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                10 Penyakit Terbanyak
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan PerKecamatan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan Rawat Jalan
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan Rawat Inap
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan Gol. Tarif Rawa
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Kunjungan Gol. Tarif Rawa
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pendapatan Per Gol. Tarif
                                </Link>
                            </li>
                            <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                Pasien Poli Belum Terlaya
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
    
export default EIS;