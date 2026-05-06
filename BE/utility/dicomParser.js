const fs = require("fs");
const dicomParser = require("dicom-parser");

const parseDicomUID = (filePath) => {
  try {
    const byteArray = fs.readFileSync(filePath);
    const dataSet = dicomParser.parseDicom(byteArray);

    const studyUID = dataSet.string("x0020000d");
    const seriesUID = dataSet.string("x0020000e");
    const sopUID = dataSet.string("x00080018");

    return {
      studyUID,
      seriesUID,
      sopUID,
    };
  } catch (err) {
    console.error("DICOM parse error:", err.message);
    return null;
  }
};

module.exports = { parseDicomUID };