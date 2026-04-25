// src/pages/laporan/DataLaporanGrid.js
import React from "react";
import { formatNumber } from "../../../utils/FormatNumber";

export default function DataLaporanGrid({ data, onCetakPDF, onCetakSheet }) {
  return (
    <>
      <div
        className="table-responsive"
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        <table className="table table-theme table-sm table-bordered">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pegawai</th>
              <th>Status</th>
              <th>Total Penghasilan</th>
              <th>Total Potongan</th>
              <th>Take Home Pay</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.employee_nm}</td>
                <td>{row.employee_sts}</td>
                <td className="text-right">
                  {formatNumber(row.total_penghasilan)}
                </td>
                <td className="text-right">
                  {formatNumber(row.total_potongan)}
                </td>
                <td className="fw-bold text-right">{formatNumber(row.thp)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end mt-3">
          <button
            className="btn btn-outline-danger px-4 mb-2 ms-2"
            style={{ marginLeft: "14px" }}
            onClick={onCetakPDF}
            disabled={!data.length}
          >
            Cetak PDF
          </button>

          <button
            className="btn btn-outline-success px-4 mb-2 ms-2"
            style={{ marginLeft: "14px" }}
            onClick={onCetakSheet}
            disabled={!data.length}
          >
            Cetak Worksheet
          </button>
        </div>
      </div>
    </>
  );
}
