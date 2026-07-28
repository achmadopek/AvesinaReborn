// AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Umum
import Unauthorized from "../pages/user/Unauthorized";
import HomeIndex from "../components/layout/Home";
import ProtectedRoute from "./ProtectedRoute";

// Admin
import MasterUnitSPM from "../pages/admin/MasterUnitSPM";
import MasterInstalasiSPM from "../pages/admin/MasterInstalasiSPM";
import MasterUnitINM from "../pages/admin/MasterUnitINM";
import MasterInstalasiINM from "../pages/admin/MasterInstalasiINM";

// === SDM ===
import HomeSDM from "../components/layout/HomeSDM";
import MasterPegawai from "../pages/wj_sdm/master/pegawai/MasterPegawai";
import KegiatanPegawai from "../pages/wj_sdm/kegiatan/KegiatanPegawai";
import PresensiPegawai from "../pages/wj_sdm/presensi/PresensiPegawai";
import MutasiPegawai from "../pages/wj_sdm/mutasi/MutasiPegawai";

// === THP ===
import HomeTHP from "../components/layout/HomeTHP";
import MasterKeuangan from "../pages/wj_thp/master/keuangan/MasterKeuangan";
import RekeningPegawai from "../pages/wj_thp/master/keuangan/RekeningPegawai";
import ImportGajiPegawai from "../pages/wj_thp/gaji_pegawai/MasterKomponenGaji";
import ImportJPJMPegawai from "../pages/wj_thp/jpjm_pegawai/MasterKomponenJPJM";
import KomponenPenghasilan from "../pages/wj_thp/master/komponen_penghasilan/MasterKomponenPenghasilan";
import KomponenPotongan from "../pages/wj_thp/master/komponen_potongan/MasterKomponenPotongan";
import PenghasilanPegawai from "../pages/wj_thp/penghasilan_pegawai/PenghasilanPegawai";
import PotonganPegawai from "../pages/wj_thp/potongan_pegawai/PotonganPegawai";
import EndrollTHP from "../pages/wj_thp/endroll/EndrollTHP";
import LaporanTHP from "../pages/wj_thp/laporan/LaporanTHP";

// === SIGMA ===
import MasterAnjungan from "../pages/wj_monapp/anjungan/MasterAnjungan";
import MasterMonitoring from "../pages/wj_monapp/monitoring/MasterMonitoring";

// === MOBAY ===
import HomeMobay from "../components/layout/HomeMobay";
import KonsolidasiTagihan from "../pages/wj_mobay/penunjang/KonsolidasiTagihan";
import PengajuanTagihan from "../pages/wj_mobay/penunjang/PengajuanTagihan";
import PengirimanBerkas from "../pages/wj_mobay/penunjang/PengirimanBerkas";
import PenerimaanBerkas from "../pages/wj_mobay/akuntansi/PenerimaanBerkas";
import VerifikasiPengajuan from "../pages/wj_mobay/akuntansi/VerifikasiPengajuan";
import PembayaranTagihan from "../pages/wj_mobay/akuntansi/PembayaranTagihan";
import MonitoringTagihan from "../pages/wj_mobay/akuntansi/MonitoringTagihan";
import RekapPembayaranBahanMedis from "../pages/wj_mobay/akuntansi/RekapPembayaranBahanMedis";
import PembelianBarang from "../pages/wj_mobay/pengadaan/PembelianBarang";
import PengadaanJasa from "../pages/wj_mobay/pengadaan/PengadaanJasa";
import MonitoringPembelian from "../pages/wj_mobay/MonitoringPembelian";

// === SPM ===
import HomeSPM from "../components/layout/HomeSPM";
import EntriSPMHarian from "../pages/wj_spm/spm_harian/EntriSPMHarian";
import MonitoringSPM from "../pages/wj_spm/data_spm/MonitoringSPM";
import RekapKepatuhanSPM from "../pages/wj_spm/data_spm/RekapKepatuhanSPM";
import RekapitulasiSPM from "../pages/wj_spm/data_spm/RekapitulasiSPM";

