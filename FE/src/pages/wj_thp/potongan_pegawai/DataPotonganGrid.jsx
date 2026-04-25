import React, { useEffect, useState } from "react";
import { formatNumber, parseNumber } from "../../../utils/FormatNumber";
import { unpivotPotonganData } from "../../../utils/pivotPotongan";

import LoadingOverlay from "../../../components/LoadingOverlay";

export default function DataPotonganGrid({
  rawData,
  data,
  komponenMapping,
  onSave,
  onEndroll,
  isSaving,
  isLocked,
}) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(data || []);
  }, [data]);

  const handleChange = (rowIndex, kode, value) => {
    const parsedValue = parseNumber(value);
    const updatedRows = [...rows];
    const updatedRow = { ...updatedRows[rowIndex] };

    updatedRow[kode] = parsedValue;

    const komponenIndex = updatedRow.komponen.findIndex(
      (k) => k.potongan_code === kode
    );

    if (komponenIndex !== -1) {
      updatedRow.komponen[komponenIndex] = {
        ...updatedRow.komponen[komponenIndex],
        nilai: parsedValue,
      };
    }

    updatedRows[rowIndex] = updatedRow;
    setRows(updatedRows);
  };

  const handleSaveClick = () => {
    const unpivoted = unpivotPotonganData(rows, komponenMapping);
    onSave(unpivoted);
  };

  return (
    <div
      className="table-responsive"
      style={{ maxHeight: "calc(100vh - 250px)" }}
    >
      <table className="table table-theme table-sm table-bordered">
        <thead
          className="bg-sae text-white"
          style={{ position: "sticky", top: "-1px", zIndex: 2 }}
        >
          <tr>
            <th>No</th>
            <th>Pegawai</th>
            <th>Status</th>
            {komponenMapping.map((k) => (
              <th key={k.code}>{k.code}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.peg_id}>
              <td>{rowIndex + 1}</td>
              <td>{row.employee_nm}</td>
              <td>{row.employee_sts}</td>
              {komponenMapping.map((k) => {
                const komponen = row.komponen?.find(
                  (c) => c.potongan_code === k.code
                );
                const nilai = row[k.code] ?? komponen?.nilai ?? 0;
                const cellLocked = komponen?.is_locked === 1;

                return (
                  <td key={k.code}>
                    {komponen ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control form-control-sm text-end"
                        value={formatNumber(nilai)}
                        onChange={(e) =>
                          handleChange(rowIndex, k.code, e.target.value)
                        }
                        disabled={cellLocked}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-end mt-3">
        {!isLocked && (
          <button
            className="btn btn-outline-primary px-4 mb-2"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            Simpan
          </button>
        )}
        {onEndroll && (
          <button
            className="btn btn-outline-danger px-4 mb-2 ms-2"
            style={{ marginLeft: "14px" }}
            onClick={onEndroll}
            disabled={isSaving || isLocked}
          >
            Kunci Data
          </button>
        )}

        <LoadingOverlay show={isSaving} message="Menyimpan data..." />
      </div>
    </div>
  );
}
