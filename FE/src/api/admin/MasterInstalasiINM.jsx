import API from "../axiosInstance";

// =============================
// GET DATA INSTALASI
// =============================
export const fetchPaginatedData = async (
  page = 1,
  limit = 10,
  searchKode = "",
  searchNama = "",
) => {
  const res = await API.get("/api/admin/MasterInstalasiINM", {
    params: {
      page,
      limit,
      kode: searchKode,
      nama: searchNama,
    },
  });

  return res.data;
};

// =============================
// SEARCH BIDANG
// =============================
export const searchBidang = async (nama = "") => {
  const res = await API.get("/api/admin/MasterInstalasiINM/bidang-search", {
    params: { nama },
  });

  return res.data || [];
};

// =============================
// SEARCH PEGAWAI
// =============================
export const searchPegawai = async (nama = "") => {
  const res = await API.get("/api/admin/MasterInstalasiINM/pegawai-search", {
    params: { nama },
  });

  return res.data || [];
};

// =============================
// CREATE
// =============================
export const createInstalasi = async (data) => {
  const res = await API.post("/api/admin/MasterInstalasiINM", data);

  return res.data;
};

// =============================
// UPDATE
// =============================
export const updateInstalasi = async (id, data) => {
  const res = await API.put(`/api/admin/MasterInstalasiINM/${id}`, data);

  return res.data;
};

// =============================
// DELETE
// =============================
export const deleteInstalasi = async (id) => {
  const res = await API.delete(`/api/admin/MasterInstalasiINM/${id}`);

  return res.data;
};
