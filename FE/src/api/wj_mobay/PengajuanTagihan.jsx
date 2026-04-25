import API from "../axiosInstance";

// ===============================
// GET DATA PENGAJUAN PEMBAYARAN
// ===============================
export const fetchPaginatedDataPengajuanPembayaran = async ({
  page = 1,
  limit = 10,
  start = "",
  end = "",
  typeTglFilter = "invoice_consolidated_dt",
}) => {
  const res = await API.get("/api/mobay/PengajuanTagihan/data", {
    params: { page, limit, start, end, typeTglFilter },
  });
  return res.data;
};

// ===============================
// CREATE SURAT PENGANTAR
// ===============================
export const createSuratPengantar = async (payload) => {

  const res = await API.post(
    "/api/mobay/PengajuanTagihan/create",
    payload,
    { responseType: "blob" }
  );

  const contentType = res.headers["content-type"];

  // kalau bukan PDF berarti error dari backend
  if (!contentType.includes("application/pdf")) {

    const text = await res.data.text();
    const json = JSON.parse(text);

    throw new Error(json.message || "Gagal membuat surat pengantar");
  }

  return res.data;
};

// ===============================
// HAPUS KONSOLIDASI
// ===============================
export const hapusKonsolidasi = async (payload) => {
  const res = await API.post(
    "/api/mobay/PengajuanTagihan/hapus-konsolidasi",
    payload
  );

  return res.data;
};