const FormPenghasilanPegawai = ({
  employeeSts,
  setEmployeeSts,
  periode,
  setPeriode,
  handleGenerate,
  isLoadingGenerate,
}) => {
  return (
    <div className="row mb-3">
      {/* Status Pegawai */}
      <div className="col-md-4">
        <label htmlFor="employeeSts">Status Pegawai</label>
        <select
          id="employeeSts"
          className="form-control form-control-sm"
          value={employeeSts}
          onChange={(e) => setEmployeeSts(e.target.value)}
        >
          <option value="">Semua</option>
          <option value="PNS">PNS</option>
          <option value="PPPK">PPPK</option>
          <option value="HONORER">HONORER</option>
          <option value="BLUD">BLUD</option>
          <option value="MOU">MOU</option>
        </select>
      </div>

      {/* Input Periode (Bulan + Tahun) */}
      <div className="col-md-4">
        <label htmlFor="periode">Periode</label>
        <input
          id="periode"
          type="month"
          className="form-control form-control-sm"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
        />
      </div>

      {/* Tombol Generate */}
      <div className="col-md-4 d-flex align-items-end">
        <button
          className="btn btn-outline-success w-100"
          onClick={handleGenerate}
          disabled={isLoadingGenerate}
        >
          {isLoadingGenerate ? "Mengambil data..." : "Generate"}
        </button>
      </div>
    </div>
  );
};

export default FormPenghasilanPegawai;
