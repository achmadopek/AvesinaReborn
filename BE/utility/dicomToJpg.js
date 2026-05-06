const fs = require("fs");
const dicomParser = require("dicom-parser");
const jpeg = require("jpeg-js");

const dicomToJpg = (dicomPath, outputPath) => {
  try {
    const byteArray = new Uint8Array(fs.readFileSync(dicomPath));
    const dataSet = dicomParser.parseDicom(byteArray);

    const pixelDataElement = dataSet.elements.x7fe00010;

    if (!pixelDataElement) {
      throw new Error("PixelData tidak ditemukan");
    }

    const pixelData = new Uint8Array(
      dataSet.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );

    const width = dataSet.uint16("x00280011");
    const height = dataSet.uint16("x00280010");

    if (!width || !height) {
      throw new Error("Dimensi gambar tidak valid");
    }

    const frameData = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const val = pixelData[i];

      frameData[i * 4 + 0] = val;
      frameData[i * 4 + 1] = val;
      frameData[i * 4 + 2] = val;
      frameData[i * 4 + 3] = 255;
    }

    const rawImageData = {
      data: frameData,
      width,
      height,
    };

    const jpegImage = jpeg.encode(rawImageData, 85);

    fs.writeFileSync(outputPath, jpegImage.data);

    return {
      success: true,
      filename: outputPath.split("/").pop(),
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
};

module.exports = { dicomToJpg };