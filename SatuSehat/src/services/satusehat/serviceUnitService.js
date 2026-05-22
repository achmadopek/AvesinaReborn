const ServiceUnitMapper = require("./serviceUnitMapper");
const referenceCache = require("../../database/referenceCacheRepository");
const resourceStatus = require("../../database/resourceStatusRepository");

class ServiceUnitService {
  constructor(client) {
    this.client = client;
  }

  async getOrCreateLocation(serviceUnit) {
    const localId = serviceUnit.srvc_unit_id;

    // Cek cache
    let cachedId = await referenceCache.getSatusehatId("location", localId);
    if (cachedId) {
      return cachedId;
    }

    // Jika sudah ada di kolom satusehat_uuid
    if (serviceUnit.satusehat_uuid) {
      await referenceCache.save({
        reference_type: "location",
        local_id: localId,
        satusehat_id: serviceUnit.satusehat_uuid,
        resource_type: "Location"
      });
      return serviceUnit.satusehat_uuid;
    }

    // Create baru
    console.log(`🆕 Creating Location: ${serviceUnit.srvc_unit_nm} (${localId})`);
    
    const fhirPayload = ServiceUnitMapper.toFHIR(serviceUnit);
    
    try {
      const result = await this.client.post("/Location", fhirPayload);

      await referenceCache.save({
        reference_type: "location",
        local_id: localId,
        satusehat_id: result.id,
        resource_type: "Location",
        extra_data: { name: serviceUnit.srvc_unit_nm }
      });

      await resourceStatus.create({
        resource_type: "Location",
        local_resource_id: localId,
        satusehat_id: result.id,
        request_payload: fhirPayload,
        response_payload: result,
        status: "success"
      });

      console.log(`✅ Location created: ${result.id}`);
      return result.id;

    } catch (err) {
      console.error("❌ Gagal create Location:", err.message);
      throw err;
    }
  }
}

module.exports = ServiceUnitService;