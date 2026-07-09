export const reservationNavItems = [
  { label: "New Reservation", href: "/frontoffice/reservation/new", icon: "calendar-plus" },
  { label: "All Bookings", href: "/frontoffice/reservation/all-bookings", icon: "list" },
  { label: "Check-In", href: "/frontoffice/check-in", icon: "log-in" },
  { label: "Walk-in", href: "/frontoffice/reservation/walk-in", icon: "zap" },
  { label: "Early/Late Check", href: "/frontoffice/early-late-check", icon: "clock" },
  { label: "Check-Out", href: "/frontoffice/check-out", icon: "log-out" },
] as const;
