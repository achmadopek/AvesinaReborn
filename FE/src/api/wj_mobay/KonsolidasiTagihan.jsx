import API from "../axiosInstance";

// ===============================
// GET DATA PENGAJUAN PEMBAYARAN
// ===============================
export const fetchPaginatedDataPengajuanPembayaran = async ({
  page = 1,
  limit = 10,
  start = "",
  end = "",
  typeTglFilter = "tgl_po", // DEFAULT AMAN
}) => {
  const res = await API.get("/api/mobay/KonsolidasiTagihan/data", {
    params: { page, limit, start, end, typeTglFilter },
  });
  return res.data;
};

// ===============================
// GET PROVIDER LIST
// ===============================
export const fetchProviderList = async () => {
  const res = await API.get("/api/mobay/KonsolidasiTagihan/providerList");
  return res.data;
};

// ===============================
// GET DRUG LIST
// ===============================
export const fetchDrugList = async () => {
  const res = await API.get("/api/mobay/KonsolidasiTagihan/drugList");
  return res.data;
};

// ===============================
// KONSOLIDASI TAGIHAN
// ===============================
export const konsolidasiInvoice = async ({
  header,
  items,
}) => {
  if (!header?.po_acce_id) {
    throw new Error("po_acce_id wajib diisi");
  }

  const res = await API.post(
    "/api/mobay/KonsolidasiTagihan/konsolidasi",
    {
      header,
      items,
    }
  );

  return res.data;
};
