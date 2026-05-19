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
  const res = await API.get("/api/mobay/PembayaranTagihan/data", {
    params: { page, limit, start, end, typeTglFilter },
  });
  return res.data;
};


// ===============================
// KUNCI INVOICE
// ===============================
export const kunciInvoice = async (po_acce_id) => {
  const res = await API.put("/api/mobay/PembayaranTagihan/kunciInvoice", {
    po_acce_id,
  });
  return res.data;
};


// ===============================
// PROSES PEMBAYARAN (HEADER)
// ===============================
export const bayarBendel = async (payload) => {
  const res = await API.put(
    "/api/mobay/PembayaranTagihan/bayarBendel",
    payload
  );
  return res.data;
};


// ===============================
// PROSES PEMBATAN PEMBAYARAN (HEADER)
// ===============================
export const batalkanInvoice = async (payload) => {
  const res = await API.post(
    "/api/mobay/PembayaranTagihan/batalkan-invoice",
    payload
  );

  return res.data;
};

// ===============================
// EDIT TANGGAL PEMBAYARAN
// ===============================
export const editTanggalPembayaran = async (payload) => {
  const res = await API.put(
    "/api/mobay/PembayaranTagihan/edit-tanggal-bayar",
    payload
  );

  return res.data;
};