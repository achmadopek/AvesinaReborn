import { useEffect, useState } from "react";
import { fetchKomponenById } from "../../../../api/wj_thp/KomponenPenghasilan";
import { formatNumber } from "../../../../utils/FormatNumber";

const DetailKomponenPenghasilan = ({ item }) => {
  const [komponen, setKomponen] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="card shadow-sm card-theme">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Detail Komponen Penghasilan</h6>
      </div>
      <div className="card-body px-3 py-2">
        {[
          ["Kode", komponen.penghasilan_code],
          ["Nama", komponen.penghasilan_nm],
          ["Berlaku Untuk", komponen.employee_sts || "Semua Karyawan"],
          ["Golongan", komponen.golongan || "Semua Golongan"],
          ["Pendidikan", komponen.education || "Semua Jenjang Pendidikan"],
          ["Job Status", komponen.job_sts || "Semua Jabatan"],
          ["Unit", komponen.unit_nm || "Semua Unit"],
          [
            "Nilai Default",
            "Rp." + formatNumber(komponen.default_nilai) + ",-" || 0,
          ],
        ].map(([label, value], i) => (
          <div className="row mb-2" key={i}>
            <div className="col-4 fw-bold">{label}</div>
            <div className="col-8 text-muted-theme">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailKomponenPenghasilan;
