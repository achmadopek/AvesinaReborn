// services/mobay/taxCalculationService.js

const roundMoney = (value) => {
  return Math.round(Number(value || 0));
};

const calculateTax = ({
  totalTagihan = 0,
  jenisPajak = "PPH22" // future proof
}) => {

  const total = Number(totalTagihan || 0);

  // =========================
  // DPP
  // =========================
  const dpp = total / 1.11;

  // user maunya:
  // pajak dihitung dari DPP rounded
  const dppRounded = roundMoney(dpp);

  // =========================
  // PPN
  // =========================
  const ppn = dppRounded * 0.11;
  const ppnRounded = roundMoney(ppn);

  // =========================
  // PPh
  // =========================
  let pphRate = 0.015;

  if (jenisPajak === "PPH23") {
    pphRate = 0.02;
  }

  const pph = dppRounded * pphRate;
  const pphRounded = roundMoney(pph);

  return {
    dpp,
    dpp_rounded: dppRounded,

    ppn,
    ppn_rounded: ppnRounded,

    pph,
    pph_rounded: pphRounded
  };
};

module.exports = {
  calculateTax,
  roundMoney
};