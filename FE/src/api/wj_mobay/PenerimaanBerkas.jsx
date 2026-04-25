import API from "../axiosInstance";

// ===============================
// GET LIST SURAT PENGANTAR
// ===============================
export const fetchSuratPengantar = async ({
  page,
  limit,
  start,
  end,
  provider,
  invoice
}) => {
  const res = await API.get("/api/mobay/PenerimaanBerkas/surat-pengantar", {
    params: { page, limit, start, end, provider, invoice },
  });
  return res.data;
};

// ===============================
// GET DETAIL SURAT PENGANTAR
// ===============================
export const getDetailSuratPengantar = async (id) => {
  const res = await API.get(
    `/api/mobay/PenerimaanBerkas/surat-pengantar/${id}`
  );
  return res.data;
};

// ===============================
// TERIMA BERKAS
// ===============================
export const terimaBerkas = async (surat_id, received_by) => {
  const res = await API.put(
    "/api/mobay/PenerimaanBerkas/terima",
    { surat_id, received_by }
  );
  return res.data;
};