import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const NonMedis = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('NonMedis')} className="sidebar-link-x d-flex justify-content-between">
            Non Medis 
                <i className={`fa ${openMenus.NonMedis ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.NonMedis && (
                <ul className="submenu">

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('PengadaanBarang')} className="submenu-link d-flex justify-content-between">
                            Pengadaan Barang
                            <i className={`fa ${openMenus.PengadaanBarang ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.PengadaanBarang && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pemesanan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penerimaan Pemesanan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penukaran
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penerimaan Penukaran
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('TransaksiAntarUnit')} className="submenu-link d-flex justify-content-between">
                            Transaksi Antar Unit
                            <i className={`fa ${openMenus.TransaksiAntarUnit ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.TransaksiAntarUnit && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Permintaan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pengiriman
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pengiriman Langsung
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penerimaan
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('TransaksiStok')} className="submenu-link d-flex justify-content-between">
                            Transaksi Stok
                            <i className={`fa ${openMenus.TransaksiStok ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.TransaksiStok && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pemusnahan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Opname
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pemakaian Stok
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Monitoring')} className="submenu-link d-flex justify-content-between">
                            Monitoring
                            <i className={`fa ${openMenus.Monitoring ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Monitoring && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pemesanan
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penukaran
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Permintaan Antar Unit
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Pengiriman Antar Unit
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Penerimaan Antar Unit
                                </Link>
                                </li>
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Monitoring Stok
                                </Link>
                                </li>
                            </ul>
                            )}
                        </li>

                        <li className="submenu-item">
                            <Link to="#" onClick={() => toggleDropdown('Logistik')} className="submenu-link d-flex justify-content-between">
                            Logistik
                            <i className={`fa ${openMenus.Logistik ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                            </Link>
                            {openMenus.Logistik && (
                            <ul className="submenu">
                                <li className="submenu-item">
                                <Link to="/under-construction" className="submenu-link-xx">
                                    Realisasi Pembelian Inven
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
    
export default NonMedis;