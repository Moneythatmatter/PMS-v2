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

export const checkoutFolios: CheckoutFolio[] = [
  {
    id: "CO-1",
    bookingId: "BK-1040",
    guestName: "James Wilson",
    phone: "+91 87654 32109",
    email: "james.w@email.com",
    room: "112",
    roomType: "Standard",
    checkIn: "22 Jun 2026",
    checkOut: "27 Jun 2026",
    nights: 5,
    adults: 2,
    children: 0,
    roomCharges: 10500,
    restaurantCharges: 850,
    laundry: 200,
    miniBar: 350,
    extraBed: 0,
    otherCharges: 0,
    gst: 2070,
    discount: 500,
    advancePaid: 3200,
    departingToday: true,
  },
  {
    id: "CO-2",
    bookingId: "BK-1041",
    guestName: "Priya Patel",
    phone: "+91 91234 56789",
    email: "priya@email.com",
    room: "501",
    roomType: "Suite",
    checkIn: "22 Jun 2026",
    checkOut: "27 Jun 2026",
    nights: 5,
    adults: 2,
    children: 1,
    roomCharges: 42500,
    restaurantCharges: 1200,
    laundry: 450,
    miniBar: 680,
    extraBed: 1500,
    otherCharges: 0,
    gst: 8105,
    discount: 0,
    advancePaid: 30100,
    isVip: true,
    departingToday: true,
  },
  {
    id: "CO-3",
    bookingId: "BK-1042",
    guestName: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul@email.com",
    room: "204",
    roomType: "Deluxe",
    checkIn: "23 Jun 2026",
    checkOut: "26 Jun 2026",
    nights: 3,
    adults: 1,
    children: 0,
    roomCharges: 13500,
    restaurantCharges: 620,
    laundry: 180,
    miniBar: 120,
    extraBed: 0,
    otherCharges: 0,
    gst: 2597,
    discount: 200,
    advancePaid: 5000,
    departingToday: false,
  },
  {
    id: "CO-4",
    bookingId: "BK-1038",
    guestName: "Michael Brown",
    phone: "+91 99887 76655",
    email: "m.brown@corp.com",
    room: "305",
    roomType: "Deluxe",
    checkIn: "21 Jun 2026",
    checkOut: "24 Jun 2026",
    nights: 3,
    adults: 1,
    children: 0,
    roomCharges: 11400,
    restaurantCharges: 940,
    laundry: 320,
    miniBar: 0,
    extraBed: 0,
    otherCharges: 250,
    gst: 2320,
    discount: 0,
    advancePaid: 2800,
    isVip: true,
    departingToday: true,
  },
];
