// api/wj_supervisi/DireksiPlan.js

import API from "../axiosInstance";

export const fetchDireksiPlanData = async (direksi_issue_id) => {
  const res = await API.get(
    `/api/supervisi/DireksiPlan/data/${direksi_issue_id}`,
  );

  return res.data;
};

export const fetchDireksiPlanDetail = async (direksi_plan_id) => {
  const res = await API.get(
    `/api/supervisi/DireksiPlan/detail/${direksi_plan_id}`,
  );

  return res.data;
};

export const saveDireksiPlan = async (payload) => {
  const res = await API.post("/api/supervisi/DireksiPlan/save", payload);

  return res.data;
};

export const deleteDireksiPlan = async (direksi_plan_id) => {
  const res = await API.delete(
    `/api/supervisi/DireksiPlan/delete/${direksi_plan_id}`,
  );

  return res.data;
};
