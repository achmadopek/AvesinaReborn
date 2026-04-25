import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchPesertaBiometrik, saveBiometrik } from "../../../api/wj_mcu/DataBiometrik";

import { getToday } from "../../../utils/DateUtils";
import Cropper from "react-easy-crop";

import fingerprintService from "../../../services/fingerprintService";
import webcamService from "../../../services/webcamService";

const PemeriksaanBiometrik = () => {
  const [tgl, setTgl] = useState(getToday());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showSave, setShowSave] = useState(false);

  const [selectedPasien, setSelectedPasien] = useState(null);
  const [payloadMCU, setPayloadMCU] = useState(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  // FINGER
  const [fingerprintImage, setFingerprintImage] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const [deviceReady, setDeviceReady] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(true);

  const [viewFingerprint, setViewFingerprint] = useState(null);

  const [fingerPosition, setFingerPosition] = useState(null);
  const [fingerQuality, setFingerQuality] = useState(null);

  const [securePreview, setSecurePreview] = useState(null);

  // WEBCAM
  const videoRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [cameraList, setCameraList] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [isCropping, setIsCropping] = useState(false);
  const [croppedPhotoBlob, setCroppedPhotoBlob] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const resetModal = () => {
    setShowSave(false);
    setSecurePreview(null);
    setFingerPosition(null);
    setFingerQuality(null);
    setPhotoPreview(null);
    setPayloadMCU(null);
    setCameraReady(false);
  };

  useEffect(() => {
    if (!showSave) return;

    const loadCameras = async () => {
      try {
        const res = await webcamService.listCameras();

        console.log(res);

        setCameraList(res.cameras || []);
        if (res.cameras.length) {
          setSelectedCamera(res.cameras[0]);
        }
      } catch (err) {
        toast.error("Gagal ambil daftar kamera");
      }
    };

    loadCameras();
  }, [showSave]);

  const analyzeFingerprint = (imageSrc) => {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      let left = 0,
        center = 0,
        right = 0,
        darkPixels = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          const brightness = (r + g + b) / 3;

          if (brightness < 120) {
            darkPixels++;

            if (x < width / 3) left++;
            else if (x < (2 * width) / 3) center++;
            else right++;
          }
        }
      }

      // ========================
      // DETEKSI POSISI
      // ========================
      const max = Math.max(left, center, right);

      let position = "KANAN";
      if (max === left) position = "KIRI";
      else if (max === center) position = "TENGAH";

      setFingerPosition(position);

      // ========================
      // DETEKSI KUALITAS
      // ========================
      const ratio = darkPixels / (width * height);

      let quality = "LOW";
      if (ratio >= 0.2) quality = "GOOD";
      else if (ratio >= 0.1) quality = "MEDIUM";

      setFingerQuality(quality);

      // ========================
      // WATERMARK
      // ========================
      const now = new Date();
      const timestamp = now.toLocaleString("id-ID");

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "red";
      ctx.textAlign = "center";

      ctx.font = `bold ${Math.floor(width / 12)}px Arial`;
      ctx.fillText("BIOMETRIK MCU", 0, 0);

      ctx.font = `bold ${Math.floor(width / 18)}px Arial`;
      ctx.fillText(selectedPasien?.nama || "", 0, 40);

      ctx.restore();

      // TIMESTAMP
      ctx.globalAlpha = 0.9;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.font = `${Math.floor(width / 28)}px Arial`;

      const timeText = `Direkam: ${timestamp}`;
      const textWidth = ctx.measureText(timeText).width;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(width - textWidth - 20, height - 40, textWidth + 10, 30);

      ctx.fillStyle = "white";
      ctx.fillText(timeText, width - 15, height - 15);

      const watermarkedImage = canvas.toDataURL("image/png");
      setSecurePreview(watermarkedImage);
    };
  };

  const handleStartCamera = async () => {
    if (!selectedCamera) {
      toast.warning("Pilih kamera dulu");
      return;
    }

    try {
      await webcamService.start(selectedCamera);
      setCameraReady(true);
      toast.success("Camera aktif: " + selectedCamera);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStopCamera = async () => {
    try {
      await webcamService.stop();
      setCameraReady(false);
      toast.info("Camera dimatikan");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setCapturingPhoto(true);

      const blob = await webcamService.captureFinal();
      const imageUrl = URL.createObjectURL(blob);

      setPhotoPreview(imageUrl);

      setIsCropping(true);

      toast.success("Foto berhasil diambil");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setCapturingPhoto(false);
    }
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleSaveCropped = async () => {
    try {
      if (!croppedAreaPixels) {
        toast.warning("Crop area belum siap");
        return;
      }

      const croppedBlob = await getCroppedImg(
        photoPreview,
        croppedAreaPixels
      );

      setCroppedPhotoBlob(croppedBlob);

      const finalUrl = URL.createObjectURL(croppedBlob);
      setPhotoPreview(finalUrl);

      setIsCropping(false);

      toast.success("Foto siap disimpan");
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (!showSave) return;

    const checkDevice = async () => {
      setCheckingDevice(true);

      const available = await fingerprintService.isServiceAvailable();

      if (!available) {
        toast.error(
          "Layanan fingerprint tidak aktif. Gunakan PC yang terhubung dengan alat fingerprint."
        );
        setDeviceReady(false);
      } else {
        try {
          const readers = await fingerprintService.getReaders();
          if (!readers.length) {
            toast.error("Device fingerprint tidak ditemukan.");
            setDeviceReady(false);
          } else {
            setDeviceReady(true);
          }
        } catch (err) {
          toast.error(err.message);
          setDeviceReady(false);
        }
      }

      setCheckingDevice(false);
    };

    checkDevice();
  }, [showSave]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await webcamService.getStatus();
        setCameraReady(status.status === "RUNNING");
      } catch (err) {
        setCameraReady(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      webcamService.stop().catch(() => { });
    };
  }, []);

  const STATUS = {
    'BELUM': { label: "BELUM", color: "secondary" },
    'DRAFT': { label: "DRAFT", color: "warning" },
    'FINAL': { label: "FINAL", color: "primary" },
    'CETAK': { label: "CETAK", color: "success" },
    'BATAL': { label: "BATAL", color: "danger" },
  };

  const handleLoad = async () => {
    if (!tgl) {
      toast.warn("Tanggal periksa wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchPesertaBiometrik(tgl);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pasien MCU");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoad();
  }, []);

  const handlePilihPasien = (row) => {
    if (row.has_fingerprint) {
      setViewFingerprint(row);
      return;
    }

    setSelectedPasien(row);

    setPayloadMCU({
      no_daftar: row.no_daftar,
      nrm: row.nrm,
      nik: row.nik,
      nama: row.nama,
    });

    setShowSave(true);
  };

  const handleSaveMCU = async () => {
    if (!payloadMCU?.fingerprint_image) {
      toast.warning("Scan fingerprint dulu");
      return;
    }

    if (!croppedPhotoBlob) {
      toast.warning("Ambil & crop foto dulu");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("no_daftar", payloadMCU.no_daftar);
      formData.append("fingerprint_image", payloadMCU.fingerprint_image);
      formData.append("photo", croppedPhotoBlob, "face.jpg");

      await saveBiometrik(formData);

      toast.success("Biometrik berhasil disimpan");

      setShowSave(false);
      handleLoad();

    } catch (err) {
      toast.error("Gagal menyimpan Bionetrik");
    } finally {
      setSaving(false);
    }
  };

  const handleStartFingerprint = async () => {
    try {
      const readers = await fingerprintService.getReaders();
      const readerId = readers[0];

      setCapturing(true);

      // STEP 1: Preview dulu
      await fingerprintService.startPreview(
        readerId,
        async (image) => {

          // LANGSUNG ANALISA + WATERMARK
          analyzeFingerprint(image);

          // ambil template
          await fingerprintService.startTemplate(
            readerId,
            (template) => {
              setPayloadMCU((prev) => ({
                ...prev,
                fingerprint_image: template,
              }));

              toast.success("Fingerprint berhasil direkam");
              setCapturing(false);
            },
            (err) => {
              toast.error(err);
              setCapturing(false);
            }
          );
        },
        (err) => {
          toast.error(err);
          setCapturing(false);
        }
      );
    } catch (err) {
      toast.error("Gagal memulai fingerprint");
      setCapturing(false);
    }
  };

  const handleCetak = () => {
    if (!viewFingerprint?.mcu_id) {
      alert("Data tidak lengkap");
      return;
    }

    navigate(`/mcu/CetakSertifikat/${viewFingerprint.mcu_id}`);
  };

  return (
    <>
      {/* MODAL SIMPAN BIOMETRIK */}
      {showSave && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">

                {/* HEADER */}
                <div className="modal-header">
                  <h6 className="modal-title">
                    Perekaman Biometrik
                  </h6>
                  <button
                    className="btn-close btn-close"
                    onClick={() => setShowSave(false)}
                  />
                </div>

                {/* BODY */}
                <div className="modal-body py-4">
                  <div className="row">

                    {/* ================= LEFT COLUMN ================= */}
                    <div className="col-md-4 border-end">

                      <div className="card border-0 shadow-sm">
                        <div className="card-body">

                          {/* IDENTITAS */}
                          <h6 className="fw-bold">{selectedPasien?.nama}</h6>
                          <small className="text-muted d-block mb-3">
                            NRM: {selectedPasien?.nrm}<br />
                            NIK: {selectedPasien?.nik}
                          </small>

                          {/* DEVICE STATUS */}
                          <div className="mb-3">
                            <span className={`badge px-3 py-2 ${deviceReady ? "bg-success" : "bg-danger"}`}>
                              <i className={`bi ${deviceReady ? "bi-usb-symbol" : "bi-x-circle"} me-1`}></i>
                              {deviceReady ? "Device Connected" : "Device Not Connected"}
                            </span>
                          </div>

                          {/* SCAN FINGER */}
                          <button
                            className="btn btn-outline-primary w-100 mb-3"
                            onClick={handleStartFingerprint}
                            disabled={capturing || !deviceReady || checkingDevice}
                          >
                            {checkingDevice
                              ? "Mengecek device..."
                              : capturing
                                ? "Scanning..."
                                : "Scan Fingerprint"}
                          </button>

                          {/* STATUS */}
                          {capturing && (
                            <div className="text-primary small mb-3">
                              <span className="spinner-border spinner-border-sm me-2" />
                              Letakkan jari pada scanner...
                            </div>
                          )}

                          <hr />

                          {/* CAMERA */}
                          <h6 className="fw-semibold mt-3">Foto Peserta</h6>

                          {cameraList.length > 0 && (
                            <select
                              className="form-control form-control-sm mb-2"
                              value={selectedCamera}
                              onChange={(e) => setSelectedCamera(e.target.value)}
                            >
                              {cameraList.map((cam, i) => (
                                <option key={i} value={cam}>
                                  {cam}
                                </option>
                              ))}
                            </select>
                          )}

                          {cameraReady ? (
                            <button
                              type="button"
                              className="btn btn-outline-danger w-100 mb-2"
                              onClick={handleStopCamera}
                            >
                              Matikan Kamera
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-success w-100 mb-2"
                              onClick={handleStartCamera}
                            >
                              Aktifkan Kamera
                            </button>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* ================= MIDDLE COLUMN - FINGER ================= */}
                    <div className="col-md-3 text-center border-end">

                      <h6 className="fw-semibold mb-3">Preview Fingerprint</h6>

                      {securePreview ? (
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <img
                            src={securePreview}
                            alt="Fingerprint"
                            height={200}
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                            style={{
                              borderRadius: 12,
                              border: fingerPosition === "TENGAH"
                                ? "4px solid #198754"
                                : "4px solid #dc3545",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                            }}
                          />

                          {/* TARGET OVERLAY */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              width: "120px",
                              height: "120px",
                              borderRadius: "50%",
                              border: "3px dashed rgba(255,255,255,0.8)",
                              transform: "translate(-50%, -50%)"
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-muted mt-5">
                          <i className="bi bi-fingerprint" style={{ fontSize: 60 }} />
                          <div>Belum ada fingerprint</div>
                        </div>
                      )}

                      {/* BADGES */}
                      {fingerPosition && (
                        <div className="mt-3">
                          <span className={`badge px-3 py-2 fs-6 ${fingerPosition === "TENGAH"
                            ? "bg-success"
                            : "bg-danger"
                            }`}>
                            Posisi: {fingerPosition}
                          </span>
                        </div>
                      )}

                      {fingerQuality && (
                        <div className="mt-2">
                          <span className={`badge px-3 py-2 fs-6 ${fingerQuality === "GOOD"
                            ? "bg-success"
                            : fingerQuality === "MEDIUM"
                              ? "bg-warning text-dark"
                              : "bg-danger"
                            }`}>
                            Kualitas: {fingerQuality}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* ================= RIGHT COLUMN - FOTO ================= */}
                    <div className="col-md-5 text-center">

                      <h6 className="fw-semibold mb-3">Preview Foto</h6>

                      {/* ================= FOTO + CROP MODE ================= */}
                      {photoPreview && isCropping ? (
                        <>
                          <div
                            className="mx-auto rounded overflow-hidden"
                            style={{
                              height: 300,
                              position: "relative",
                              backgroundColor: "#000"
                            }}
                          >
                            <Cropper
                              image={photoPreview}
                              crop={crop}
                              zoom={zoom}
                              aspect={3 / 4}
                              onCropChange={setCrop}
                              onZoomChange={setZoom}
                              onCropComplete={onCropComplete}
                            />
                          </div>

                          <div className="mt-3">
                            <label className="form-label small text-muted">
                              Zoom
                            </label>
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={0.1}
                              value={zoom}
                              onChange={(e) => setZoom(e.target.value)}
                              className="form-range"
                            />
                          </div>

                          <div className="d-grid gap-2 mt-3">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleSaveCropped}
                            >
                              Simpan Foto
                            </button>

                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setPhotoPreview(null);
                                setIsCropping(false);
                                setZoom(1);
                                setCrop({ x: 0, y: 0 });
                              }}
                            >
                              Ambil Ulang
                            </button>
                          </div>
                        </>
                      ) : photoPreview ? (

                        /* ================= FOTO PREVIEW FINAL ================= */
                        <>
                          <div
                            className="mx-auto rounded shadow-sm"
                            style={{
                              width: 225,
                              height: 300,
                              backgroundColor: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "3px solid #0d6efd"
                            }}
                          >
                            <img
                              src={photoPreview}
                              alt="Foto Peserta"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                padding: 2,
                                borderRadius: 8
                              }}
                            />
                          </div>

                          <div className="d-grid mt-3">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setPhotoPreview(null);
                                setIsCropping(false);
                                setZoom(1);
                                setCrop({ x: 0, y: 0 });
                              }}
                            >
                              Ambil Ulang
                            </button>
                          </div>

                          <div className="text-center mt-3">
                            <span className="badge bg-success px-3 py-2">
                              <i className="bi bi-check-circle me-1"></i>
                              Foto Siap Disimpan
                            </span>
                          </div>
                        </>
                      ) : cameraReady ? (

                        /* ================= LIVE PREVIEW ================= */
                        <>
                          <div
                            className="mx-auto rounded overflow-hidden"
                            style={{
                              width: 225,
                              height: 300,
                              backgroundColor: "#000"
                            }}
                          >
                            <img
                              src={`http://127.0.0.1:5005/stream?t=${Date.now()}`}
                              alt="Live Preview"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                              }}
                            />
                          </div>

                          <div className="d-grid mt-3">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleCapturePhoto}
                              disabled={capturingPhoto}
                            >
                              {capturingPhoto ? "Mengambil..." : "Ambil Foto"}
                            </button>
                          </div>
                        </>
                      ) : (

                        /* ================= BELUM AKTIF ================= */
                        <div className="text-center text-muted py-5">
                          <i className="bi bi-camera" style={{ fontSize: 60 }} />
                          <div className="mt-2">Kamera belum aktif</div>
                        </div>

                      )}

                    </div>

                  </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={resetModal}
                  >
                    Batal
                  </button>

                  <button
                    className="btn btn-primary px-4"
                    disabled={saving}
                    onClick={handleSaveMCU}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Biometrik"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )
      }

      {/* MODAL VIEW BIOMETRIK */}
      {
        viewFingerprint && (
          <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">

                  <div className="modal-header bg-light">
                    <h6 className="modal-title">
                      Status Biometrik
                    </h6>
                    <button
                      className="btn-close"
                      onClick={() => setViewFingerprint(null)}
                    />
                  </div>

                  <div className="modal-body text-center py-5">
                    <div className="row">
                      <div className="col-md-6">
                        {viewFingerprint.fingerprint_id ? (
                          <>
                            <div className="mb-4">
                              <i
                                className="bi bi-fingerprint text-success"
                                style={{ fontSize: "90px" }}
                              ></i>
                            </div>

                            <div className="badge bg-success px-4 py-2 fs-6">
                              Fingerprint Terdaftar
                            </div>

                            <div className="mt-4 text-muted">
                              Direkam pada:
                              <br />
                              <strong>
                                {new Date(
                                  viewFingerprint.fingerprint_created
                                ).toLocaleString("id-ID")}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <i
                                className="bi bi-exclamation-triangle text-danger"
                                style={{ fontSize: "90px" }}
                              ></i>
                            </div>

                            <div className="badge bg-danger px-4 py-2 fs-6">
                              Belum Direkam
                            </div>

                            <div className="mt-3 text-muted">
                              Silakan lakukan perekaman biometrik.
                            </div>
                          </>
                        )}
                      </div>

                      <div className="col-md-6">
                        {viewFingerprint.fingerprint_id ? (
                          <>
                            <div className="mb-4">
                              <img src="" />
                              <i
                                className="fas fa-user text-success m-4"
                                style={{ fontSize: "90px" }}
                              ></i>
                            </div>

                            <div className="badge bg-success px-4 py-2 fs-6 mt-2">
                              Foto Tersimpan
                            </div>

                            <div className="mt-4 text-muted">
                              Diambil pada:
                              <br />
                              <strong>
                                {new Date(
                                  viewFingerprint.fingerprint_created
                                ).toLocaleString("id-ID")}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <i
                                className="bi bi-exclamation-triangle text-danger"
                                style={{ fontSize: "90px" }}
                              ></i>
                            </div>

                            <div className="badge bg-danger px-4 py-2 fs-6">
                              Belum Diambil
                            </div>

                            <div className="mt-3 text-muted">
                              Silakan lakukan pengambilan foto.
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer justify-content-center">
                    <button
                      className="btn btn-secondary px-4"
                      onClick={() => setViewFingerprint(null)}
                    >
                      Tutup
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={handleCetak}
                    >
                      Cetak Sertifikat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      {/* DAFTAR PASIEN */}
      <div className="card shadow-sm card-theme">
        <div className="card-header bg-sae py-2 px-3">
          <h6 className="mb-0">Daftar Pemeriksaan Biometrik</h6>
        </div>
        <div className="card-body px-3 py-3 modal-body-custom">
          {/* FILTER */}
          <div className="row g-2 mb-3 align-items-end">
            <div className="col-12 col-sm-4">
              <label className="form-label mb-1 fw-semibold">Tanggal Periksa</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
              />
            </div>
            <div className="col-12 col-sm-auto">
              <button className="btn btn-outline-primary w-100" onClick={handleLoad} disabled={loading}>
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th>No</th>
                  <th>No. RM</th>
                  <th>NIK</th>
                  <th>Nama</th>
                  <th>MCU</th>
                  <th>Biometrik</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted">Belum ada data</td>
                  </tr>
                )}
                {data.map((row, i) => {
                  const statusMCU = STATUS[row.status_mcu] || STATUS[0];
                  const bioLabel = row.has_fingerprint ? "SUDAH" : "BELUM";
                  const bioColor = row.has_fingerprint ? "success" : "secondary";

                  return (
                    <tr key={row.no_daftar}>
                      <td className="text-center">{i + 1}</td>
                      <td>{row.nrm}</td>
                      <td>{row.nik}</td>
                      <td className="fw-semibold">{row.nama}</td>
                      <td className="text-center">
                        <span className={`badge bg-${statusMCU.color}`}>{statusMCU.label}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${bioColor}`}>{bioLabel}</span>
                      </td>
                      <td className="text-center">
                        {!row.has_fingerprint ? (
                          <button className="btn btn-sm btn-success" onClick={() => handlePilihPasien(row)}>
                            Proses Biometrik
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-warning" onClick={() => handlePilihPasien(row)}>
                            Cek Status
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PemeriksaanBiometrik;