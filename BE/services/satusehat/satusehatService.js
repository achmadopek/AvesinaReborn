// services/satusehat/satusehatService.js
const { logInfo, logError, logWarn } = require("../../utility/debugLogger");
const satuSehatSender = require("./sender");

class SatuSehatService {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 2000; // 2 detik
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async callWithRetry(fn, operationName = "SatuSehat Operation") {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn();
        logInfo(`✅ ${operationName} BERHASIL (attempt ${attempt}/${this.maxRetries})`);
        return { 
          success: true, 
          data: result, 
          attempt,
          isRetry: attempt > 1 
        };
      } catch (err) {
        lastError = err;
        logError(`❌ ${operationName} GAGAL (attempt ${attempt}/${this.maxRetries})`, err.message);

        if (attempt === this.maxRetries) break;

        const delay = this.baseDelay * attempt;
        logWarn(`⏳ Retry ${operationName} dalam ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // Semua retry gagal
    logError(`💥 ${operationName} GAGAL SETELAH ${this.maxRetries} ATTEMPT`, lastError?.message);
    
    return {
      success: false,
      error: lastError?.message || "Unknown error",
      attempt: this.maxRetries,
      isPermanentFail: true
    };
  }

  // ====================== RESOURCE METHODS ======================

  async sendServiceRequest(payload) {
    return this.callWithRetry(() => satuSehatSender.sendServiceRequestToSatuSehat(payload), "ServiceRequest");
  }

  async sendImagingStudy(data, orgId) {
    return this.callWithRetry(() => satuSehatSender.sendImagingStudyToSatuSehat(data, orgId), "ImagingStudy");
  }

  async sendObservation(data) {
    return this.callWithRetry(() => satuSehatSender.sendObservationToSatuSehat(data), "Observation");
  }

  async sendDiagnosticReport(data, observationId, imagingId, orgId) {
    return this.callWithRetry(
      () => satuSehatSender.sendDiagnosticToSatuSehat(data, observationId, imagingId, orgId), 
      "DiagnosticReport"
    );
  }
}

module.exports = new SatuSehatService();