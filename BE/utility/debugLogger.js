const logSection = (title) => {
  console.log("\n==============================");
  console.log(title);
  console.log("==============================");
};

const logJSON = (label, data) => {
  console.log(`\n🔹 ${label}`);
  console.dir(data, { depth: null, colors: true });
};

const logError = (label, err) => {
  console.log(`\n❌ ${label}`);

  if (err instanceof Error) {
    console.log("Message:", err.message);
  } else {
    console.log("Raw Error:", err);
  }

  if (err.response) {
    console.log("Status:", err.response.status);
    console.dir(err.response.data, { depth: null });
  }
};

module.exports = {
  logSection,
  logJSON,
  logError,
};