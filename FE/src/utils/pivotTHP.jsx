// utils/pivotPotongan.js
export function flattenRawPotonganData(data) {
  return data.map(item => {
    const flattened = {
      peg_id: item.peg_id,
      employee_nm: item.employee_nm,
      employee_sts: item.employee_sts,
      education: item.education,
    };

    if (item.komponen && Array.isArray(item.komponen)) {
      item.komponen.forEach(komp => {
        flattened[komp.potongan_code] = komp.nilai || 0;
        // Jika mau simpan ID juga: flattened[komp.potongan_code + '_id'] = komp.potongan_id;
      });
    }

    return flattened;
  });
}

// Mengubah kembali data dari flat ke bentuk simpan ke DB
export function unpivotPotonganData(rows, komponenMapping) {
  const result = [];

  rows.forEach(row => {
    komponenMapping.forEach(k => {
      const nilai = parseInt(row[k.code]) || 0;
      result.push({
        peg_id: row.peg_id,
        potongan_id: k.id,
        nilai
      });
    });
  });

  return result;
}
