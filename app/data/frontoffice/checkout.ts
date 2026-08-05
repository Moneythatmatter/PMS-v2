export interface CheckoutFolio {
  id: string;
  bookingId: string;
  guestName: string;
  phone: string;
  email?: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomCharges: number;
  restaurantCharges: number;
  laundry: number;
  miniBar: number;
  extraBed: number;
  otherCharges: number;
  gst: number;
  discount: number;
  advancePaid: number;
  isVip?: boolean;
  departingToday?: boolean;
}

export type SplittableChargeKey =
  | "restaurantCharges"
  | "laundry"
  | "miniBar"
  | "extraBed"
  | "otherCharges";

export const SPLITTABLE_CHARGE_LABELS: Record<SplittableChargeKey, string> = {
  restaurantCharges: "Restaurant Charges",
  laundry: "Laundry",
  miniBar: "Mini Bar",
  extraBed: "Extra Bed",
  otherCharges: "Other Charges",
};

const SPLITTABLE_KEYS: SplittableChargeKey[] = [
  "restaurantCharges",
  "laundry",
  "miniBar",
  "extraBed",
  "otherCharges",
];

export interface CheckoutBillGroup {
  id: string;
  label: string;
  chargeKeys: Array<SplittableChargeKey | "roomCharges">;
  charges: number;
  gst: number;
  discount: number;
  advance: number;
  due: number;
  isMain: boolean;
}

function sumFolioCharges(folio: CheckoutFolio) {
  return (
    folio.roomCharges +
    folio.restaurantCharges +
    folio.laundry +
    folio.miniBar +
    folio.extraBed +
    folio.otherCharges
  );
}

export function computeCheckoutTotals(folio: CheckoutFolio, discountOverride?: number) {
  const discount = discountOverride ?? folio.discount;
  const charges = sumFolioCharges(folio);
  const subtotalWithTax = charges + folio.gst;
  const grandTotal = subtotalWithTax - discount;
  const pending = Math.max(0, grandTotal - folio.advancePaid);
  return { charges, subtotalWithTax, grandTotal, pending, discount };
}

export function computeCheckoutBills(
  folio: CheckoutFolio,
  discountOverride?: number,
  separateCharges: SplittableChargeKey[] = [],
): { bills: CheckoutBillGroup[]; totals: ReturnType<typeof computeCheckoutTotals> } {
  const discount = discountOverride ?? folio.discount;
  const totals = computeCheckoutTotals(folio, discount);
  const totalCharges = sumFolioCharges(folio);

  if (separateCharges.length === 0 || totalCharges === 0) {
    return {
      bills: [
        {
          id: "main",
          label: "Consolidated Bill",
          chargeKeys: ["roomCharges", ...SPLITTABLE_KEYS.filter((k) => folio[k] > 0)],
          charges: totals.charges,
          gst: folio.gst,
          discount,
          advance: folio.advancePaid,
          due: totals.pending,
          isMain: true,
        },
      ],
      totals,
    };
  }

  const separateSet = new Set(separateCharges);
  const draftGroups: {
    id: string;
    label: string;
    chargeKeys: Array<SplittableChargeKey | "roomCharges">;
    charges: number;
    isMain: boolean;
  }[] = [];

  const mainKeys: Array<SplittableChargeKey | "roomCharges"> = ["roomCharges"];
  let mainCharges = folio.roomCharges;
  for (const key of SPLITTABLE_KEYS) {
    const amount = folio[key];
    if (amount <= 0) continue;
    if (separateSet.has(key)) {
      draftGroups.push({
        id: key,
        label: SPLITTABLE_CHARGE_LABELS[key],
        chargeKeys: [key],
        charges: amount,
        isMain: false,
      });
    } else {
      mainCharges += amount;
      mainKeys.push(key);
    }
  }

  draftGroups.unshift({
    id: "main",
    label: "Room & Stay Bill",
    chargeKeys: mainKeys,
    charges: mainCharges,
    isMain: true,
  });

  const withTax = draftGroups.map((group) => ({
    ...group,
    gst:
      totalCharges > 0 ? Math.round((folio.gst * group.charges) / totalCharges) : 0,
    gross: 0,
    discountPart: 0,
    advancePart: 0,
    due: 0,
  }));

  const gstAssigned = withTax.reduce((sum, g) => sum + g.gst, 0);
  if (withTax.length > 0 && gstAssigned !== folio.gst) {
    withTax[0].gst += folio.gst - gstAssigned;
  }

  for (const group of withTax) {
    group.gross = group.charges + group.gst;
    group.discountPart =
      totalCharges > 0 ? Math.round((discount * group.charges) / totalCharges) : 0;
  }

  const discountAssigned = withTax.reduce((sum, g) => sum + g.discountPart, 0);
  if (withTax.length > 0 && discountAssigned !== discount) {
    withTax[0].discountPart += discount - discountAssigned;
  }

  const netBeforeAdvance = withTax.map((g) => ({
    ...g,
    net: Math.max(0, g.gross - g.discountPart),
  }));
  const totalNet = netBeforeAdvance.reduce((sum, g) => sum + g.net, 0);

  for (const group of netBeforeAdvance) {
    group.advancePart =
      totalNet > 0
        ? Math.round((folio.advancePaid * group.net) / totalNet)
        : 0;
    group.due = Math.max(0, group.net - group.advancePart);
  }

  const advanceAssigned = netBeforeAdvance.reduce((sum, g) => sum + g.advancePart, 0);
  if (netBeforeAdvance.length > 0 && advanceAssigned !== folio.advancePaid) {
    netBeforeAdvance[0].advancePart += folio.advancePaid - advanceAssigned;
    netBeforeAdvance[0].due = Math.max(
      0,
      netBeforeAdvance[0].net - netBeforeAdvance[0].advancePart,
    );
  }

  return {
    bills: netBeforeAdvance.map((g) => ({
      id: g.id,
      label: g.label,
      chargeKeys: g.chargeKeys,
      charges: g.charges,
      gst: g.gst,
      discount: g.discountPart,
      advance: g.advancePart,
      due: g.due,
      isMain: g.isMain,
    })),
    totals,
  };
}
