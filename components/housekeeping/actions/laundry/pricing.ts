// Pricing and urgency surcharge calculations for guest laundry

export const LAUNDRY_GST_RATE = 0.12;

export const calculateSurcharge = (
  baseRate: number,
  urgency: "Normal" | "Same-Day" | "Express",
): number => {
  if (urgency === "Same-Day") {
    return Math.round(baseRate * 1.25 * 100) / 100;
  }
  if (urgency === "Express") {
    return Math.round(baseRate * 1.55 * 100) / 100;
  }
  return baseRate;
};

export const calculateTax = (
  charges: number,
  gstRate: number = LAUNDRY_GST_RATE,
): number => {
  return Math.round(charges * gstRate * 100) / 100;
};

export const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;
