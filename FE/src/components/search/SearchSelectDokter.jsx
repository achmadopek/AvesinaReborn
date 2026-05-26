import React from "react";
import AsyncSelect from "react-select/async";

import {
  searchDokter
} from "../../api/wj_sdm/MasterPegawai";

const SearchSelectDokter = ({
  value,
  onChange,
  placeholder = "Cari dokter...",
  isClearable = true,
  disabled = false,
  styles = {},
  className = "",
}) => {

  // =========================================
  // LOAD OPTIONS
  // =========================================
  const loadOptions = async (
    inputValue
  ) => {

    try {

      const data =
        await searchDokter(inputValue);

      return data.map((dokter) => ({

        label:
          dokter.employee_nm,

        value:
          dokter.employee_id,

        data: dokter

      }));

    } catch (err) {

      console.error(
        "Search dokter error:",
        err
      );

      return [];

    }

  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={[
        {
          label: "Semua Dokter",
          value: ""
        }
      ]}
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

export default SearchSelectDokter;