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

export function computeCheckoutTotals(folio: CheckoutFolio, discountOverride?: number) {
  const discount = discountOverride ?? folio.discount;
  const charges =
    folio.roomCharges +
    folio.restaurantCharges +
    folio.laundry +
    folio.miniBar +
    folio.extraBed +
    folio.otherCharges;
  const subtotalWithTax = charges + folio.gst;
  const grandTotal = subtotalWithTax - discount;
  const pending = Math.max(0, grandTotal - folio.advancePaid);
  return { charges, subtotalWithTax, grandTotal, pending, discount };
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
