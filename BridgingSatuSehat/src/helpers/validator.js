// src/helpers/validator.js
class Validator {
  static validateNIK(nik) {
    if (!nik) return { valid: false, error: "NIK is required" };
    const nikStr = nik.toString().trim();
    if (nikStr.length !== 16) {
      return {
        valid: false,
        error: `NIK must be 16 digits (got ${nikStr.length})`,
        padded: nikStr.padStart(16, "0"),
      };
    }
    if (!/^\d+$/.test(nikStr)) {
      return { valid: false, error: "NIK must be numeric" };
    }
    return { valid: true, value: nikStr };
  }

  static validateDate(date) {
    if (!date) return { valid: false, error: "Date is required" };
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return { valid: false, error: "Invalid date format" };
    }
    return { valid: true, value: d.toISOString().split("T")[0] };
  }

  static validateGender(gender) {
    if (!gender) return { valid: false, error: "Gender is required" };
    const g = gender.toLowerCase();
    if (g === "l" || g === "m" || g === "male")
      return { valid: true, value: "male" };
    if (g === "p" || g === "f" || g === "female")
      return { valid: true, value: "female" };
    return { valid: true, value: "unknown" };
  }
}

module.exports = Validator;
