import React from "react";
import AsyncSelect from "react-select/async";
import { searchGroupPelayanan } from "../../api/admin/MasterUnitSPM";

const SearchSelectGroupPelayanan = ({
    value,
    onChange,
    placeholder = "Cari group pelayanan...",
    isClearable = true,
    isMulti = false,
    disabled = false,
    styles = {},
    className = "",
}) => {

    const loadOptions = async (inputValue) => {

        try {

            const data = await searchGroupPelayanan(inputValue);

            return data.map((it) => ({
                label: `${it.kode_group} - ${it.nama_group}`,
                value: it.id,
            }));

        } catch (err) {

            console.error("Search group pelayanan error:", err);
            return [];

        }

    };

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions={true}
            loadOptions={loadOptions}
            value={isMulti ? (value || []) : value}
            onChange={onChange}
            placeholder={placeholder}
            isClearable={isClearable}
            isMulti={isMulti}
            isDisabled={disabled}
            className={className}
            styles={styles}
        />
    );
};

export default SearchSelectGroupPelayanan;