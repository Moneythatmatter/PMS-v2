// Pricing and urgency surcharge calculations for guest laundry

export const LAUNDRY_GST_RATE = 0;

export const calculateSurcharge = (
  baseRate: number,
  _urgency?: string,
): number => {
  return baseRate;
};

export const calculateTax = (
  _charges: number,
  _gstRate: number = LAUNDRY_GST_RATE,
): number => {
  return 0;
};

export const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;
