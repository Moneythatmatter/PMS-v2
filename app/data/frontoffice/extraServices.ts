import {
  guestFeedbacks,
  taxiBookings,
  wakeUpCalls,
  type GuestFeedbackRecord,
  type TaxiBooking,
  type WakeUpCall,
} from "./modules";

export const initialTaxiLogs: TaxiBooking[] = [
  ...taxiBookings,
];

export const initialWakeupCalls: WakeUpCall[] = [
  ...wakeUpCalls,
];

export const initialGuestFeedback: GuestFeedbackRecord[] = [
  ...guestFeedbacks,
];
