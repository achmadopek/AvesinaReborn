import React from "react";
import AsyncSelect from "react-select/async";
import { searchBidang } from "../../api/admin/MasterUnitSPM";

const SearchSelectBidang = ({
    value,
    onChange,
    placeholder = "Cari bidang...",
    isClearable = true,
    disabled = false,
    styles = {},
    className = "",
}) => {

    const loadOptions = async (inputValue) => {

        try {

            const data = await searchBidang(inputValue);

            return data.map((it) => ({
                label: `${it.kode_bidang} - ${it.nama_bidang}`,
                value: it.id,
            }));

        } catch (err) {

            console.error("Search bidang error:", err);
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

export default SearchSelectBidang;