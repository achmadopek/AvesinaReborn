class WebcamService {
  constructor() {
    this.baseUrl = "http://127.0.0.1:5005";
  }

  async request(endpoint, options = {}) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, options);
    if (!res.ok) {
      let msg = "Request gagal";
      try {
        const err = await res.json();
        msg = err.error || msg;
      } catch { }
      throw new Error(msg);
    }
    return res;
  }

  async listCameras() {
    const res = await this.request("/camera/list");
    return res.json();
  }

  async start(cameraName) {
    const res = await this.request("/camera/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cameraName })
    });
    return res.json();
  }

  async stop() {
    const res = await this.request("/camera/stop", {
      method: "POST"
    });
    return res.json();
  }

  async getStatus() {
    const res = await this.request("/camera/status");
    return res.json();
  }

  async captureFinal() {
    const res = await this.request("/camera/capture");
    return res.blob();
  }
}

export default new WebcamService();