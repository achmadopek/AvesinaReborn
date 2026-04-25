import { useEffect, useState } from "react";
import { fetchKomponenById } from "../../../api/wj_thp/KomponenPotongan";

const DetailKomponenPotongan = ({ item }) => {
  // State data pegawai dan loading
  const [komponen, setKomponen] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ambil detail pegawai setiap kali item berubah
  useEffect(() => {
    const fetchDetail = async () => {
      if (!item?.id) return;
      setLoading(true);
      try {
        const data = await fetchKomponenById(item.id);
        setKomponen(data);
      } catch (error) {
        console.error("Gagal mengambil detail komponen:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [item]);

  if (loading) return <div>Memuat data komponen...</div>;
  if (!komponen)
    return <div className="text-muted-theme-theme">Tidak ada data komponen.</div>;

  return (
    <>
      {/* Detail Pegawai */}
      <div className="card shadow-sm card-theme">
        <div className="card-header py-2 px-3">
          <h6 className="mb-0">Detail Komponen</h6>
        </div>
        <div className="card-body px-3 py-2">
          {[
            ["Komponen Code", komponen.potongan_code],
            ["Nama Komponen", komponen.potongan_nm],
            ["Default Nilai", komponen.default_nilai],
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

export default DetailKomponenPotongan;
