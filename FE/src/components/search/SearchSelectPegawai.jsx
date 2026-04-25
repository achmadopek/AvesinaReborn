import React from "react";
import AsyncSelect from "react-select/async";
import { searchPegawai } from "../../api/wj_sdm/MasterPegawai";

const SearchSelectPegawai = ({
  value,
  onChange,
  placeholder = "Cari nama pegawai...",
  isClearable = true,
  disabled = false,
  styles = {},
  className = "",
}) => {

  const loadOptions = async (inputValue) => {

    try {

      const data = await searchPegawai(inputValue);

      return data.map((peg) => ({
        label: peg.nama,   // <-- perbaikan
        value: peg.id,
      }));

    } catch (err) {

      console.error("Search pegawai error:", err);
      return [];

    }

  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={true}
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={disabled}
      className={className}
      styles={styles}
    />
  );
};

export default SearchSelectPegawai;