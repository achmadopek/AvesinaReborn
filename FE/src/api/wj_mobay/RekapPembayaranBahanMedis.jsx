import API from "../axiosInstance";

// Ambil data Rekap Pembayaran Bahan Medis dengan pagination dan filter tanggal
export const fetchRekapPembayaranBahanMedis = async ({
  page = 1,
  limit = 10,
  start = "",
  end = "",
  typeTglFilter
}) => {
  const res = await API.get("/api/mobay/RekapPembayaranBahanMedis/data", {
    params: { page, limit, start, end, typeTglFilter }
  });
  return res.data;
};


// Fungsi untuk mengekspor rekap pembayaran bahan medis ke Excel
export const exportRekapPembayaranBahanMedis = async ({
  start,
  end,
  typeTglFilter,
}) => {
  const res = await API.get("/api/mobay/RekapPembayaranBahanMedis/excel",
    {
      params: {
        start,
        end,
        typeTglFilter,
      },
      responseType: "arraybuffer",
    }
  );

  return res.data;
};
