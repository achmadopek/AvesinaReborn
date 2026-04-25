// src/pages/laporan/DataLaporanGrid.js
import { formatNumber } from "../../../utils/FormatNumber";

export default function DataLaporanRinci({ data, onCetakPDF, onCetakSheet }) {
  return (
    <>
      <div
        className="table-responsive"
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        <table className="table table-theme table-sm table-bordered">
          <thead>
            <tr>
              <th className="text-center align-middle">No</th>
              <th className="text-center align-middle">Nama Pegawai</th>
              <th className="text-center align-middle">Status</th>
              <th className="text-center align-middle">Rincian Penghasilan</th>
              <th className="text-center align-middle">Rincian Potongan</th>
              <th className="text-center align-middle">Take Home Pay</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.employee_nm}</td>
                <td>{row.employee_sts}</td>

                {/* Rincian Penghasilan */}
                <td>
                  <table className="table table-theme table-sm mb-0">
                    <tbody>
                      <tr className="fw-bold">
                        <td>
                          <b>TOTAL PENGHASILAN</b>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <b>{formatNumber(row.total_penghasilan)}</b>
                        </td>
                      </tr>
                      {row.rincian_penghasilan?.map((item, i) => (
                        <tr key={i}>
                          <td>
                            {i + 1}. {item.penghasilan_code}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatNumber(item.nilai)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>

                {/* Rincian Potongan */}
                <td>
                  <table className="table table-theme table-sm mb-0">
                    <tbody>
                      <tr className="fw-bold">
                        <td>
                          <b>TOTAL POTONGAN</b>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <b>{formatNumber(row.total_potongan)}</b>
                        </td>
                      </tr>
                      {row.rincian_potongan?.map((item, i) => (
                        <tr key={i}>
                          <td>
                            {i + 1}. {item.potongan_code}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatNumber(item.nilai)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>

                <td style={{ textAlign: "right" }}>
                  <b>{formatNumber(row.thp)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end mt-3">
          <button
            className="btn btn-outline-danger px-4 mb-2 ms-2"
            onClick={onCetakPDF}
            disabled={!data.length}
          >
            Cetak PDF
          </button>

          <button
            className="btn btn-outline-success px-4 mb-2 ms-2"
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
