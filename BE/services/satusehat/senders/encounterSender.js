const dbERM = require("../../../db/connection-erm");

const {
  satusehatClient
} = require("../clients/satusehatClient");

const buildEncounterPayload =
  require("../builders/encounterBuilder");

async function sendEncounter(registryId) {

  const [rows] = await dbERM.promise().query(`
    SELECT *
    FROM satusehat
    WHERE registry_id = ?
  `, [registryId]);

  if (!rows.length) {
    throw new Error("Data encounter tidak ditemukan");
  }

  const row = rows[0];

  if (row.encounter_uuid) {
    throw new Error("Encounter sudah terkirim");
  }

  if (!row.patient_ihs_number) {
    throw new Error("Patient IHS kosong");
  }

  if (!row.practitioner_ihs_number) {
    throw new Error("Practitioner IHS kosong");
  }

  if (!row.location_uuid) {
    throw new Error("Location UUID kosong");
  }

  const payload =
    buildEncounterPayload(row);

  console.log("PAYLOAD:");
  console.log(JSON.stringify(payload, null, 2));

  try {

    const response =
      await satusehatClient.post(
        "/Encounter",
        payload
      );

    console.log("RESPONSE:");
    console.log(response.data);

    await dbERM.promise().query(`
      UPDATE satusehat
      SET encounter_uuid = ?
      WHERE registry_id = ?
    `, [
      response.data.id,
      registryId
    ]);

    return {
      success: true,
      data: response.data
    };

  } catch(err) {

    console.log("ERROR:");

    console.log(
      JSON.stringify(
        err.response?.data || err.message,
        null,
        2
      )
    );

    return {
      success: false,
      error:
        err.response?.data || err.message
    };
  }
}

module.exports = sendEncounter;