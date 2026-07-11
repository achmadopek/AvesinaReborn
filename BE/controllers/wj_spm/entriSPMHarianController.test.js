const test = require("node:test");
const assert = require("node:assert/strict");

const { validateNumeratorDenominator } = require("./entriSPMHarianController");

test("non-proportion indicators skip numerator/denominator checks", () => {
  const result = validateNumeratorDenominator(10, 0, 0);
  assert.equal(result.valid, true);
  assert.equal(result.message, undefined);
});

test("proportion indicators still validate denominator and order", () => {
  assert.equal(validateNumeratorDenominator(10, 0, 1).valid, false);
  assert.equal(validateNumeratorDenominator(6, 5, 1).valid, false);
  assert.equal(validateNumeratorDenominator(4, 5, 1).valid, true);
});
