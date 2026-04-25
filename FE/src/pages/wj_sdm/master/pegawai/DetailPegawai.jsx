import { useEffect, useState } from "react";
import { fetchPegawaiById } from "../../../../api/wj_sdm/MasterPegawai";
import { formatDate } from "../../../../utils/FormatDate";

const DetailPegawai = ({ item }) => {
  // State data pegawai dan loading
  const [pegawai, setPegawai] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ambil detail pegawai setiap kali item berubah
  useEffect(() => {
    const fetchDetail = async () => {
      if (!item?.id) return;
      setLoading(true);
      try {
        const data = await fetchPegawaiById(item.id);
        setPegawai(data);
      } catch (error) {
        console.error("Gagal mengambil detail pegawai:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [item]);

  if (loading) return <div>Memuat data pegawai...</div>;
  if (!pegawai)
    return <div className="text-muted-theme-theme">Tidak ada data pegawai.</div>;

  return (
    <>
      {/* Detail Pegawai */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Detail Pegawai</h6>
        </div>
        <div className="card-body px-3 py-2">
          {[
            ["NIK", pegawai.nik],
            ["Nama", pegawai.employee_nm],
            ["Tempat Lahir", pegawai.place_of_birth],
            ["Tanggal Lahir", formatDate(pegawai.birth_dt)],
            ["Status Pegawai", pegawai.employee_sts],
          ].map(([label, value], i) => (
            <div className="row mb-2" key={i}>
              <div className="col-4 fw-bold">{label}</div>
              <div className="col-8 text-muted-theme">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default DetailPegawai;
