import API from "../axiosInstance";

// SIMPAN Verifikasi Input
export const verifikasiSPMHarian = async ({
  harian_id,
  status_verifikasi,
  catatan_verifikasi,
  verified_by,
}) => {
  const res = await API.put(
    "/api/spm/VerifikasiSPMHarian/verifikasi",
    {
      harian_id,
      status_verifikasi,
      catatan_verifikasi,
      verified_by,
    }
  );
  return res.data;
};

export const fetchRuanganByInstalasi = async (peg_id, role, units) => {
  const res = await API.get(
    "/api/spm/VerifikasiSPMHarian/ruangan",
    { params: { peg_id, role, units } }
  );
  return res.data;
};

export const fetchRuanganAll = async (peg_id, role, units) => {
  const res = await API.get(
    "/api/spm/VerifikasiSPMHarian/ruangan",
    { params: { peg_id, role, units } }
  );
  return res.data;
};
