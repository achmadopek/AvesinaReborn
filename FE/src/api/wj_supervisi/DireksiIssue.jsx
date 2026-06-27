// api/wj_supervisi/DireksiIssue.js

import API from "../axiosInstance";

export const fetchDireksiIssueData = async () => {
  const res = await API.get("/api/supervisi/DireksiIssue/data");

  return res.data;
};

export const fetchDireksiIssueDetail = async (direksi_issue_id) => {
  const res = await API.get(
    `/api/supervisi/DireksiIssue/detail/${direksi_issue_id}`,
  );

  return res.data;
};

export const saveDireksiIssue = async (payload) => {
  const res = await API.post("/api/supervisi/DireksiIssue/save", payload);

  return res.data;
};

export const deleteDireksiIssue = async (direksi_issue_id) => {
  const res = await API.delete(
    `/api/supervisi/DireksiIssue/delete/${direksi_issue_id}`,
  );

  return res.data;
};
