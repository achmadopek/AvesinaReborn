require("dotenv").config();

const db = require("./src/db/postgres");

(async () => {
  try {
    const result = await db.query("SELECT NOW()");
    console.log(result.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);

    process.exit(1);
  }
})();