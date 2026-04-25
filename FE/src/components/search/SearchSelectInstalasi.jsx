import React from "react";
import AsyncSelect from "react-select/async";
import { searchInstalasi } from "../../api/admin/MasterUnitSPM";

const SearchSelectInstalasi = ({
    value,
    onChange,
    bidangId = null,
    placeholder = "Cari instalasi...",
    isClearable = true,
    disabled = false,
    styles = {},
    className = "",
}) => {

    const loadOptions = async (inputValue) => {

        if (!bidangId) return []; //  cegah jika bidang belum dipilih

        try {

            const data = await searchInstalasi(inputValue || "", bidangId);

            return data.map((it) => ({
                label: `${it.kode_instalasi} - ${it.nama_instalasi}`,
                value: it.id,
            }));

        } catch (err) {

            console.error("Search instalasi error:", err);
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
            isDisabled={disabled || !bidangId}  //  disable kalau belum ada bidang
            className={className}
            styles={styles}
        />
    );
};

export default SearchSelectInstalasi;