// === INM ===
import HomeINM from "../components/layout/HomeINM";
import EntriINMHarian from "../pages/wj_inm/inm_harian/EntriINMHarian";
import MonitoringINM from "../pages/wj_inm/data_inm/MonitoringINM";
import RekapKepatuhanINM from "../pages/wj_inm/data_inm/RekapKepatuhanINM";
import RekapitulasiINM from "../pages/wj_inm/data_inm/RekapitulasiINM";

// === ANTRIAN ===
import AntrianPasien from "../pages/wj_antrian/AntrianPasien";

// === MCU ===
import PesertaMCU from "../pages/wj_mcu/peserta/PesertaMCU";
import HasilPemeriksaan from "../pages/wj_mcu/data_mcu/HasilPemeriksaan";
import FormMCU from "../pages/wj_mcu/mirror_mcu/FormMCU";
import CetakMCU from "../pages/wj_mcu/data_mcu/CetakMCU";
import PemeriksaanBiometrik from "../pages/wj_mcu/biometrik/PemeriksaanBiometrik";
import CetakSertifikat from "../pages/wj_mcu/biometrik/CetakSertifikat";

// === WAVA ===
import VirtualAssistant from "../pages/wava/VirtualAssistant";

// === BUGARR ===
import MonitoringBugarr from "../pages/wj_bugarr/MonitoringBugarr";
import EntriBugarr from "../pages/wj_bugarr/EntriBugarr";

// === SIRAD ===
import MonitoringXRay from "../pages/wj_sirad/MonitoringXRay";
import MonitoringCTScan from "../pages/wj_sirad/MonitoringCTScan";
import TrackingPenunjang from "../pages/wj_terjang/TrackingPenunjang";

// === SUPERVISI ===
import HomeSupervisi from "../components/layout/HomeSupervisi";
import MonitoringSupervisi from "../pages/wj_supervisi/MonitoringSupervisi";
import FormSupervisi from "../pages/wj_supervisi/FormSupervisi";
import DetailSupervisi from "../pages/wj_supervisi/DetailSupervisi";
import MonitoringDireksiIssue from "../pages/wj_supervisi/MonitoringDireksiIssue";
import FormDireksiIssue from "../pages/wj_supervisi/FormDireksiIssue";
import DetailDireksiIssue from "../pages/wj_supervisi/DetailDireksiIssue";

