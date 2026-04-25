import React from 'react';
import AsyncSelect from 'react-select/async';
import { searchUnit } from '../../../api/UnitSearch';

const SearchSelectUnit = ({
  value,
  onChange,
  placeholder = "Cari nama unit...",
  isClearable = true,
}) => {
  const loadOptions = async (inputValue) => {
    // kalau tidak ada input, ambil semua unit (limit 20)
    const data = await searchUnit(inputValue || "");
    return data.map((unit) => ({
      label: `${unit.nama} (${unit.service_unit_code})`,
      value: unit.srvc_unit_id,
      raw: unit,
    }));
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      className="w-100"
    />
  );
};

export default SearchSelectUnit;
