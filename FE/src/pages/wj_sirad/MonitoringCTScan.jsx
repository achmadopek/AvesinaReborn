import { useEffect, useState } from "react";
import {
  fetchPaginatedDataCTScan,
  fetchDetailCTScan,
  uploadCTScan,
  saveHasilCTScan,
} from "../../api/wj_sirad/MonitoringCTScan";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import { formatDate } from "../../utils/FormatDate";
import { useMediaQuery } from "react-responsive";

import ZoomImage from "../../components/ZoomImage";

import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import DicomViewer from "../../components/DicomViewer";

// Start Of React Datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import id from "date-fns/locale/id";
registerLocale("id", id);
// End Of React Datepicker

const MonitoringCTScan = (
  setRightContent = false,
  defaultRightContent = false,
) => {
  const { token, peg_id, role } = useAuth();

  // -----------------------
  // STATE
  // -----------------------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tanggal, setTanggal] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [selectedCTScan, setSelectedCTScan] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);

  const [foto1, setFoto1] = useState(null);
  const [foto2, setFoto2] = useState(null);

  // ========================
  // UPLOAD STATES
  // ========================
  const [dicomFile, setDicomFile] = useState(null);
  const [imageFiles, setImageFiles] = useState({
    foto1: null,
    foto2: null,
  });
  const [imagePreview, setImagePreview] = useState({
    foto1: null,
    foto2: null,
  });

  const [uploadMode, setUploadMode] = useState("image");

  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showBacaModal, setShowBacaModal] = useState(false);
  const [selectedBaca, setSelectedBaca] = useState(null);
  const [hasilBacaan, setHasilBacaan] = useState("");
  const [saving, setSaving] = useState(false);

  // ----------------------
  // PASTE FROM SCREENSHOOT
  // ----------------------
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

  const [cropImage, setCropImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // foto1 / foto2
  const [showCropModal, setShowCropModal] = useState(false);

  const [crop, setCrop] = useState({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [aspect, setAspect] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  // =====================
  // CHANGE ASPECT
  // =====================

  const changeAspect = (newAspect) => {
    setAspect(newAspect);

    setCrop({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
  };

  // =====================
  // GET CROPPED IMAGE
  // =====================

  const getCroppedImg = (imageSrc, crop) => {
    return new Promise((resolve) => {
      const image = new Image();

      image.src = imageSrc;

      image.onload = () => {
        const canvas = document.createElement("canvas");

        const scaleX = image.naturalWidth / image.width;

        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width;

        canvas.height = crop.height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          image,

          crop.x * scaleX,
          crop.y * scaleY,

          crop.width * scaleX,
          crop.height * scaleY,

          0,
          0,

          crop.width,
          crop.height,
        );

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      };
    });
  };

  // -----------------------
  // MOBILE VIEW
  // -----------------------
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // -----------------------
  // PAGINATION
  // -----------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // -----------------------
  // FILTERING
  // -----------------------
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tindakanFilter, setTindakanFilter] = useState("all");
  const [radiologFilter, setRadiologFilter] = useState("all");

  // -----------------------
  // LOAD DATA
  // -----------------------
  const loadData = async (page = 1, tgl = tanggal) => {
    if (!tgl) return;

    setLoading(true);

    try {
      //const res = await fetchPaginatedDataCTScan({ tgl, token });
      const res = await fetchPaginatedDataCTScan({
        tgl,
        role,
        employee_id: peg_id,
      });
      setData(res.data || []);

      //console.log("DATA", res);

      setTotalPages(res.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const resetUploadState = () => {
    setUploadMode("image");

    setDicomFile(null);

    setImageFiles({
      foto1: null,
      foto2: null,
    });

    setImagePreview({
      foto1: null,
      foto2: null,
    });

    setPreview1(null);
    setPreview2(null);

    setNotes("");
  };

  const handleLoadData = () => {
    if (!tanggal) {
      toast.warn("Pilih tanggal dulu");
      return;
    }

    loadData(1, tanggal);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadData(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadData(currentPage + 1);
    }
  };

  useEffect(() => {
    if (!token) return;

    const timer = setTimeout(() => {
      const today = new Date().toISOString().split("T")[0];
      setTanggal(today);
      loadData(1, today);
    }, 100); // delay tipis

    return () => clearTimeout(timer);
  }, [token]);

  // -----------------------
  // MODAL DETAIL
  // -----------------------
  const openModalDetail = async (row) => {
    try {
      const res = await fetchDetailCTScan(row.registry_id, row.ct_scan_dtl_id);
      if (res.success) {
        setSelectedDetail(res.data);
        setShowDetailModal(true);
      }

      console.log(res);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail X-Ray");
    }
  };

  const openModalRequest = async (row) => {
    try {
      const res = await fetchDetailCTScan(row.registry_id, row.ct_scan_dtl_id);
      if (res.success) {
        setSelectedDetail(res.data);
        setNotes(res.data.notes || "");
        setShowRequestModal(true);
      }
    } catch (err) {
      toast.error("Gagal memuat data request");
    }
  };

  const openModalUpload = (row) => {
    setSelectedUpload(row);

    resetUploadState();

    setShowUploadModal(true);
  };

  const handleDicomChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".dcm")) {
      toast.warn("File harus format DICOM (.dcm)");
      return;
    }

    setDicomFile(file);
  };

  const handleUpload = async () => {
    // ======================
    // VALIDASI
    // ======================
    if (uploadMode === "dicom" && !dicomFile) {
      toast.warn("File DICOM wajib dipilih");
      return;
    }

    if (uploadMode === "image" && !imageFiles.foto1 && !imageFiles.foto2) {
      toast.warn("Minimal upload 1 gambar");
      return;
    }

    const formData = new FormData();

    formData.append("upload_mode", uploadMode);

    formData.append("registry_id", selectedUpload.registry_id);

    formData.append("ct_scan_id", selectedUpload.ct_scan_id);

    formData.append("ct_scan_dtl_id", selectedUpload.ct_scan_dtl_id);

    formData.append("created_by", peg_id);

    // ======================
    // DICOM
    // ======================
    if (uploadMode === "dicom" && dicomFile) {
      formData.append("dicom", dicomFile);
    }

    // ======================
    // IMAGE
    // ======================
    if (uploadMode === "image") {
      if (imageFiles.foto1) {
        formData.append("foto1", imageFiles.foto1);
      }

      if (imageFiles.foto2) {
        formData.append("foto2", imageFiles.foto2);
      }
    }

    try {
      setUploading(true);

      const res = await uploadCTScan(formData);

      console.log(res);

      if (res.success) {
        toast.success(res.message || "Upload berhasil");

        setShowUploadModal(false);

        loadData(currentPage, tanggal);
      } else {
        toast.error(res.message || "Upload gagal");
      }
    } catch (err) {
      console.error(err);

      toast.error(err?.response?.data?.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const openModalBaca = async (row) => {
    try {
      const res = await fetchDetailCTScan(row.registry_id, row.ct_scan_dtl_id);

      if (res.success) {
        setSelectedBaca(res.data);
        setHasilBacaan(res.data.hasil_bacaan || "");
        setShowBacaModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data baca X-Ray");
    }
  };

  const handleSaveAndSendObservation = async () => {
    if (saving) return;
    if (!hasilBacaan?.trim()) {
      toast.warn("Hasil bacaan tidak boleh kosong");
      return;
    }

    try {
      setSaving(true);

      const res = await saveHasilCTScan({
        registry_id: selectedBaca.registry_id,
        ct_scan_id: selectedBaca.ct_scan_id,
        ct_scan_dtl_id: selectedBaca.ct_scan_dtl_id,
        hasil_bacaan: hasilBacaan,
        read_by: peg_id,
      });
      console.log("RES SAVE:", res);
      if (res.success) {
        toast.success(
          res.observation_sent
            ? "Hasil bacaan berhasil disimpan & dikirim ke SatuSehat"
            : "Hasil bacaan berhasil disimpan (SatuSehat pending)",
        );
      } else {
        toast.error(res.message || "Gagal menyimpan hasil");
      }
      console.log("SEBELUM LOAD DATA");
      setShowBacaModal(false);
      setHasilBacaan("");
      loadData(currentPage, tanggal);
      console.log("SETELAH LOAD DATA");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal menyimpan hasil");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------
  // PASTE FROM SS
  // -----------------------
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData.items;

      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          const url = URL.createObjectURL(file);

          // default masuk ke foto1 kalau kosong
          const target = !imageFiles.foto1 ? "foto1" : "foto2";

          setCropImage(url);
          setCropTarget(target);

          setShowCropModal(true);
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(imagePreview).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreview]);

  const handleFileChange = (e, target) => {
    const file = e.target.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setCropImage(url);
    setCropTarget(target);

    setShowCropModal(true);
  };

  // -----------------------
  // HELPER
  // -----------------------

  const renderPageNumbers = () => {
    const delta = 1;

    const range = (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const withDots = (pages) => {
      const result = [];
      let prev = null;

      for (let page of pages) {
        if (prev !== null && page - prev > 1) result.push("...");

        result.push(page);

        prev = page;
      }

      return result;
    };

    const startPages = range(1, Math.min(2, totalPages));

    const endPages = range(Math.max(totalPages - 1, 3), totalPages);

    const middlePages = range(
      Math.max(currentPage - delta, 3),
      Math.min(currentPage + delta, totalPages - 2),
    );

    const pages = withDots([...startPages, ...middlePages, ...endPages]);

    return pages.map((page, idx) =>
      page === "..." ? (
        <span key={`dots-${idx}`} className="mx-1">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => loadData(page, tanggal)}
          className={`btn btn-sm mx-1 ${
            currentPage === page
              ? "btn-outline-primary"
              : "btn-outline-secondary"
          }`}
        >
          {page}
        </button>
      ),
    );
  };

  const filteredData = data.filter((row) => {
    // SEARCH
    const keyword = search.toLowerCase();
    const matchSearch =
      row.mr_code?.toLowerCase().includes(keyword) ||
      row.patient_nm?.toLowerCase().includes(keyword);

    // STATUS
    let matchStatus = true;

    if (statusFilter === "belum") {
      matchStatus = row.status === "none" || row.status === "uploaded";
    } else if (statusFilter === "read") {
      matchStatus = row.status === "read";
    } else if (statusFilter === "done") {
      matchStatus = row.status === "done";
    }

    // TINDAKAN
    let matchTindakan = true;

    if (tindakanFilter === "thorax") {
      matchTindakan = row.tindakan?.toLowerCase().includes("thorax");
    } else if (tindakanFilter === "babygram") {
      matchTindakan = row.tindakan?.toLowerCase().includes("babygram");
    }

    // RADIOLOG FILTER
    let matchRadiolog = true;

    if (radiologFilter !== "all") {
      matchRadiolog = String(row.pemeriksa_id) === String(radiologFilter);
    }

    return matchSearch && matchStatus && matchTindakan && matchRadiolog;
  });

  // DETECT KEYBOARD MOBILE
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const offset = window.innerHeight - viewport.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  // ======================
  // CETAK PDF HASIL X-RAY
  // ======================
  const handlePrintPDF = (data) => {
    if (!data) {
      toast.error("Data tidak ditemukan");
      return;
    }

    // Import yang BENAR untuk jspdf versi terbaru
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;

      // ==================== HEADER ====================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("RUOBK RSUD WALUYO JATI", pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Jl. dr. Soetomo No. 1 Kraksaan 67282 Kab. Probolinggo",
        pageWidth / 2,
        27,
        { align: "center" },
      );
      doc.text("Phone : 0335-841160, Fax : 0335-841160", pageWidth / 2, 33, {
        align: "center",
      });
      doc.text("Email : rswaluyojati@yahoo.com", pageWidth / 2, 39, {
        align: "center",
      });

      doc.setLineWidth(0.8);
      doc.line(margin, 45, pageWidth - margin, 45);

      // ==================== JUDUL ====================
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("HASIL PEMERIKSAAN RADIOLOGI", pageWidth / 2, 55, {
        align: "center",
      });

      // ==================== DATA PASIEN ====================
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      let y = 68;
      doc.text(`NRM          : ${data.mr_code || "-"}`, margin, y);
      doc.text(`Nama         : ${data.patient_nm || "-"}`, margin, (y += 7));
      doc.text(
        `Tanggal      : ${formatDate(data.measured_dt)}`,
        margin,
        (y += 7),
      );
      doc.text(`Pemeriksaan  : ${data.tindakan || "-"}`, margin, (y += 7));

      // ==================== HASIL BACAN ====================
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("Hasil Pemeriksaan:", margin, y);

      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(
        data.hasil_bacaan || "-",
        pageWidth - margin * 2,
      );
      doc.text(splitText, margin, (y += 10));

      // ==================== FOOTER TTD ====================
      const footerY = 220;

      doc.text("Pengirim,", margin, footerY);
      doc.text("( _____________________ )", margin, footerY + 22);
      doc.text(data.pengirim || "Dokter Pengirim", margin, footerY + 30);

      doc.text("Pemeriksa,", pageWidth - margin - 70, footerY);
      doc.text(
        "( _____________________ )",
        pageWidth - margin - 70,
        footerY + 22,
      );
      doc.text(
        data.radiolog || "Dokter Radiologi",
        pageWidth - margin - 70,
        footerY + 30,
      );

      // Tanggal cetak
      doc.setFontSize(9);
      doc.text(
        `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
        margin,
        285,
      );

      // Simpan PDF
      doc.save(`Hasil_Radiologi_${data.mr_code || "unknown"}.pdf`);
    });
  };

  useEffect(() => {
    setDicomFile(null);

    setImageFiles({
      foto1: null,
      foto2: null,
    });

    setImagePreview({
      foto1: null,
      foto2: null,
    });
  }, [uploadMode]);

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <>
      {/* ================= MODAL DETAIL ================= */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        backdrop="static"
        size="lg"
        dialogClassName="modal-theme"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detail X-Ray</Modal.Title>
          <span
            className={`badge ${
              selectedDetail?.status === "done"
                ? "bg-success"
                : selectedDetail?.status === "uploaded"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            } ms-2 mt-1`}
          >
            {selectedDetail?.status}
          </span>
        </Modal.Header>

        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <strong>NRM:</strong> {selectedDetail?.mr_code}
              <br />
              <strong>Nama:</strong> {selectedDetail?.patient_nm}
              <br />
              <strong>Radiolog:</strong> {selectedDetail?.radiolog}
              <br />
            </div>

            <div className="col-md-6">
              Tgl Periksa:
              <strong className="ms-1">
                {formatDate(selectedDetail?.measured_dt)}
              </strong>
              <br />
              Pemeriksaan:
              <strong className="ms-1">{selectedDetail?.tindakan}</strong>
              <br />
              Pengirim:
              <strong className="ms-1">{selectedDetail?.pengirim}</strong>
            </div>

            <div className="col-md-6 mt-3 mb-3">
              {selectedDetail?.foto1 && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedDetail.foto1}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ cursor: "pointer", width: "100%" }}
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}${selectedDetail.foto1}`,
                    )
                  }
                />
              )}
            </div>

            <div className="col-md-6 mb-3">
              {selectedDetail?.foto2 && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedDetail.foto2}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ cursor: "pointer", width: "100%" }}
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}${selectedDetail.foto2}`,
                    )
                  }
                />
              )}
            </div>

            <div className="col-12">
              <div className="mt-2">
                <label className="fw-semibold">Keluhan / Anamnesa Klinis</label>

                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={selectedDetail?.keluhan_anamnesa || "-"}
                  disabled
                />
              </div>

              <div className="mt-2">
                <label className="fw-semibold">Catatan Radiografer</label>

                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  value={selectedDetail?.catatan_radiografer || "-"}
                  disabled
                />
              </div>

              <div className="mt-2">
                <label>
                  <strong>Hasil Bacaan</strong>
                </label>

                {selectedDetail?.is_final ? (
                  <div className="text-success small mb-1">
                    ✔ Menggunakan hasil dari Avesina (final)
                  </div>
                ) : selectedDetail?.is_lokal ? (
                  <div className="text-primary small mb-1">
                    ℹ Menggunakan hasil dari Avesina Reborn (lokal sementara)
                  </div>
                ) : (
                  <div className="text-warning small mb-1">
                    ⚠ Belum ada hasil bacaan radiologi
                  </div>
                )}

                <textarea
                  className="form-control form-control-sm"
                  rows={4}
                  value={selectedDetail?.hasil_bacaan || "-"}
                  disabled
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>

          <Button
            variant="primary"
            onClick={() => handlePrintPDF(selectedDetail)}
            disabled={!selectedDetail}
          >
            Cetak PDF
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= MODAL REQUEST ================= */}
      <Modal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        centered
        backdrop="static"
        size="lg"
        dialogClassName="modal-theme"
      >
        <Modal.Header closeButton>
          <Modal.Title>Permintaan X-Ray</Modal.Title>
          <span
            className={`badge ${
              selectedDetail?.status === "done"
                ? "bg-success"
                : selectedDetail?.status === "uploaded"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            } ms-2 mt-1`}
          >
            {selectedDetail?.status}
          </span>
        </Modal.Header>

        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <strong>NRM:</strong> {selectedDetail?.mr_code}
              <br />
              <strong>Nama:</strong> {selectedDetail?.patient_nm}
              <br />
              <strong>Radiolog:</strong> {selectedDetail?.radiolog}
              <br />
            </div>

            <div className="col-md-6">
              Tgl Periksa:
              <strong className="ms-1">
                {formatDate(selectedDetail?.measured_dt)}
              </strong>
              <br />
              Pemeriksaan:
              <strong className="ms-1">{selectedDetail?.tindakan}</strong>
              <br />
              Pengirim:
              <strong className="ms-1">{selectedDetail?.pengirim}</strong>
            </div>

            <div className="col-md-6 mt-3 mb-3">
              {selectedDetail?.foto1 && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedDetail.foto1}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ cursor: "pointer", width: "100%" }}
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}${selectedDetail.foto1}`,
                    )
                  }
                />
              )}
            </div>

            <div className="col-md-6 mb-3">
              {selectedDetail?.foto2 && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedDetail.foto2}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ cursor: "pointer", width: "100%" }}
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}${selectedDetail.foto2}`,
                    )
                  }
                />
              )}
            </div>

            <div className="col-12">
              <div className="mt-2">
                <label className="fw-semibold">Keluhan / Anamnesa Klinis</label>

                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={selectedUpload?.keluhan_anamnesa || "-"}
                  disabled
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => handleProsesCTScan(selectedDetail)}
            disabled={uploading || !notes}
            className="ms-2"
          >
            {uploading ? "Mengirim..." : "Request & Kirim SatuSehat"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowRequestModal(false)}
          >
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============= MODAL UPLOAD ============= */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Upload X-Ray</Modal.Title>
          <span
            className={`badge ${
              selectedUpload?.status === "done"
                ? "bg-success"
                : selectedUpload?.status === "uploaded"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            } ms-2 mt-1`}
          >
            {selectedUpload?.status}
          </span>
        </Modal.Header>

        <Modal.Body>
          <div className="row g-2 small lh-small">
            <div className="col-6">
              <span>NRM : </span>
              <i className="fw-semibold">{selectedUpload?.mr_code}</i>
            </div>
            <div className="col-6">
              <span>Nama : </span>
              <i className="fw-semibold">{selectedUpload?.patient_nm}</i>
            </div>
            <div className="col-6">
              <span>Tgl Periksa : </span>
              <i className="fw-semibold">
                {formatDate(selectedUpload?.measured_dt)}
              </i>
            </div>
            <div className="col-6">
              <span>Tindakan : </span>
              <i className="fw-semibold">{selectedUpload?.tindakan}</i>
            </div>
          </div>

          {/* ================= MODE UPLOAD ================= */}
          <div className="mt-3">
            <label className="fw-semibold d-block mb-2">
              Pilih Mode Upload
            </label>

            <div className="d-flex gap-3 flex-wrap">
              {/* DICOM */}
              <div
                onClick={() => setUploadMode("dicom")}
                className={`border rounded p-1 flex-fill cursor-pointer ${
                  uploadMode === "dicom" ? "border-primary bg-light" : ""
                }`}
                style={{
                  cursor: "pointer",
                  minWidth: "220px",
                  transition: "0.2s",
                }}
              >
                <div className="form-check">
                  <input
                    className="form-check-input me-2"
                    type="radio"
                    checked={uploadMode === "dicom"}
                    readOnly
                  />

                  <label className="form-check-label fw-semibold">
                    Upload DICOM
                  </label>
                </div>
              </div>

              {/* IMAGE */}
              <div
                onClick={() => setUploadMode("image")}
                className={`border rounded p-1 flex-fill cursor-pointer ${
                  uploadMode === "image" ? "border-success bg-light" : ""
                }`}
                style={{
                  cursor: "pointer",
                  minWidth: "220px",
                  transition: "0.2s",
                }}
              >
                <div className="form-check">
                  <input
                    className="form-check-input me-2"
                    type="radio"
                    checked={uploadMode === "image"}
                    readOnly
                  />

                  <label className="form-check-label fw-semibold">
                    Upload JPEG / Paste
                  </label>
                </div>
              </div>
            </div>
          </div>

          {uploadMode === "dicom" && (
            <div className="mt-3">
              <label className="fw-semibold">Upload File DICOM (.dcm)</label>

              <input
                type="file"
                className="form-control form-control-sm"
                accept=".dcm,application/dicom"
                onChange={handleDicomChange}
              />

              {dicomFile && (
                <div className="mt-2 text-success small">
                  ✔ File dipilih: {dicomFile.name}
                </div>
              )}
            </div>
          )}

          {uploadMode === "image" && (
            <div className="mt-3 row">
              {[1, 2].map((num) => {
                const key = `foto${num}`;
                const preview = imagePreview[key];

                return (
                  <div className="col-md-6 mb-3" key={num}>
                    <label className="fw-semibold">Foto {num}</label>

                    <input
                      type="file"
                      className="form-control form-control-sm mb-2"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, key)}
                    />

                    <div className="border rounded text-center p-2">
                      {preview ? (
                        <img src={preview} className="img-fluid rounded" />
                      ) : (
                        <small className="text-muted">
                          Bisa paste screenshot di sini
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="col-12">
            {/* Keluhan dari dokter */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Keluhan / Anamnesa Klinis
              </label>

              <textarea
                className="form-control"
                rows={3}
                value={selectedUpload?.keluhan_anamnesa || "-"}
                disabled
              />
            </div>

            {/* Catatan radiografer */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Catatan Radiografer
              </label>

              <textarea
                className="form-control"
                rows={3}
                placeholder="Tambahan catatan saat pemeriksaan / upload gambar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="success"
            onClick={handleUpload}
            disabled={uploading}
            className="ms-2"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>

          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========== MODAL CROP ========== */}
      <Modal
        show={showCropModal}
        onHide={() => setShowCropModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Crop Gambar</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* ===================== */}
          {/* PILIH RATIO */}
          {/* ===================== */}

          <div className="mb-3 d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${
                aspect === null ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeAspect(null)}
            >
              Free
            </button>

            <button
              className={`btn btn-sm ${
                aspect === 1 ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeAspect(1)}
            >
              1:1
            </button>

            <button
              className={`btn btn-sm ${
                aspect === 4 / 3 ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeAspect(4 / 3)}
            >
              4:3
            </button>

            <button
              className={`btn btn-sm ${
                aspect === 16 / 9 ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => changeAspect(16 / 9)}
            >
              16:9
            </button>
          </div>

          {/* ===================== */}
          {/* CROPPER */}
          {/* ===================== */}

          <div
            className="d-flex justify-content-center"
            style={{
              maxHeight: "70vh",
              overflow: "auto",
            }}
          >
            {cropImage && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect || undefined}
              >
                <img
                  src={cropImage}
                  alt="Crop"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "65vh",
                  }}
                />
              </ReactCrop>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="success"
            onClick={async () => {
              if (!completedCrop) {
                toast.warn("Crop belum dipilih");
                return;
              }

              const croppedBlob = await getCroppedImg(cropImage, completedCrop);

              const file = new File([croppedBlob], "crop.jpg", {
                type: "image/jpeg",
              });

              if (cropTarget) {
                setImageFiles((prev) => ({
                  ...prev,
                  [cropTarget]: file,
                }));

                setImagePreview((prev) => ({
                  ...prev,
                  [cropTarget]: URL.createObjectURL(file),
                }));
              }

              // RESET
              setShowCropModal(false);

              setCrop({
                unit: "%",
                x: 10,
                y: 10,
                width: 80,
                height: 80,
              });

              setCompletedCrop(null);

              setCropImage(null);

              setCropTarget(null);
            }}
          >
            Simpan Crop
          </Button>

          <Button variant="secondary" onClick={() => setShowCropModal(false)}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========== MODAL BACA GAMBAR =========== */}
      <Modal
        show={showBacaModal}
        onHide={() => setShowBacaModal(false)}
        centered
        size="xl"
        fullscreen={isMobile} // ← Fullscreen di HP
      >
        <Modal.Header closeButton>
          <Modal.Title>Baca X-Ray - {selectedBaca?.patient_nm}</Modal.Title>
          <span
            className={`badge ms-2 ${selectedBaca?.status === "done" ? "bg-success" : selectedBaca?.status === "uploaded" ? "bg-warning text-dark" : "bg-secondary"}`}
          >
            {selectedBaca?.status}
          </span>
        </Modal.Header>

        <Modal.Body style={{ padding: isMobile ? "10px" : "20px" }}>
          {/* Info Pasien */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="text-muted small">NRM</div>
              <div className="fw-bold">{selectedBaca?.mr_code}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small">Nama</div>
              <div className="fw-bold">{selectedBaca?.patient_nm}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small">Tanggal</div>
              <div className="fw-bold">
                {formatDate(selectedBaca?.measured_dt)}
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted small">Tindakan</div>
              <div className="fw-bold">{selectedBaca?.tindakan}</div>
            </div>
          </div>

          {/* Gambar */}
          <div className="row g-3">
            {selectedBaca?.dicom_path && (
              <div className="col-lg-7">
                <h6 className="mb-2">DICOM Viewer</h6>
                <DicomViewer
                  imageId={`wadouri:${import.meta.env.VITE_API_URL}${selectedBaca.dicom_path}`}
                />
              </div>
            )}

            {selectedBaca?.foto1 && (
              <div className="col-lg-5">
                <h6 className="mb-2">Foto JPEG</h6>
                <ZoomImage
                  src={`${import.meta.env.VITE_API_URL}${selectedBaca.foto1}`}
                  isMobile={isMobile}
                />
              </div>
            )}

            {selectedBaca?.foto2 && (
              <div className="col-lg-5 mt-3">
                <ZoomImage
                  src={`${import.meta.env.VITE_API_URL}${selectedBaca.foto2}`}
                  isMobile={isMobile}
                />
              </div>
            )}
          </div>

          {/* Form Hasil Bacaan */}
          <div className="mt-2">
            <label className="fw-semibold">Keluhan</label>
            <textarea
              className="form-control form-control-sm"
              rows={isMobile ? 1 : 3}
              value={notes ? notes : "-"}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                flex: isMobile ? 1 : "unset",
                resize: "none",
              }}
              disabled
            />
          </div>

          {/* Form Hasil Bacaan */}
          <div className="mt-1">
            <label className="fw-semibold">Hasil Bacaan Radiologi</label>
            <textarea
              className="form-control"
              rows={isMobile ? 4 : 6}
              value={hasilBacaan}
              onChange={(e) => setHasilBacaan(e.target.value)}
              placeholder="Tulis interpretasi dan kesimpulan..."
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBacaModal(false)}>
            Tutup
          </Button>
          <Button
            variant="success"
            onClick={handleSaveAndSendObservation}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= TOMBOL FILTER MOBILE ================= */}
      {isMobile && (
        <button
          className="btn btn-sm btn-primary mb-2"
          onClick={() => setShowFilter(!showFilter)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 1051,
            borderRadius: "50px",
            padding: "10px 16px",
          }}
        >
          {showFilter ? "Tutup Filter" : "Filter"}
        </button>
      )}

      {/* ================= CARD ================= */}
      <div className={`card shadow-sm card-theme ${isMobile ? "mt-2" : ""}`}>
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Monitoring X-Ray</h6>
        </div>

        <div className="card-body px-3 py-3">
          {/* ================= FILTER ================= */}
          <div
            className="row g-2 align-items-end mb-3"
            style={
              isMobile
                ? {
                    display: showFilter ? "block" : "none",
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    background: "#fff",
                    padding: "10px",
                    zIndex: 1050,
                    transition: "all 0.3s ease",
                    transform: showFilter
                      ? "translateY(0)"
                      : "translateY(100%)",
                    boxShadow: showFilter
                      ? "0 -2px 10px rgba(0,0,0,0.2)"
                      : "none",
                  }
                : {}
            }
          >
            {/* TANGGAL PEMERIKSAAN */}
            <div className="col-12 col-md-2">
              <label className="form-label small mb-1">
                Tanggal Pemeriksaan
              </label>

              <DatePicker
                selected={tanggal ? new Date(`${tanggal}T00:00:00`) : null}
                onChange={(date) =>
                  setTanggal(date ? date.toISOString().split("T")[0] : "")
                }
                dateFormat="d MMMM yyyy"
                className="form-control form-control-sm"
                placeholderText="Pilih tanggal"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                locale="id"
                // === SOLUSI WIDTH ===
                wrapperClassName="w-100"
                style={{ width: "100%", zIndex: "99999" }}
              />
            </div>

            {/* BUTTON */}
            <div className="col-6 col-md-1 d-grid">
              <button
                onClick={handleLoadData}
                className="btn btn-sm btn-primary"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>

            {/* SEARCH */}
            <div className="col-12 col-md-4">
              <label className="form-label small mb-1">Cari NRM / Nama</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Ketik NRM atau Nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* STATUS */}
            <div className="col-6 col-md-1">
              <label className="form-label small mb-1">Status</label>
              <select
                className="form-control form-control-sm form-control form-control-sm-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="belum">Belum Dibaca</option>
                <option value="read">Sudah Dibaca</option>
                <option value="done">Tersimpan Avesina</option>
              </select>
            </div>

            {/* TINDAKAN */}
            <div className="col-6 col-md-1">
              <label className="form-label small mb-1">Tindakan</label>
              <select
                className="form-control form-control-sm form-control form-control-sm-sm"
                value={tindakanFilter}
                onChange={(e) => setTindakanFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="thorax">Thorax</option>
                <option value="babygram">Babygram</option>
              </select>
            </div>

            {/* RADIOLOG */}
            {role === "radiografer" && (
              <div className="col-6 col-md-3">
                <label className="form-label small mb-1">Radiolog</label>
                <select
                  className="form-control form-control-sm form-control form-control-sm-sm"
                  value={radiologFilter}
                  onChange={(e) => setRadiologFilter(e.target.value)}
                >
                  <option value="all">Semua</option>

                  {[
                    ...new Map(
                      data.map((d) => [d.pemeriksa_id, d.dr_pemeriksa]),
                    ).entries(),
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-theme table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th>No</th>
                  {isMobile && <th>NRM / Nama / Tindakan / Status</th>}
                  {!isMobile && <th>NRM / Nama</th>}
                  {!isMobile && <th>Pengirim (IHS) / Pemeriksa (IHS)</th>}
                  {!isMobile && <th>Tindakan / Mapping</th>}
                  {!isMobile && <th className="text-center">Status</th>}

                  <th className="text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={isMobile ? 3 : 5}
                      className="text-center text-muted"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}

                {filteredData.map((row, i) => {
                  const {
                    status,
                    is_final,
                    is_lokal,
                    tindakan_mapping = [],
                    pengirim_ihs,
                    pemeriksa_ihs,
                    satu_sehat = {},
                  } = row;

                  //console.log(filteredData);

                  const {
                    patient = null,
                    encounter = null,
                    service_request = null,
                    imaging = null,
                    observation = null,
                    report = null,
                  } = satu_sehat;

                  const isNotFinal = !is_final;
                  const isRead = status === "read";

                  // semua tindakan harus valid
                  const hasValidTindakan = tindakan_mapping.some(
                    (t) => t.snomed_code && t.loinc_code,
                  );

                  // dokter pengirim ada
                  const hasPengirim = !!pengirim_ihs;

                  // radiolog ada (optional kalau dipakai)
                  const hasPemeriksa = !!pemeriksa_ihs;

                  const isSSSuccess = (item) => item?.status === "success";

                  const isSSPending = (item) =>
                    ["queued", "processing"].includes(item?.status);

                  const isSSFailed = (item) =>
                    ["failed", "skipped"].includes(item?.status);

                  const imgSuccess = isSSSuccess(imaging);
                  const imgPending = isSSPending(imaging);

                  const repSuccess = isSSSuccess(report);
                  const repPending = isSSPending(report);

                  const obsSuccess = isSSSuccess(observation);

                  // ====================
                  // ACTION RULES
                  // ====================

                  // UPLOAD
                  const canUpload = ["none", "requested", "uploaded"].includes(
                    status,
                  );
                  //&& !is_final;

                  // BACA
                  const canBaca = ["uploaded", "requested", "read"].includes(
                    status,
                  );

                  // REPORT
                  const canSendDiagnostic =
                    status === "read" &&
                    imgSuccess &&
                    !repSuccess &&
                    !repPending;

                  // OBSERVATION
                  const canSendObservation =
                    status === "read" && repSuccess && !obsSuccess;

                  // SAVE LOCAL
                  const canSimpan = status === "read";

                  const renderStatusBadge = (row) => {
                    if (row.is_lokal) {
                      return (
                        <span className="badge bg-dark">Final Reborn</span>
                      );
                    }

                    if (row.is_final) {
                      return (
                        <span className="badge bg-purple">Final Avesina</span>
                      );
                    }

                    switch (row.status) {
                      case "none":
                        return (
                          <span className="badge bg-secondary">
                            Belum Upload
                          </span>
                        );

                      case "requested":
                        return (
                          <span className="badge bg-info text-dark">
                            Sudah Diminta
                          </span>
                        );

                      case "uploaded":
                        return (
                          <span className="badge bg-warning text-dark">
                            Sudah Upload
                          </span>
                        );

                      case "read":
                        return (
                          <span className="badge bg-primary">Sudah Dibaca</span>
                        );

                      case "done":
                        return (
                          <span className="badge bg-success">Selesai</span>
                        );

                      case "failed":
                        return <span className="badge bg-danger">Gagal</span>;

                      default:
                        return (
                          <span className="badge bg-light text-dark border">
                            Unknown
                          </span>
                        );
                    }
                  };

                  return (
                    <tr key={row.unit_visit_id || i}>
                      <td>{i + 1}</td>

                      {isMobile && (
                        <td>
                          <div>{row.mr_code}</div>
                          <div>{row.patient_nm}</div>
                          <div>
                            {row.tindakan_mapping?.map((t, i) => (
                              <span
                                key={i}
                                className={`badge me-1 ${
                                  t.snomed_code && t.loinc_code
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {t.nama}
                              </span>
                            ))}
                          </div>
                          <div>{renderStatusBadge(row)}</div>
                        </td>
                      )}

                      {!isMobile && (
                        <td>
                          <span
                            className={`badge me-1 ${
                              row.satu_sehat?.patient?.status === "success"
                                ? "bg-success"
                                : "bg-danger"
                            }`}
                          >
                            PX
                          </span>
                          {row.mr_code}
                          <br />
                          {row.patient_nm}
                        </td>
                      )}
                      {!isMobile && (
                        <td>
                          {/* Pengirim */}
                          <div>
                            <span
                              className={`badge me-1 ${row.pengirim_ihs ? "bg-success" : "bg-danger"}`}
                              title={
                                row.pengirim_ihs
                                  ? `IHS: ${row.pengirim_ihs}`
                                  : "Belum terdaftar SatuSehat"
                              }
                            >
                              PR
                            </span>
                            {row.dr_pengirim}
                          </div>

                          {/* Pemeriksa */}
                          <div>
                            <span
                              className={`badge me-1 ${row.pemeriksa_ihs ? "bg-success" : "bg-danger"}`}
                              title={
                                row.pemeriksa_ihs
                                  ? `IHS: ${row.pemeriksa_ihs}`
                                  : "Belum terdaftar SatuSehat"
                              }
                            >
                              PR
                            </span>
                            {row.dr_pemeriksa}
                          </div>
                        </td>
                      )}
                      {!isMobile && (
                        <td>
                          {row.tindakan_mapping?.map((t, i) => (
                            <div key={i} className="mb-2">
                              <div className="fw-semibold">{t.nama}</div>

                              <div className="small">
                                {/* SNOMED */}
                                <span
                                  className={`badge me-1 ${
                                    t.snomed_code ? "bg-success" : "bg-danger"
                                  }`}
                                  title={t.snomed_display || ""}
                                >
                                  SN: {t.snomed_code || "X"}
                                </span>

                                {/* LOINC */}
                                <span
                                  className={`badge ${
                                    t.loinc_code ? "bg-primary" : "bg-danger"
                                  }`}
                                  title={t.loinc_display || ""}
                                >
                                  LN: {t.loinc_code || "X"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {renderStatusBadge(row)}
                        </td>
                      )}

                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary mt-1 mt-md-0 me-md-1"
                          onClick={() => openModalDetail(row)}
                        >
                          Detail
                        </button>

                        {isMobile && <hr className="m-2" />}

                        {/* === RADIOGRAFER - UPLOAD === */}
                        {role === "radiografer" && (
                          <button
                            className="btn btn-sm btn-outline-success ms-1"
                            disabled={!canUpload}
                            onClick={() => openModalUpload(row)}
                            title={
                              !hasValidTindakan
                                ? "Mapping SNOMED/LOINC belum lengkap → hanya lokal"
                                : ""
                            }
                          >
                            Upload
                          </button>
                        )}

                        {/* === RADIOLOG - BACA === */}
                        {role === "radiolog" && (
                          <button
                            className="btn btn-sm btn-outline-success ms-1"
                            disabled={!canBaca}
                            onClick={() => openModalBaca(row)}
                          >
                            Baca
                          </button>
                        )}

                        {isMobile && role === "radiolog" && (
                          <hr className="m-2" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="text-left mt-3 text-muted">
              <div className="row">
                <div className="col-md-3 small">
                  <strong>Legenda Status SatuSehat</strong>
                  <br />
                  <span className="badge bg-success me-1">PR</span>
                  <span className="badge bg-danger me-1">PR</span>
                  Practitioner sudah/belum terdaftar
                  <br />
                  <span className="badge bg-success me-1">PX</span>
                  <span className="badge bg-danger me-1">PX</span>
                  Patient sudah/belum terdaftar
                </div>
                <div className="col-md-4 small">
                  <span className="badge bg-success me-1">SN</span>
                  <span className="badge bg-primary me-1">LN</span>
                  <span className="badge bg-danger me-1">SN/LN</span>
                  SNOMED/LOINC mapping sudah/belum tersedia
                </div>
              </div>
            </div>

            <div className="pagination-controls mt-2 px-3 py-2 d-flex justify-content-between align-items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="btn btn-outline-secondary btn-sm"
              >
                &laquo; Prev
              </button>

              <div>{renderPageNumbers()}</div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="btn btn-outline-secondary btn-sm"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringCTScan;
