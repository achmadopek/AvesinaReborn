const fs = require("fs");
const dicomParser = require("dicom-parser");
const jpeg = require("jpeg-js");

/**
 * ==========================================
 * DICOM -> JPG THUMBNAIL
 * Support:
 * - 8 bit
 * - 16 bit grayscale
 * - MONOCHROME1 / MONOCHROME2
 * - Auto normalize
 * - Basic windowing
 * ==========================================
 */
const dicomToJpg = (dicomPath, outputPath) => {
  try {
    // ==========================================
    // READ FILE
    // ==========================================
    const byteArray = new Uint8Array(
      fs.readFileSync(dicomPath)
    );

    const dataSet = dicomParser.parseDicom(byteArray);

    // ==========================================
    // PIXEL DATA
    // ==========================================
    const pixelDataElement =
      dataSet.elements.x7fe00010;

    if (!pixelDataElement) {
      throw new Error("PixelData tidak ditemukan");
    }

    // ==========================================
    // METADATA
    // ==========================================
    const width =
      dataSet.uint16("x00280011");

    const height =
      dataSet.uint16("x00280010");

    const bitsAllocated =
      dataSet.uint16("x00280100") || 8;

    const bitsStored =
      dataSet.uint16("x00280101") || bitsAllocated;

    const samplesPerPixel =
      dataSet.uint16("x00280002") || 1;

    const photometric =
      dataSet.string("x00280004") ||
      "MONOCHROME2";

    const pixelRepresentation =
      dataSet.uint16("x00280103") || 0;

    const transferSyntax =
      dataSet.string("x00020010");

    const windowCenterRaw =
      dataSet.string("x00281050");

    const windowWidthRaw =
      dataSet.string("x00281051");

    const rescaleIntercept =
      parseFloat(
        dataSet.string("x00281052") || 0
      );

    const rescaleSlope =
      parseFloat(
        dataSet.string("x00281053") || 1
      );

    if (!width || !height) {
      throw new Error(
        "Dimensi gambar tidak valid"
      );
    }

    console.log("========== DICOM INFO ==========");
    console.log({
      width,
      height,
      bitsAllocated,
      bitsStored,
      samplesPerPixel,
      photometric,
      pixelRepresentation,
      transferSyntax,
      windowCenterRaw,
      windowWidthRaw,
      rescaleIntercept,
      rescaleSlope,
    });

    // ==========================================
    // COMPRESSED CHECK
    // ==========================================
    const compressedSyntaxes = [
      "1.2.840.10008.1.2.4.50",
      "1.2.840.10008.1.2.4.57",
      "1.2.840.10008.1.2.4.70",
      "1.2.840.10008.1.2.4.80",
      "1.2.840.10008.1.2.4.90",
    ];

    if (
      compressedSyntaxes.includes(
        transferSyntax
      )
    ) {
      throw new Error(
        "Compressed DICOM belum didukung. Gunakan DCMTK/pydicom."
      );
    }

    // ==========================================
    // GET PIXEL ARRAY
    // ==========================================
    let pixelData;

    const pixelCount = width * height;

    if (bitsAllocated === 16) {
      if (pixelRepresentation === 1) {
        // SIGNED
        pixelData = new Int16Array(
          dataSet.byteArray.buffer,
          pixelDataElement.dataOffset,
          pixelCount
        );
      } else {
        // UNSIGNED
        pixelData = new Uint16Array(
          dataSet.byteArray.buffer,
          pixelDataElement.dataOffset,
          pixelCount
        );
      }
    } else {
      pixelData = new Uint8Array(
        dataSet.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelCount
      );
    }

    // ==========================================
    // APPLY RESCALE
    // ==========================================
    const scaledPixels = new Float32Array(
      pixelCount
    );

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < pixelCount; i++) {
      let value =
        pixelData[i] * rescaleSlope +
        rescaleIntercept;

      scaledPixels[i] = value;

      if (value < min) min = value;
      if (value > max) max = value;
    }

    // ==========================================
    // WINDOWING
    // ==========================================
    let windowCenter = null;
    let windowWidth = null;

    if (windowCenterRaw && windowWidthRaw) {
      windowCenter = parseFloat(
        windowCenterRaw.split("\\")[0]
      );

      windowWidth = parseFloat(
        windowWidthRaw.split("\\")[0]
      );
    }

    // fallback auto window
    if (!windowCenter || !windowWidth) {
      windowCenter = (max + min) / 2;
      windowWidth = max - min;
    }

    console.log({
      min,
      max,
      windowCenter,
      windowWidth,
    });

    // ==========================================
    // RGBA BUFFER
    // ==========================================
    const frameData = Buffer.alloc(
      pixelCount * 4
    );

    for (let i = 0; i < pixelCount; i++) {
      let value = scaledPixels[i];

      // windowing
      let gray =
        ((value -
          (windowCenter - 0.5)) /
          (windowWidth - 1) +
          0.5) *
        255;

      gray = Math.max(
        0,
        Math.min(255, gray)
      );

      gray = Math.round(gray);

      // MONOCHROME1 = invert
      if (photometric === "MONOCHROME1") {
        gray = 255 - gray;
      }

      frameData[i * 4 + 0] = gray;
      frameData[i * 4 + 1] = gray;
      frameData[i * 4 + 2] = gray;
      frameData[i * 4 + 3] = 255;
    }

    // ==========================================
    // JPEG ENCODE
    // ==========================================
    const rawImageData = {
      data: frameData,
      width,
      height,
    };

    const jpegImage =
      jpeg.encode(rawImageData, 90);

    fs.writeFileSync(
      outputPath,
      jpegImage.data
    );

    console.log(
      "DICOM THUMBNAIL SUCCESS:",
      outputPath
    );

    return {
      success: true,
      filename:
        outputPath.split("/").pop(),
      width,
      height,
      bitsAllocated,
      photometric,
    };
  } catch (err) {
    console.error(
      "DICOM TO JPG ERROR:",
      err
    );

    return {
      success: false,
      message: err.message,
    };
  }
};

module.exports = {
  dicomToJpg,
};