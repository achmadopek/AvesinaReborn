require("dotenv").config();

const sendEncounter =
  require("../senders/encounterSender");

async function main() {

  try {

    const result =
      await sendEncounter(
        "260505073007213914RSJK"
      );

    console.log(result);

  } catch(err) {

    console.log(err);

  }
}

main();