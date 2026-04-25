import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const Inventory = ({ setShowSidebar, isMobile, setRightContent }) => {

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
            <Link to="#" onClick={() => toggleDropdown('poli')} className="sidebar-link-x d-flex justify-content-between">
            Inventory 
            <i className={`fa ${openMenus.poli ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
            </Link>
            {openMenus.poli && (
            <ul className="submenu">

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('PengadaanObatAlat')} className="submenu-link d-flex justify-content-between">
                        Pengadaan Obat/Alat
                        <i className={`fa ${openMenus.PengadaanObatAlat ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.PengadaanObatAlat && (
                        <ul className="submenu">
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Pengajuan Pembayaran
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
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Usulan Pengadaan
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Verifikasi Kasi Penunjang
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Verifikasi Kabid Penunjan
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Verifikasi Direktur
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Verifikasi SPI
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Validasi Usulan
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Cetak Laporan Tervalidasi
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Penyimpanan Gudang Befor
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
                                Penerimaan
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Permintaan Pengiriman
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
                                Pemakaian
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Produksi
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Hibah
                            </Link>
                            </li>
                        </ul>
                        )}
                    </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('MonitoringInventori')} className="submenu-link d-flex justify-content-between">
                        Monitoring Inventori
                        <i className={`fa ${openMenus.MonitoringInventori ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.MonitoringInventori && (
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
                                Antar Unit Belum Diterima
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Pemusnahan Obat/Alkes
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Opname Stok
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
                        <Link to="#" onClick={() => toggleDropdown('MonitoringStok')} className="submenu-link d-flex justify-content-between">
                        Monitoring Stok
                        <i className={`fa ${openMenus.MonitoringStok ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.MonitoringStok && (
                        <ul className="submenu">
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Mon. Trans Rekap
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Mon. Trans Detail
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Stok
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Stok Habis
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Stok Multi Uni
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Monitoring Stok FIFO
                            </Link>
                            </li>
                        </ul>
                        )}
                    </li>

                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleDropdown('Konfigurasi')} className="submenu-link d-flex justify-content-between">
                        Konfigurasi
                        <i className={`fa ${openMenus.Konfigurasi ? 'fa-chevron-up' : 'fa-chevron-down'} dropdown-arrow`}></i>
                        </Link>
                        {openMenus.Konfigurasi && (
                        <ul className="submenu">
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Generate Minimum Stok
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Konfigurasi Harga Jual
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Gen. Daily Monthly Tr
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Generate Monthly Stock
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Generate Stock FIFO
                            </Link>
                            </li>
                            <li className="submenu-item">
                            <Link to="/under-construction" className="submenu-link-xx">
                                Generate Stok Rusak
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
    
export default Inventory;