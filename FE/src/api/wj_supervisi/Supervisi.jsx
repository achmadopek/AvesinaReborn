// api/wj_supervisi/Supervisi.js

import API from "../axiosInstance";

export const fetchSupervisiData = async () => {
  const res = await API.get("/api/supervisi/Supervisi/data");

  return res.data;
};

export const fetchSupervisiDetail = async (supervisi_id) => {
  const res = await API.get(`/api/supervisi/Supervisi/detail/${supervisi_id}`);

  return res.data;
};

export const saveSupervisi = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/save", payload);

  return res.data;
};

export const saveSupervisiIgd = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/igd/save", payload);

  return res.data;
};

export const saveSupervisiHd = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/hd/save", payload);

  return res.data;
};

export const saveSupervisiIbs = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/ibs/save", payload);

  return res.data;
};

export const saveSupervisiMutu = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/mutu/save", payload);

  return res.data;
};

export const saveSupervisiKendala = async (payload) => {
  const res = await API.post("/api/supervisi/Supervisi/kendala/save", payload);

  return res.data;
};

export const saveSupervisiEksekutif = async (payload) => {
  const res = await API.post(
    "/api/supervisi/Supervisi/eksekutif/save",
    payload,
  );

  return res.data;
};

export const changeStatusSupervisi = async (supervisi_id, payload) => {
  const res = await API.put(
    `/api/supervisi/Supervisi/status/${supervisi_id}`,
    payload,
  );

  return res.data;
};

export const SummarySupervisi = async () => {
  const res = await API.get("/api/supervisi/Supervisi/summary");

  return res.data;
};
