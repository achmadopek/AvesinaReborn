import API from "../axiosInstance";

// GET MCU hasil pemeriksaan
export const fetchPrologWava = async () => {
  const res = await API.get("/api/wava/VirtualAssistant/perkenalan-diri", {
  });
  return res.data;
};