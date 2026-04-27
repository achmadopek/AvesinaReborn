export const validatePayload = (data) => {
  if (!data.hasil_bacaan) throw "Hasil bacaan kosong";
  //if (!data.foto1) throw "Foto minimal 1 wajib";
  if (!data.patient_ihs) throw new Error("patient_ihs kosong");
  if (!data.encounter_uuid) throw new Error("encounter_uuid kosong");
  if (!data.practitioner_ihs) throw new Error("practitioner_ihs kosong");
  if (!data.measured_dt) throw new Error("measured_dt kosong");
};