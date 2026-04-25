class FingerprintService {
  constructor() {
    this._sdk = null;
  }

  get sdk() {
    if (!window.Fingerprint) {
      throw new Error("Fingerprint SDK tidak tersedia");
    }

    if (!this._sdk) {
      this._sdk = new window.Fingerprint.WebApi();
    }

    return this._sdk;
  }

  /* =========================
     DEVICE CHECK
  ========================== */

  async isServiceAvailable() {
    try {
      await this.sdk.enumerateDevices();
      return true;
    } catch {
      return false;
    }
  }

  async getReaders() {
    try {
      const readers = await this.sdk.enumerateDevices();
      if (!readers?.length) {
        throw new Error("Device fingerprint tidak ditemukan");
      }
      return readers;
    } catch {
      throw new Error("Tidak dapat terhubung ke layanan fingerprint");
    }
  }

  /* =========================
     CORE PARSER
  ========================== */

  parseSample(event, format = "template") {
    if (!event?.samples) {
      throw new Error("Sample tidak ditemukan");
    }

    let parsed = JSON.parse(event.samples);

    // ===== PNG IMAGE =====
    if (format === "png") {
      let base64Url = Array.isArray(parsed)
        ? parsed[0]
        : parsed?.[0]?.Data;

      if (!base64Url) {
        throw new Error("Format PNG tidak valid");
      }

      const base64 = window.Fingerprint.b64UrlTo64(base64Url);
      return `data:image/png;base64,${base64}`;
    }

    // ===== TEMPLATE =====
    if (format === "template") {
      if (!parsed?.[0]?.Data) {
        throw new Error("Format template tidak valid");
      }

      return window.Fingerprint.b64UrlTo64(parsed[0].Data);
    }

    throw new Error("Format tidak dikenali");
  }

  /* =========================
     GENERIC START
  ========================== */

  async start(readerId, sampleFormat, parseMode, onSuccess, onError) {
    try {
      const sdk = this.sdk;

      // STOP dulu kalau masih running
      try {
        await sdk.stopAcquisition();
      } catch {}

      sdk.onSamplesAcquired = async (event) => {
        try {
          const result = this.parseSample(event, parseMode);

          await sdk.stopAcquisition();

          onSuccess(result);
        } catch (err) {
          console.error("Parse error:", err);
          onError(err.message);
        }
      };

      sdk.onDeviceDisconnected = () => {
        onError("Device fingerprint terputus");
      };

      sdk.onCommunicationFailed = () => {
        onError("Gagal komunikasi dengan layanan fingerprint");
      };

      await sdk.startAcquisition(sampleFormat, readerId);

    } catch {
      onError("Gagal memulai proses fingerprint");
    }
  }

  async stop() {
    try {
      if (this._sdk) {
        await this._sdk.stopAcquisition();
      }
    } catch (err) {
      console.warn("Stop error:", err);
    }
  }

  /* =========================
     WRAPPER METHODS
  ========================== */

  async startPreview(readerId, onSuccess, onError) {
    return this.start(
      readerId,
      window.Fingerprint.SampleFormat.PngImage,
      "png",
      onSuccess,
      onError
    );
  }

  async startTemplate(readerId, onSuccess, onError) {
    return this.start(
      readerId,
      window.Fingerprint.SampleFormat.Intermediate,
      "template",
      onSuccess,
      onError
    );
  }
}

export default new FingerprintService();