export const validatePayload = (data) => {
  if (!data.patient_id) throw "Patient ID kosong";
  if (!data.encounter_id) throw "Encounter kosong";
  if (!data.hasil_bacaan) throw "Hasil bacaan kosong";
  if (!data.foto1) throw "Foto minimal 1 wajib";
};