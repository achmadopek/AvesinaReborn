const AntrianForm = ({ form, handleChange, handleSubmit }) => {
  return (
    <>
      <form className="form-theme" onSubmit={handleSubmit}>
        {/* SEARCH COMPONENT */}
        <div className="form-group">
          <input
            id="search"
            name="search"
            autoComplete="off"
            style={{ padding: "20px", fontSize: "20pt", textAlign: "center" }}
            value={form.search}
            onChange={handleChange}
            required
            placeholder="KETIK KODE BOOKING / NIK / NRM / NAMA PASIEN / POLI"
          />
        </div>
      </form>
    </>
  );
};

export default AntrianForm;