const AppRoutes = ({ setRightContent }) => {
  const { dashboard } = useAuth();

  return (
    <Routes>
      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* =============================== */}
      {/*  BASE HOME (untuk landing page) */}
      {/* =============================== */}
      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={[
              "admin",
              "pegawai",
              "kepegawaian",
              "pejabat_teknis",
              "keuangan",
              "loket",
              "penunjang",
              "akuntansi",
              "direksi",
              "user_mcu",
              "dokter_mcu",
              "approver_mcu",
              "komite_mutu",
              "user_spm",
              "verifikator_spm",
              "user_bugarr",
              "radiografer",
            ]}
          >
            {dashboard === "/" ? (
              <HomeIndex setRightContent={setRightContent} />
            ) : (
              <Navigate to={dashboard} replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          ADMIN ROUTE            */}
      {/* =============================== */}
      <Route
        path="/admin/MasterUnitSPM"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MasterUnitSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/MasterInstalasiSPM"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MasterInstalasiSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/MasterUnitINM"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MasterUnitINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/MasterInstalasiINM"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MasterInstalasiINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*        MINI APP: SDM            */}
      {/* =============================== */}
      <Route path="/sdm" element={<Navigate to="/sdm/Home" replace />} />

      <Route
        path="/sdm/Home"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "pegawai", "kepegawaian", "pejabat_teknis"]}
          >
            <HomeSDM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sdm/MasterPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "pegawai", "kepegawaian"]}>
            <MasterPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sdm/KegiatanPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "pejabat_teknis"]}>
            <KegiatanPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sdm/PresensiPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "kepegawaian"]}>
            <PresensiPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sdm/MutasiPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "kepegawaian"]}>
            <MutasiPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*        MINI APP: THP            */}
      {/* =============================== */}
      <Route path="/thp" element={<Navigate to="/thp/Home" replace />} />

      <Route
        path="/thp/Home"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <HomeTHP setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/MasterKeuangan"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <MasterKeuangan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/RekeningPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <RekeningPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/ImportGajiPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <ImportGajiPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/ImportJPJMPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <ImportJPJMPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/KomponenPenghasilan"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <KomponenPenghasilan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/KomponenPotongan"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <KomponenPotongan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/PenghasilanPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <PenghasilanPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/PotonganPegawai"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <PotonganPegawai setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/EndrollTHP"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan"]}>
            <EndrollTHP setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/thp/LaporanTHP"
        element={
          <ProtectedRoute allowedRoles={["admin", "keuangan", "akuntansi"]}>
            <LaporanTHP setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*      MINI APP: SIGMA           */}
      {/* =============================== */}
      <Route
        path="/monapp"
        element={<Navigate to="/monapp/MasterMonitoring" />}
      />

      <Route
        path="/monapp/MasterAnjungan"
        element={
          <ProtectedRoute allowedRoles={["admin", "loket"]}>
            <MasterAnjungan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monapp/MasterMonitoring"
        element={
          <ProtectedRoute allowedRoles={["admin", "direksi"]}>
            <MasterMonitoring setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*        MINI APP: MOBAY          */}
      {/* =============================== */}
      <Route path="/mobay" element={<Navigate to="/mobay/Home" replace />} />

      <Route
        path="/mobay/Home"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang", "akuntansi"]}>
            <HomeMobay setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/KonsolidasiTagihan"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang"]}>
            <KonsolidasiTagihan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PengajuanTagihan"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang"]}>
            <PengajuanTagihan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PengirimanBerkas"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang"]}>
            <PengirimanBerkas setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PenerimaanBerkas"
        element={
          <ProtectedRoute allowedRoles={["admin", "akuntansi"]}>
            <PenerimaanBerkas setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/VerifikasiPengajuan"
        element={
          <ProtectedRoute allowedRoles={["admin", "akuntansi"]}>
            <VerifikasiPengajuan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PembayaranTagihan"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang", "akuntansi"]}>
            <PembayaranTagihan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/MonitoringTagihan"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang", "akuntansi"]}>
            <MonitoringTagihan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/RekapPembayaranBahanMedis"
        element={
          <ProtectedRoute allowedRoles={["admin", "penunjang", "akuntansi"]}>
            <RekapPembayaranBahanMedis setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PembelianBarang/:id?" //? artinya optional.
        element={
          <ProtectedRoute allowedRoles={["admin", "pengadaan"]}>
            <PembelianBarang setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/PengadaanJasa/:id?" //? artinya optional.
        element={
          <ProtectedRoute allowedRoles={["admin", "pengadaan"]}>
            <PengadaanJasa setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mobay/MonitoringPembelian"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "pengadaan", "penunjang", "akuntansi"]}
          >
            <MonitoringPembelian setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: SPM          */}
      {/* =============================== */}
      <Route path="/spm" element={<Navigate to="/spm/Home" replace />} />

      <Route
        path="/spm/Home"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_spm"]}>
            <HomeSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/spm/EntriSPMHarian"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_spm"]}>
            <EntriSPMHarian setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/spm/MonitoringSPM"
        element={
          <ProtectedRoute allowedRoles={["admin", "verifikator_spm"]}>
            <MonitoringSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/spm/RekapKepatuhanSPM"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_spm"]}>
            <RekapKepatuhanSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/spm/RekapitulasiSPM"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_spm"]}>
            <RekapitulasiSPM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: INM          */}
      {/* =============================== */}
      <Route path="/inm" element={<Navigate to="/inm/Home" replace />} />

      <Route
        path="/inm/Home"
        element={
          <ProtectedRoute allowedRoles={["admin", "komite_mutu"]}>
            <HomeINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inm/EntriINMHarian"
        element={
          <ProtectedRoute allowedRoles={["admin", "komite_mutu"]}>
            <EntriINMHarian setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inm/MonitoringINM"
        element={
          <ProtectedRoute allowedRoles={["admin", "verifikator_inm"]}>
            <MonitoringINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inm/RekapKepatuhanINM"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_inm"]}>
            <RekapKepatuhanINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inm/RekapitulasiINM"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_inm"]}>
            <RekapitulasiINM setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: ANTRIAN      */}
      {/* =============================== */}
      <Route
        path="/antrian"
        element={<Navigate to="/antrian/AntrianPasien" />}
      />

      <Route
        path="/antrian/AntrianPasien"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AntrianPasien setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* Default catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* =============================== */}
      {/*          MINI APP: MCU          */}
      {/* =============================== */}
      <Route path="/mcu" element={<Navigate to="/mcu/PesertaMCU" />} />

      <Route
        path="/mcu/PesertaMCU"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "user_mcu", "dokter_mcu", "approver_mcu"]}
          >
            <PesertaMCU setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mcu/HasilPemeriksaan/:nrm/:tgl"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "user_mcu", "dokter_mcu", "approver_mcu"]}
          >
            <HasilPemeriksaan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mcu/FormMCU/:nrm/:tgl"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "user_mcu", "dokter_mcu", "approver_mcu"]}
          >
            <FormMCU setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mcu/CetakMCU/:mcu_id"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "user_mcu", "dokter_mcu", "approver_mcu"]}
          >
            <CetakMCU setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mcu/PemeriksaanBiometrik"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_mcu"]}>
            <PemeriksaanBiometrik setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mcu/CetakSertifikat/:mcu_id"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_mcu"]}>
            <CetakSertifikat setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: WAVA         */}
      {/* =============================== */}
      <Route path="/wava" element={<Navigate to="/wava/VirtualAssistant" />} />

      <Route
        path="/wava/VirtualAssistant"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <VirtualAssistant setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: BUGARR       */}
      {/* =============================== */}
      <Route
        path="/bugarr"
        element={<Navigate to="/bugarr/MonitoringBugarr" />}
      />

      <Route
        path="/bugarr/MonitoringBugarr"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_bugarr"]}>
            <MonitoringBugarr setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bugarr/EntriBugarr"
        element={
          <ProtectedRoute allowedRoles={["admin", "user_bugarr"]}>
            <EntriBugarr setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: SIRAD       */}
      {/* =============================== */}
      <Route path="/sirad" element={<Navigate to="/sirad/MonitoringXRay" />} />

      <Route
        path="/sirad/MonitoringXRay"
        element={
          <ProtectedRoute allowedRoles={["admin", "radiografer", "radiolog"]}>
            <MonitoringXRay setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sirad/MonitoringCTScan"
        element={
          <ProtectedRoute allowedRoles={["admin", "radiografer", "radiolog"]}>
            <MonitoringCTScan setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*          MINI APP: TERJANG       */}
      {/* =============================== */}
      <Route
        path="/terjang"
        element={<Navigate to="/terjang/TrackingPenunjang" replace />}
      />

      <Route
        path="/terjang/TrackingPenunjang"
        element={
          <ProtectedRoute
            allowedRoles={[
              "admin",
              "dokter",
              "perawat",
              "penunjang",
              "radiolog",
              "radiografer",
            ]}
          >
            <TrackingPenunjang setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      {/* =============================== */}
      {/*       MINI APP: SUPERVISI       */}
      {/* =============================== */}
      <Route
        path="/supervisi"
        element={<Navigate to="/supervisi/HomeSupervisi" replace />}
      />

      <Route
        path="/supervisi/Home"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <HomeSupervisi setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringSupervisi"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MonitoringSupervisi setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringSupervisi/Form"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FormSupervisi setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringSupervisi/Form/:supervisi_id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FormSupervisi setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringSupervisi/Detail/:supervisi_id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DetailSupervisi setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringDireksiIssue"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MonitoringDireksiIssue setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringDireksiIssue/Form"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FormDireksiIssue setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringDireksiIssue/Form/:direksi_issue_id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FormDireksiIssue setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisi/MonitoringDireksiIssue/Detail/:direksi_issue_id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DetailDireksiIssue setRightContent={setRightContent} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
