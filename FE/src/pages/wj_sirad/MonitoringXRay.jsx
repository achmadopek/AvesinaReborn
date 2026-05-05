import { useEffect, useState } from "react";
import {
  fetchPaginatedDataXRay,
  fetchDetailXRay,
  requestXRay,
  uploadXRay,
  saveHasilXRay,
  sendImaging,
  sendDiagnostic,
  sendObservation,
} from "../../api/wj_sirad/MonitoringXRay";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Modal, Button } from "react-bootstrap";
import { formatDate } from "../../utils/FormatDate";
import { useMediaQuery } from "react-responsive";

import Cropper from "react-easy-crop";
import ZoomImage from "../../components/ZoomImage";

const MonitoringXRay = (
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
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showSimpanAvesinaModal, setshowSimpanAvesinaModal] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);

  const [foto1, setFoto1] = useState(null);
  const [foto2, setFoto2] = useState(null);
  const [keluhan, setKeluhan] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showBacaModal, setShowBacaModal] = useState(false);
  const [selectedBaca, setSelectedBaca] = useState(null);
  const [hasilBacaan, setHasilBacaan] = useState("");
  const [saving, setSaving] = useState(false);

  // SATU SEHAT
  const [showSatuSehatModal, setShowSatuSehatModal] = useState(false);
  const [uidBase, setUidBase] = useState("");
  const [generatedUIDs, setGeneratedUIDs] = useState(null);

  // ----------------------
  // PASTE FROM SCREENSHOOT
  // ----------------------
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

  const [cropImage, setCropImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // foto1 / foto2
  const [showCropModal, setShowCropModal] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
      //const res = await fetchPaginatedDataXRay({ tgl, token });
      const res = await fetchPaginatedDataXRay({ tgl, role, peg_id });
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
      const res = await fetchDetailXRay(row.registry_id);

      if (res.success) {
        setSelectedDetail(res.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail X-Ray");
    }
  };

  const openModalUpload = (row) => {
    setSelectedUpload(row);
    setFoto1(null);
    setFoto2(null);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();

      formData.append("registry_id", selectedUpload.registry_id);
      formData.append("x_ray_id", selectedUpload.x_ray_id);

      if (foto1) formData.append("foto1", foto1);
      if (foto2) formData.append("foto2", foto2);

      if (keluhan) formData.append("keluhan", keluhan);
      if (peg_id) formData.append("created_by", peg_id);

      setUploading(true);

      await uploadXRay(formData);

      toast.success("Upload berhasil");

      setShowUploadModal(false);

      loadData(currentPage, tanggal);
    } catch (err) {
      console.error(err);
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const openModalBaca = async (row) => {
    try {
      const res = await fetchDetailXRay(row.registry_id);

      if (res.success) {
        setSelectedBaca(res.data);
        setHasilBacaan(res.data.hasil_bacaan || "");
        setShowBacaModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
    }
  };

  const openModalSimpanAvesina = async (row) => {
    try {
      const res = await fetchDetailXRay(row.registry_id);

      if (res.success) {
        setSelectedDetail(res.data);
        setshowSimpanAvesinaModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail X-Ray");
    }
  };

  const handleSaveHasil = async () => {
    try {
      setSaving(true);

      await saveHasilXRay({
        registry_id: selectedBaca.registry_id,
        hasil_bacaan: hasilBacaan,
        read_by: peg_id,
      });

      toast.success("Hasil bacaan tersimpan");

      setShowBacaModal(false);

      loadData(currentPage, tanggal);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan hasil");
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
          if (!foto1) {
            setPreview1(url);
            setCropImage(url);
            setCropTarget("foto1");
          } else {
            setPreview2(url);
            setCropImage(url);
            setCropTarget("foto2");
          }

          setShowCropModal(true);
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => window.removeEventListener("paste", handlePaste);
  }, [foto1]);

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
          onClick={() => loadData(page)}
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

  // FUNCTION CROP
  const getCroppedImg = (imageSrc, cropPixels) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = cropPixels.width;
        canvas.height = cropPixels.height;

        ctx.drawImage(
          image,
          cropPixels.x,
          cropPixels.y,
          cropPixels.width,
          cropPixels.height,
          0,
          0,
          cropPixels.width,
          cropPixels.height,
        );

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      };
    });
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

  // SATU SEHAT
  const handleProsesXRay = async (row) => {
    try {
      const res = await requestXRay({
        registry_id: row.registry_id,
        pengirim_id: row.pengirim_id,
        pemeriksa_id: row.pemeriksa_id,
      });

      if (res.success) {
        toast.success("Berhasil membuat order X-Ray");
        loadData(currentPage, tanggal);
      } else {
        toast.error(res.message || "Gagal proses X-Ray");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal proses X-Ray");
    }
  };

  const openModalSatuSehat = (row) => {
    setSelectedDetail(row);
    setShowSatuSehatModal(true);
  };

// ========================
// SATUSEHAT HANDLER BARU
// ========================

const handleSendImaging = async (row) => {
  try {
    setLoading(true);

    const res = await sendImaging(row.registry_id);

    if (res.success) {
      toast.success("ImagingStudy berhasil dikirim");
      loadData(currentPage, tanggal);
    } else {
      toast.error(res.message || "Gagal kirim ImagingStudy");
    }
  } catch (err) {
    console.error(err);
    toast.error(err?.response?.data?.message || "Error ImagingStudy");
  } finally {
    setLoading(false);
  }
};

const handleSendDiagnostic = async (row) => {
  try {
    setLoading(true);

    const res = await sendDiagnostic(row.registry_id);

    if (res.success) {
      toast.success("DiagnosticReport berhasil dikirim");
      loadData(currentPage, tanggal);
    } else {
      toast.error(res.message || "Gagal kirim DiagnosticReport");
    }
  } catch (err) {
    console.error(err);
    toast.error(err?.response?.data?.message || "Error DiagnosticReport");
  } finally {
    setLoading(false);
  }
};

const handleSendObservation = async (row) => {
  try {
    setLoading(true);

    const res = await sendObservation(row.registry_id);

    if (res.success) {
      toast.success("Observation berhasil dikirim");
      loadData(currentPage, tanggal);
    } else {
      toast.error(res.message || "Gagal kirim Observation");
    }
  } catch (err) {
    console.error(err);
    toast.error(err?.response?.data?.message || "Error Observation");
  } finally {
    setLoading(false);
  }
};

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
              Keluhan | Pemeriksaan:
              <strong className="ms-1">
                {selectedDetail?.keluhan} | {selectedDetail?.tindakan}
              </strong>
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
              <label>
                <strong>Hasil Bacaan</strong>
              </label>

              {selectedDetail?.is_final && (
                <div className="text-success small mb-1">
                  ✔ Menggunakan hasil dari Avesina (final)
                </div>
              )}

              <textarea
                className="form-control form-control-sm"
                rows={4}
                value={selectedDetail?.hasil_bacaan || ""}
                disabled
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
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
              <span>Keluhan : </span>
              <i className="fw-semibold">{selectedUpload?.keluhan}</i>
            </div>
            <div className="col-6">
              <span>Tindakan : </span>
              <i className="fw-semibold">{selectedUpload?.tindakan}</i>
            </div>
          </div>

          <div className="mt-3 row">
            {[1, 2].map((num) => {
              const preview = num === 1 ? preview1 : preview2;

              return (
                <div className="col-md-6 mb-3" key={num}>
                  <label className="fw-semibold">Foto {num}</label>

                  <input
                    type="file"
                    className="form-control form-control-smmb-2"
                    onChange={(e) => handleFileChange(e, `foto${num}`)}
                  />

                  <div className="border rounded text-center p-2">
                    {preview ? (
                      <img src={preview} className="img-fluid rounded" />
                    ) : (
                      <small className="text-muted">
                        Bisa paste (Ctrl + V) screenshot di sini
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="fw-semibold">Keluhan</label>

            <textarea
              className="form-control form-control-sm"
              rows={isMobile ? 1 : 3}
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              placeholder="Tulis keluhan..."
              style={{
                flex: isMobile ? 1 : "unset",
                resize: "none",
              }}
            />
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

      {/* ========== MODAL CROP GAMBAR HAISL SS =========== */}
      <Modal
        show={showCropModal}
        onHide={() => setShowCropModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Crop Gambar</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ height: "400px", position: "relative" }}>
          {cropImage && (
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(croppedArea, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
            />
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="success"
            onClick={async () => {
              const croppedBlob = await getCroppedImg(
                cropImage,
                croppedAreaPixels,
              );

              const file = new File([croppedBlob], "crop.jpg", {
                type: "image/jpeg",
              });

              if (cropTarget === "foto1") {
                setFoto1(file);
                setPreview1(URL.createObjectURL(file));
              } else {
                setFoto2(file);
                setPreview2(URL.createObjectURL(file));
              }

              setShowCropModal(false);

              // RESET STATE BIAR BERSIH
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setCroppedAreaPixels(null);
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
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Baca X-Ray</Modal.Title>
          <span
            className={`badge ${
              selectedBaca?.status === "done"
                ? "bg-success"
                : selectedBaca?.status === "uploaded"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            } ms-2 mt-1`}
          >
            {selectedBaca?.status}
          </span>
        </Modal.Header>

        <Modal.Body
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            paddingBottom: isMobile ? "80px" : "",
          }}
        >
          <div className="row g-2 lh-sm">
            <div className="col-2">
              <div className="text-muted">NRM</div>
              <div className="fw-semibold">{selectedBaca?.mr_code}</div>
            </div>

            <div className="col-4">
              <div className="text-muted">Nama</div>
              <div className="fw-semibold">{selectedBaca?.patient_nm}</div>
            </div>

            <div className="col-6">
              <div className="text-muted">Tgl Pemeriksaan:</div>
              <div className="fw-semibold">
                {formatDate(selectedBaca?.measured_dt)}
              </div>
            </div>

            <div>
              <div className="text-muted">Keluhan | Tindakan:</div>
              <div className="fw-semibold">
                {selectedBaca?.keluhan} | {selectedBaca?.tindakan}
              </div>
            </div>
          </div>

          <div className="row mt-1 g-2">
            <div className="col-md-6">
              {selectedBaca?.foto1 && (
                <ZoomImage
                  src={`${import.meta.env.VITE_API_URL}${selectedBaca?.foto1}`}
                  isMobile={isMobile}
                  showHint
                />
              )}
            </div>

            <div className="col-md-6">
              {selectedBaca?.foto2 && (
                <ZoomImage
                  src={`${import.meta.env.VITE_API_URL}${selectedBaca?.foto2}`}
                  isMobile={isMobile}
                  showHint
                />
              )}
            </div>
          </div>

          {isMobile ? (
            <div
              style={{
                position: "fixed",
                bottom: keyboardOffset,
                left: 0,
                width: "100%",
                background: "#fff",
                padding: "8px 10px env(safe-area-inset-bottom)",
                borderTop: "1px solid #ddd",
                zIndex: 1055,
              }}
            >
              <label className="fw-semibold small">Hasil Bacaan</label>

              <div
                style={{
                  display: isMobile ? "flex" : "block",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <textarea
                  className="form-control form-control-sm"
                  rows={isMobile ? 1 : 3}
                  value={hasilBacaan}
                  onChange={(e) => setHasilBacaan(e.target.value)}
                  placeholder="Tulis hasil..."
                  style={{
                    flex: isMobile ? 1 : "unset",
                    resize: "none",
                  }}
                  autoFocus
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 300);
                  }}
                />

                {isMobile && (
                  <Button
                    variant="success"
                    onClick={handleSaveHasil}
                    disabled={saving}
                    style={{
                      whiteSpace: "nowrap",
                    }}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label>
                <strong>Hasil Bacaan</strong>
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={5}
                value={hasilBacaan}
                onChange={(e) => setHasilBacaan(e.target.value)}
                placeholder="Tulis hasil interpretasi radiologi..."
              />
            </div>
          )}
        </Modal.Body>

        {!isMobile && (
          <Modal.Footer>
            <Button
              variant="success"
              onClick={handleSaveHasil}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>

            <Button variant="secondary" onClick={() => setShowBacaModal(false)}>
              Batal
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* ================= MODAL SIMPAN AVESINA ================= */}
      <Modal
        show={showSimpanAvesinaModal}
        onHide={() => setshowSimpanAvesinaModal(false)}
        centered
        backdrop="static"
        size="lg"
        dialogClassName="modal-theme"
      >
        <Modal.Header closeButton>
          <Modal.Title>Simpan Avesina Hasil X-Ray</Modal.Title>
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
              <p>
                <strong>NRM:</strong> {selectedDetail?.mr_code}
                <br />
                <strong>Nama:</strong> {selectedDetail?.patient_nm}
                <br />
              </p>
            </div>

            <div className="col-md-6">
              <strong>Tgl Periksa:</strong>{" "}
              {formatDate(selectedDetail?.measured_dt)}
            </div>

            <div className="col-md-6">
              <strong>Keluhan:</strong> {selectedDetail?.keluhan}
              <br />
              <strong>Tindakan:</strong> {selectedDetail?.tindakan}
              <br />
            </div>

            <div className="col-12 mt-2">
              <label>
                <strong>Hasil Bacaan</strong>
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={4}
                value={selectedDetail?.hasil_bacaan || ""}
                disabled
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="success" disabled>
            Simpan Avesina [belum bisa dilakukan, menunggu konfirmasi]
          </Button>

          <Button
            variant="secondary"
            onClick={() => setshowSimpanAvesinaModal(false)}
          >
            Tutup
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
            {/* TANGGAL */}
            <div className="col-12 col-md-2">
              <label className="form-label small mb-1">
                Tanggal Pemeriksaan
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
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
                  {!isMobile && <th className="text-center">ENC</th>}
                  {!isMobile && <th className="text-center">REQ</th>}
                  {!isMobile && <th className="text-center">IMG</th>}
                  {!isMobile && <th className="text-center">REP</th>}
                  {!isMobile && <th className="text-center">OBS</th>}
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
                    tindakan_mapping = [],
                    pengirim_ihs,
                    pemeriksa_ihs,
                    satu_sehat = {},
                  } = row;

                  //console.log(filteredData);

                  const {
                    patient = false,
                    encounter = false,
                    service_request = false,
                    imaging = false,
                  } = satu_sehat;

                  const isNotFinal = !is_final;
                  const isRead = status === "read";

                  // minimal 1 tindakan valid
                  const hasValidTindakan = tindakan_mapping.some(
                    (t) => t.snomed_code || t.loinc_code,
                  );

                  // dokter pengirim ada
                  const hasPengirim = !!pengirim_ihs;

                  // radiolog ada (optional kalau dipakai)
                  const hasPemeriksa = !!pemeriksa_ihs;

                  const canRequest =
                    //isNotFinal &&
                    patient &&
                    encounter &&
                    hasPengirim &&
                    hasPemeriksa &&
                    //hasValidTindakan &&
                    !service_request;

                  const canUpload = true;//status === "ordered" && isNotFinal;

                  // Imaging hanya kalau belum pernah kirim
                  const canSendImaging =
                    status === "uploaded" &&
                    service_request &&
                    !imaging;

                  // Diagnostic hanya kalau sudah baca
                  const canSendDiagnostic =
                    status === "read" &&
                    imaging &&
                    !row.satu_sehat?.report;

                  // Observation optional (boleh setelah read)
                  const canSendObservation =
                    status === "read" &&
                    !row.satu_sehat?.observation;

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
                          <div>
                            {row.is_final && (
                              <span className="badge bg-dark">
                                Final Avesina
                              </span>
                            )}
                            {row.status === "none" && (
                              <span className="badge bg-secondary">
                                Belum Upload
                              </span>
                            )}
                            {row.status === "ordered" && (
                              <span className="badge bg-info">
                                Sudah Diminta
                              </span>
                            )}
                            {row.status === "uploaded" && (
                              <span className="badge bg-warning text-dark">
                                Sudah Upload
                              </span>
                            )}
                            {row.status === "read" && (
                              <span className="badge bg-primary">
                                Sudah Dibaca
                              </span>
                            )}
                            {row.status === "done" && (
                              <span className="badge bg-success">Selesai</span>
                            )}
                          </div>
                        </td>
                      )}

                      {!isMobile && (
                        <td>
                          <span
                            className={`badge me-1 ${
                              row.satu_sehat?.patient
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
                          {row.satu_sehat?.encounter ? (
                            <span className="badge bg-secondary">ENC</span>
                          ) : (
                            <span className="badge bg-light text-muted border">ENC</span>
                          )}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {row.satu_sehat?.service_request ? (
                            <span className="badge bg-primary">REQ</span>
                          ) : (
                            <span className="badge bg-light text-muted border">REQ</span>
                          )}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {row.satu_sehat?.imaging ? (
                            <span className="badge bg-info text-dark">IMG</span>
                          ) : (
                            <span className="badge bg-light text-muted border">IMG</span>
                          )}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {row.satu_sehat?.report ? (
                            <span className="badge bg-warning text-dark">REP</span>
                          ) : (
                            <span className="badge bg-light text-muted border">REP</span>
                          )}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {row.satu_sehat?.observation ? (
                            <span className="badge bg-dark">OBS</span>
                          ) : (
                            <span className="badge bg-light text-muted border">OBS</span>
                          )}
                        </td>
                      )}

                      {!isMobile && (
                        <td className="text-center">
                          {row.is_final && (
                            <span className="badge bg-dark">
                              Final Avesina
                            </span>
                          )}
                          <br/>
                          {row.status === "none" && (
                            <span className="badge bg-secondary">
                              Belum Upload
                            </span>
                          )}
                          {row.status === "uploaded" && (
                            <span className="badge bg-warning text-dark">
                              Sudah Upload
                            </span>
                          )}
                          {row.status === "read" && (
                            <span className="badge bg-primary">
                              Sudah Dibaca
                            </span>
                          )}
                          <br/>
                          {row.status === "done" && (
                            <span className="badge bg-success">Selesai</span>
                          )}
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

                        {role === "physician" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            disabled={!canRequest}
                            onClick={() => handleProsesXRay(row)}
                            title={
                              !canRequest
                                ? "Butuh Patient & Encounter di SatuSehat"
                                : ""
                            }
                          >
                            Request
                          </button>
                        )}

                        {role === "radiografer" && (
                          <button
                            className="btn btn-sm btn-outline-success ms-1"
                            disabled={!canUpload}
                            onClick={() => openModalUpload(row)}
                          >
                            Upload
                          </button>
                        )}

                        {role === "radiolog" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            disabled={!canBaca}
                            onClick={() => openModalBaca(row)}
                          >
                            Baca
                          </button>
                        )}

                        {isMobile && role === "radiolog" && (
                          <hr className="m-2" />
                        )}

                        {role === "radiolog" && (
                          <button
                            className={`btn btn-sm btn-outline-info ${!isMobile ? "ms-2" : ""}`}
                            disabled={!canSimpan}
                            onClick={() => openModalSimpanAvesina(row)}
                          >
                            Observasi
                          </button>
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
                  <br />
                  <span className="badge bg-secondary me-1">ENC</span>
                  Encounter pasien sudah tercatat
                  <br />
                  <span className="badge bg-primary me-1">REQ</span>
                  ServiceRequest radiologi sudah dibuat
                </div>
                <div className="col-md-5 small">
                  <span className="badge bg-info text-dark me-1">IMG</span>
                  ImagingStudy X-Ray sudah dikirim (mini-PACS non-DICOM)
                  <br />
                  <span className="badge bg-warning text-dark me-1">REP</span>
                  DiagnosticReport hasil bacaan radiologi sudah dikirim
                  <br />
                  <span className="badge bg-dark me-1">OBS</span>
                  Observation hasil bacaan (temuan medis) sudah dikirim
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

export default MonitoringXRay;
