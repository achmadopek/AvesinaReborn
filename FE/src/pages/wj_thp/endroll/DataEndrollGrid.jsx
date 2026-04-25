import LoadingOverlay from "../../../components/LoadingOverlay";

export default function DataEndrollGrid({
  data,
  onSave,
  onEndroll,
  isLocked,
  isSaving,
}) {
  return (
    <div
      className="table-responsive"
      style={{ maxHeight: "calc(100vh - 250px)" }}
    >
      <table className="table table-theme table-sm table-bordered">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Pegawai</th>
            <th>Periode</th>
            <th>Total Penghasilan</th>
            <th>Total Potongan</th>
            <th>Take Home Pay</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{row.employee_nm}</td>
              <td>{row.periode}</td>
              <td>{Number(row.total_penghasilan).toLocaleString()}</td>
              <td>{Number(row.total_potongan).toLocaleString()}</td>
              <td className="fw-bold">{Number(row.thp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action Buttons */}
      <div className="d-flex justify-content-end mt-3">
        {!isLocked && (
          <button
            className="btn btn-outline-primary px-4 mb-2"
            onClick={() => onSave(data)}
            disabled={!data.length}
          >
            Save Generate
          </button>
        )}

        {!isLocked && (
          <button
            className="btn btn-outline-danger px-4 mb-2 ms-2"
            style={{ marginLeft: "14px" }}
            onClick={onEndroll}
            disabled={!data.length}
          >
            Endroll
          </button>
        )}

        {isLocked && (
          <span className="text-success fw-bold">
            Data sudah diendroll (locked)
          </span>
        )}
      </div>

      <LoadingOverlay show={isSaving} message="Menyimpan data..." />
    </div>
  );
}
