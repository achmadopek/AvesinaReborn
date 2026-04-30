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
  const res = await API.get("/api/mobay/VerifikasiPengajuan/data", {
    params: { page, limit, start, end, typeTglFilter },
  });
  return res.data;
};

// ===============================
// PROSES VERIFIKASI
// ===============================
export const mulaiVerifikasi = async (payload) => {
  const res = await API.put(
    "/api/mobay/VerifikasiPengajuan/mulai-verifikasi",
    payload
  );
  return res.data;
};

// ===============================
// PROSES VALIDASI
// ===============================
export const prosesValidasiPembayaran = async ({
  po_acce_id,
  status_validasi,
  status_pengolahan,
  catatan_verifikasi,
}) => {
  const res = await API.put(
    "/api/mobay/VerifikasiPengajuan/validasi",
    {
      po_acce_id,
      status_validasi,
      status_pengolahan,
      catatan_verifikasi,
    }
  );
  return res.data;
};

export const cetakVerifikasi = async (payload) => {
  const res = await API.post(
    "/api/mobay/VerifikasiPengajuan/cetak-verifikasi",
    payload,
    { responseType: "blob" } // penting!
  );
  return res;
};

export const getNoVerifikasi = async () => {
  const res = await API.get("/api/mobay/VerifikasiPengajuan/get-no-verifikasi");
  return res.data;
};