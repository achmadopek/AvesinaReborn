// Sidebar.js
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { roleAccess } from "../../config/menuAccess";

// ===== Impor Semua Komponen Menu =====
// Pastikan hanya mengimpor menu yang benar-benar digunakan.
import { Beranda } from "../menu/Beranda";
import { Wava } from "../menu/Wava";
import { Poli } from "../menu/Poli";
import { Akuntansi } from "../menu/Akuntansi";
import { Bugarr } from "../menu/Bugarr";
import { Sirad } from "../menu/Sirad";
import { Penunjang } from "../menu/Penunjang";
import { HumanResources } from "../menu/HumanResources";
import { Master } from "../menu/Master";
import { MasterAdmin } from "../menu/MasterAdmin";
import { Keuangan } from "../menu/Keuangan";
import { Laporan } from "../menu/Laporan";
import { LaporanMobay } from "../menu/LaporanMobay";
import { LaporanMutu } from "../menu/LaporanMutu";
import { LaporanRenbang } from "../menu/LaporanRenbang";
import { Kegiatan } from "../menu/Kegiatan";
import { MonitoringBPJS } from "../menu/MonitoringBPJS";
import { PelayananMedis } from "../menu/PelayananMedis";
import { KomiteMutu } from "../menu/KomiteMutu";
import { RenBang } from "../menu/RenBang";

import { TPP } from "../menu/TPP";
import { InfoJasaMedis } from "../menu/InfoJasaMedis";
import { EIS } from "../menu/EIS";
import { Inventory } from "../menu/Inventory";
import { NonMedis } from "../menu/NonMedis";
import { RekamMedis } from "../menu/RekamMedis";
import { Informasi } from "../menu/Informasi";
import { HealthBenefit } from "../menu/HealthBenefit";
import { KamarPerawatan } from "../menu/KamarPerawatan";
import { KamarOperasi } from "../menu/KamarOperasi";
import { Kelahiran } from "../menu/Kelahiran";
import { PersediaanDarah } from "../menu/PersediaanDarah";
import { Nutrient } from "../menu/Nutrient";
import { Laundry } from "../menu/Laundry";
import { SpiritCare } from "../menu/SpiritCare";
import { Ambulance } from "../menu/Ambulance";
import { KamarJenazah } from "../menu/KamarJenazah";
import { Apotek } from "../menu/Apotek";
import { UnitPelayananMedis } from "../menu/UnitPelayananMedis";
import { Kasir } from "../menu/Kasir";

// ===== Daftar Semua Menu yang Tersedia =====
// Setiap menu memiliki nama (string) dan komponennya.
const allMenus = [
  { name: "Beranda", component: <Beranda /> },
  { name: "Wava", component: <Wava /> },
  { name: 'Poli', component: <Poli /> },
  { name: "Master", component: <Master /> },
  { name: "MasterAdmin", component: <MasterAdmin /> },
  { name: "HumanResources", component: <HumanResources /> },
  { name: "Kegiatan", component: <Kegiatan /> },
  { name: "Keuangan", component: <Keuangan /> },
  { name: "Akuntansi", component: <Akuntansi /> },
  { name: "Penunjang", component: <Penunjang /> },
  { name: "MonitoringBPJS", component: <MonitoringBPJS /> },
  { name: "PelayananMedis", component: <PelayananMedis /> },
  { name: "KomiteMutu", component: <KomiteMutu /> },
  { name: "RenBang", component: <RenBang /> },
  { name: "Bugarr", component: <Bugarr /> },
  { name: "Sirad", component: <Sirad /> },
  { name: "Laporan", component: <Laporan /> },
  { name: "LaporanMobay", component: <LaporanMobay /> },
  { name: "LaporanMutu", component: <LaporanMutu /> },
  { name: "LaporanRenbang", component: <LaporanRenbang /> },

  //  { name: 'TPP', component: <TPP /> },
  //  { name: 'KamarPerawatan', component: <KamarPerawatan /> },
  //  { name: 'KamarOperasi', component: <KamarOperasi /> },
  //  { name: 'Kelahiran', component: <Kelahiran /> },
  //  { name: 'PersediaanDarah', component: <PersediaanDarah /> },
  //  { name: 'Nutrient', component: <Nutrient /> },
  //  { name: 'Laundry', component: <Laundry /> },
  //  { name: 'SpiritCare', component: <SpiritCare /> },
  //  { name: 'Ambulance', component: <Ambulance /> },
  //  { name: 'KamarJenazah', component: <KamarJenazah /> },
  //  { name: 'Apotek', component: <Apotek /> },
  //  { name: 'UnitPelayananMedis', component: <UnitPelayananMedis /> },
  //  { name: 'Kasir', component: <Kasir /> },
  //  { name: 'Inventory', component: <Inventory /> },
  //  { name: 'NonMedis', component: <NonMedis /> },
  //  { name: 'RekamMedis', component: <RekamMedis /> },
  //  { name: 'Informasi', component: <Informasi /> },
  //  { name: 'HealthBenefit', component: <HealthBenefit /> },
  //  { name: 'EIS', component: <EIS /> },
  //  { name: 'InfoJasaMedis', component: <InfoJasaMedis /> },
];

// ===== Sidebar Component =====
export const Sidebar = ({
  setRightContent,
  setShowSidebar,
  setShowRightContent,
  isMobile,
}) => {
  const { role } = useAuth();
  const normalizedRole = role?.toLowerCase?.() || "";
  // admin superapp → akses semua menu
  const allowed = roleAccess[normalizedRole] || [];

  // Jika role memiliki akses 'ALL' (misalnya admin), tampilkan semua menu.
  // Jika tidak, filter hanya menu yang diperbolehkan.
  const filteredMenus = allowed.includes("ALL")
    ? allMenus
    : allMenus.filter((menu) => allowed.includes(menu.name));

  const handleMenuClick = () => {
    if (isMobile) setShowSidebar(false);
  };

  return (
    <>
      <ul className="navbar-nav" id="accordionSidebar">
        {/* Logo atau Branding Sidebar */}
        <li className="sidebar-brand d-flex align-items-center justify-content-center p-1">
          {/*<img
            src="/logo-all.png"
            alt="Logo All Probolinggo"
            height="30"
            className="m-1"
          />*/}
        </li>

        {/* Menu yang ditampilkan berdasarkan hak akses */}
        <div className="sidebar-menu" style={{ padding: "10px 5px 5px 5px" }}>
          {filteredMenus.map(({ name, component }) => (
            <React.Fragment key={name}>
              {React.cloneElement(component, {
                setShowSidebar,
                isMobile,
                setRightContent,
                setShowRightContent,
              })}
            </React.Fragment>
          ))}
        </div>
      </ul>
    </>
  );
};

export default Sidebar;
