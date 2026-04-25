import { useState, useEffect } from "react";
import SearchSelectPegawai from '../../../components/search/SearchSelectPegawai';

const FormLaporanTHP = ({ filters, onChange, handleGenerate, handleGenerateRinci, isLoadingGenerate }) => {
  const [jenisFilters, setJenisFilters] = useState("");
  const [komponenList, setKomponenList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Ambil data komponen penghasilan
  useEffect(() => {
    if (jenisFilters === "penghasilanId") {
      import("../../../api/wj_thp/KomponenPenghasilan")
        .then(({ fetchPaginatedData }) =>
          fetchPaginatedData(1, 1000)
            .then((res) => setKomponenList(Array.isArray(res.data) ? res.data : []))
            .catch(() => setKomponenList([]))
        );
    }
  }, [jenisFilters]);

  // Ambil list Group
  useEffect(() => {
    if (jenisFilters === "grupUnit") {
      import("../../../api/wj_thp/LaporanTHP")
        .then(({ getGroupUnit }) =>
          getGroupUnit()
            .then((data) => setGroupList(Array.isArray(data) ? data : []))
            .catch(() => setGroupList([]))
        );
    }
  }, [jenisFilters]);

  // Ambil list Unit saat group dipilih
  useEffect(() => {
    if (!selectedGroup) {
      setUnitList([]);
      setSelectedUnit("");
      return;
    }
    import("../../../api/wj_thp/LaporanTHP")
      .then(({ getUnitByGroup }) =>
        getUnitByGroup(selectedGroup)
          .then((data) => setUnitList(Array.isArray(data) ? data : []))
          .catch(() => setUnitList([]))
      );
    setSelectedUnit("null");
  }, [selectedGroup]);

  return (
    <div className="row mb-3 align-items-end">
      {/* Kiri: Rentang Waktu */}
      <div className="col-12 col-md-4 gap-2">
        <p
          style={{
            border: "1px solid lightgrey",
            borderRadius: "4px",
            padding: "5px",
            marginBottom: "12px",
            background: "#e3e2e1",
          }}
        >
          Rentang Waktu Laporan
        </p>

        <div className="row g-2">
          <div className="col-12 col-sm-6">
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.date_range?.[0] || ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange("date_range", [val, filters.date_range?.[1] || ""]);
              }}
            />
          </div>
          <div className="col-12 col-sm-6">
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.date_range?.[1] || ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange("date_range", [filters.date_range?.[0] || "", val]);
              }}
            />
          </div>
        </div>
      </div>

      {/* Tengah: Jenis Filter */}
      <div className="col-md-4 d-flex flex-column gap-2">
        <select
          className="form-control form-control-smmb-2"
          value={jenisFilters}
          onChange={(e) => {
            const val = e.target.value;
            setJenisFilters(val);
            onChange("employee_sts", "");
            onChange("penghasilan_id", "");
            onChange("groupUnit", "");
            setSelectedGroup("");
            setSelectedUnit("");
          }}
        >
          <option value="">-- Pilih --</option>
          <option value="employeeSts">Status Pegawai</option>
          <option value="penghasilanId">Komponen Penghasilan</option>
          <option value="grupUnit">Group/Unit</option>
          <option value="individu">Per Individu</option>
        </select>

        {!jenisFilters &&
          <p style={{ border: '1px solid lightgrey', borderRadius: '4px', padding: '5px', margin: 0, background: '#e3e2e1' }}>
            Pilih Jenis Laporan dulu
          </p>
        }

        {jenisFilters === "employeeSts" && (
          <select
            className="form-control form-control-sm"
            value={filters.employee_sts || ""}
            onChange={(e) => onChange("employee_sts", e.target.value)}
          >
            <option value="">-- Pilih --</option>
            <option value="PNS,PPPK">ASN</option>
            <option value="HONORER,BLUD,MOU">Non-ASN</option>
          </select>
        )}

        {jenisFilters === "penghasilanId" && (
          <select
            className="form-control form-control-sm"
            value={filters.penghasilan_id || ""}
            onChange={(e) => onChange("penghasilan_id", e.target.value)}
          >
            <option value="">-- Pilih --</option>
            {komponenList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.penghasilan_code} - {k.penghasilan_nm}
              </option>
            ))}
          </select>
        )}

        {jenisFilters === "grupUnit" && (
          <div className="d-flex gap-2">
            <select
              className="form-control form-control-sm"
              value={selectedGroup}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGroup(val);
                setSelectedUnit("null");
                onChange("groupUnit", `${val},null`);
              }}
            >
              <option value="">-- Pilih Group --</option>
              {groupList.map((g) => (
                <option key={g.unit_group_id} value={g.unit_group_id}>
                  {g.unit_group_code} - {g.unit_group_name}
                </option>
              ))}
            </select>

            <select
              className="form-control form-control-sm"
              value={selectedUnit}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUnit(val);
                onChange("groupUnit", `${selectedGroup},${val}`);
              }}
              disabled={!selectedGroup}
            >
              <option value="null">-- Semua Unit Terkait --</option>
              {unitList.map((u) => (
                <option key={u.srvc_unit_id} value={u.srvc_unit_id}>
                  {u.service_unit_code} - {u.srvc_unit_nm}
                </option>
              ))}
            </select>
          </div>
        )}

        {jenisFilters === "individu" && (
          <SearchSelectPegawai
            value={
              filters.peg_id
                ? { value: filters.peg_id, label: filters.nama_pegawai }
                : null
            }
            onChange={(option) =>
              onChange("individu", {
                peg_id: option?.value || "",
                nama_pegawai: option?.label || "",
              })
            }
          />
        )}
      </div>

      {/* Kanan: Tombol */}
      <div className="col-md-4 d-flex flex-column gap-2">
        <button
          className="btn btn-success w-100 mb-2"
          onClick={() => handleGenerate(filters.date_range)}
          disabled={isLoadingGenerate}
        >
          {isLoadingGenerate ? "Mengambil data..." : "Rekapitulasi"}
        </button>
        <button
          className="btn btn-primary w-100"
          onClick={() => handleGenerateRinci(filters.date_range)}
          disabled={isLoadingGenerate}
        >
          {isLoadingGenerate ? "Mengambil data..." : "Rincian"}
        </button>
      </div>
    </div>
  );
};

export default FormLaporanTHP;
