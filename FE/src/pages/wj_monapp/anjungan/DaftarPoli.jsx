import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const DaftarPoli = ({ data }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleClick = (item) => {
    // navigasi ke DataAntrian dengan kode_poli
    navigate(`/data-antrian?kode=${item.kode}`);
  };

  return (
    <div className="card shadow-sm card-theme mt-3">
      <div className="card-header py-2 px-3">
        <h6 className="mb-0">Daftar Poli</h6>
      </div>
      <div className="card-body">
        <div className="row">
          {Array.isArray(data) && data.length > 0 ? (
            data.map((item, index) => (
              <div
                key={index}
                className="col-md-3 col-sm-6 mb-3"
                onClick={() => handleClick(item)}
                style={{ cursor: "pointer" }}
              >
                <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <span style={{ fontSize: "14pt" }}>{item.label}</span>
                  <span className="badge bg-primary">{item.kode}</span>
                  {role === "admin" && (
                    <small className="text-muted-theme-theme">{item.nama}</small>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-warning mb-0">Tidak Ada Data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaftarPoli;
