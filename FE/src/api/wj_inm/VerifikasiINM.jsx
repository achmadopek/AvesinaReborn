import API from "../axiosInstance";

// SIMPAN Verifikasi Input
export const verifikasiINMHarian = async ({
  harian_id,
  status_verifikasi,
  catatan_verifikasi,
  verified_by,
}) => {
  const res = await API.put(
    "/api/inm/VerifikasiINMHarian/verifikasi",
    {
      harian_id,
      status_verifikasi,
      catatan_verifikasi,
      verified_by,
    }
  );
  return res.data;
};






