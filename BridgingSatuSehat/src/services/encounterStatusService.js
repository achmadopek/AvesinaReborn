// src/services/encounterStatusService.js
const axios = require("axios");
const config = require("../config/database");
const { getToken } = require("./authService");
const logger = require("../helpers/logger");
const { formatDateForSatuSehat } = require("../helpers/dateHelper");
const simrs = require("../db/simrs");

/**
 * UPDATE ENCOUNTER STATUS
 * @param {string} encounterId - UUID Encounter di SatuSehat
 * @param {string} status - 'in-progress' | 'finished'
 * @param {object} periodData - { start, end }
 * @param {object} extraData - { practitionerId, locationUuid, etc }
 */
async function updateEncounterStatus(
  encounterId,
  status,
  periodData,
  extraData = {},
) {
  try {
    const token = await getToken();

    // 1. GET Encounter existing
    const getResponse = await axios.get(
      `${config.api.baseUrl}/Encounter/${encounterId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const existingEncounter = getResponse.data;

    // 2. Build update payload
    const payload = {
      resourceType: "Encounter",
      id: existingEncounter.id,
      identifier: existingEncounter.identifier || [],
      status: status,
      class: existingEncounter.class,
      subject: existingEncounter.subject,
      participant: existingEncounter.participant || [],
      period: {
        start:
          existingEncounter.period?.start ||
          formatDateForSatuSehat(periodData.start),
        end: periodData.end
          ? formatDateForSatuSehat(periodData.end)
          : undefined,
      },
      location: existingEncounter.location || [],
      statusHistory: existingEncounter.statusHistory || [],
    };

    // Tambahkan status baru ke statusHistory
    const newStatusHistory = {
      status: status,
      period: {
        start: formatDateForSatuSehat(periodData.start),
      },
    };

    if (periodData.end) {
      newStatusHistory.period.end = formatDateForSatuSehat(periodData.end);
    }

    // Cari status sebelumnya, update jika ada
    const existingIndex = payload.statusHistory.findIndex(
      (s) => s.status === status,
    );
    if (existingIndex >= 0) {
      payload.statusHistory[existingIndex] = newStatusHistory;
    } else {
      payload.statusHistory.push(newStatusHistory);
    }

    // Tambahkan serviceProvider jika belum ada
    if (!payload.serviceProvider) {
      payload.serviceProvider = {
        reference: `Organization/${config.api.orgId}`,
      };
    }

    // 3. PUT update
    const response = await axios.put(
      `${config.api.baseUrl}/Encounter/${encounterId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.id) {
      logger.info(`✅ Encounter ${encounterId} updated to ${status}`);
      return { success: true, data: response.data };
    }

    return { success: false, error: "Unknown response" };
  } catch (error) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      const issues = error.response?.data?.issue || [];
      const errors = issues.map((i) => i.details?.text || i.code).join(", ");
      logger.error(`❌ Validation error: ${errors}`);
      return { success: false, error: errors };
    }
    logger.error(
      `❌ Update encounter failed:`,
      error.response?.data || error.message,
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * UPDATE ENCOUNTER TO IN-PROGRESS
 */
async function updateEncounterToInProgress(registryId, encounterId, startDate) {
  logger.info(`📤 Updating encounter ${encounterId} to in-progress`);

  // Ambil data inprogress dari SIMRS
  const [rows] = await simrs.query(
    `
    SELECT 
      uv.serviced_start,
      uv.serviced_end
    FROM registry r
    LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
    WHERE r.registry_id = ?
    ORDER BY uv.unit_visit_dt ASC
    LIMIT 1
    `,
    [registryId],
  );

  const periodData = {
    start: rows[0]?.serviced_start || startDate,
    end: rows[0]?.serviced_end || null,
  };

  return await updateEncounterStatus(encounterId, "in-progress", periodData);
}

/**
 * UPDATE ENCOUNTER TO FINISHED
 */
async function updateEncounterToFinished(registryId, encounterId, startDate) {
  logger.info(`📤 Updating encounter ${encounterId} to finished`);

  // Ambil data finished dari SIMRS
  const [rows] = await simrs.query(
    `
    SELECT 
      uv.serviced_start,
      uv.serviced_end
    FROM registry r
    LEFT JOIN unit_visit uv ON r.registry_id = uv.registry_id
    WHERE r.registry_id = ?
    ORDER BY uv.unit_visit_dt DESC
    LIMIT 1
    `,
    [registryId],
  );

  const periodData = {
    start: rows[0]?.serviced_start || startDate,
    end: rows[0]?.serviced_end || new Date().toISOString(),
  };

  return await updateEncounterStatus(encounterId, "finished", periodData);
}

module.exports = {
  updateEncounterStatus,
  updateEncounterToInProgress,
  updateEncounterToFinished,
};
