// Pricing and urgency surcharge calculations for guest laundry

export const calculateSurcharge = (baseRate: number, urgency: "Normal" | "Same-Day" | "Express"): number => {
  if (urgency === "Same-Day") {
    return Math.round(baseRate * 1.25);
  }
  if (urgency === "Express") {
    return Math.round(baseRate * 1.55);
  }
  return baseRate;
};

export const calculateTax = (charges: number, gstRate: number = 0.18): number => {
  return Math.round(charges * gstRate);
};
