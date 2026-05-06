import API from "../axiosInstance";

export const fetchPaginatedDataXRay = async ({ tgl, role, peg_id }) => {
  const res = await API.get("/api/sirad/MonitoringXRay/data", {
    params: { tgl, role, peg_id }
  });
  return res.data;
};

export const requestXRay = async ({ registry_id, pengirim_id, pemeriksa_id, keluhan }) => {
  const res = await API.post("/api/sirad/MonitoringXRay/proses-xray", {
    registry_id,
    pengirim_id,
    pemeriksa_id,
    keluhan
  });
  return res.data;
};

export const fetchDetailXRay = async (registry_id) => {
  const res = await API.get(`/api/sirad/MonitoringXRay/detail/${registry_id}`);
  return res.data;
};

export const uploadXRay = async (formData) => {
  const res = await API.post("/api/sirad/MonitoringXRay/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};

export const saveHasilXRay = async (payload) => {
  const res = await API.post("/api/sirad/MonitoringXRay/save-hasil", payload);
  return res.data;
};

export const sendImaging = async (registry_id) => {
  const res = await API.post(
    "/api/sirad/MonitoringXRay/send-imaging",
    { registry_id }
  );
  return res.data;
};

export const sendObservation = async (registry_id) => {
  const res = await API.post(
    "/api/sirad/MonitoringXRay/send-observation",
    { registry_id }
  );
  return res.data;
};

export const sendDiagnostic = async ({
  registry_id,
  observation_id,
  imaging_id,
}) => {
  const res = await API.post(
    "/api/sirad/MonitoringXRay/send-diagnostic",
    { registry_id, observation_id, imaging_id }
  );
  return res.data;
};