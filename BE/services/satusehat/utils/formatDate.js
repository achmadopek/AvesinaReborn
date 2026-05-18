const dayjs = require("dayjs");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

function formatDate(date) {

  return dayjs(date)
    .tz("Asia/Jakarta")
    .format("YYYY-MM-DDTHH:mm:ssZ");
}

module.exports = formatDate;