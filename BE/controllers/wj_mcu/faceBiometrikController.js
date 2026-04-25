const dbL = require("../../db/connection-lokal");
const path = require("path");

exports.getFaceByMcuId = async (req, res) => {
  const { mcu_id } = req.params;

  try {
    const [rows] = await dbL.promise().query(
      `
      SELECT fb.face_image
      FROM mcu_face_biometrik fb
      JOIN mcu_mirror mm ON mm.patient_id = fb.patient_id
      WHERE mm.mcu_id = ?
      LIMIT 1
      `,
      [mcu_id]
    );

    if (!rows.length) {
      return res.json({
        success: true,
        photo: null
      });
    }

    res.json({
      success: true,
      photo: rows[0].face_image
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};