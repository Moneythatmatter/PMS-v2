import type {
  HKRoom,
  HKPublicArea,
  HKChecklistTemplate,
  HKStaff,
  HKShift,
  HKInventoryItem,
  HKLaundryJob,
  HKDamageReport,
  HKRequisition,
  HKHistoryLog,
  HKLuggageJob
} from "./HousekeepingTypes";

export const initialHKRooms: HKRoom[] = [
  { roomNo: "101", category: "Standard", type: "Standard", bedType: "King", floor: "1st Floor", wing: "East Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "10 Jun 2026", status: "Occupied", hkStatus: "Clean", foStatus: "Occupied", guestName: "James Wilson", checkoutDate: "27 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "Needs standard check-out cleaning." },
  { roomNo: "102", category: "Standard", type: "Standard", bedType: "Twin", floor: "1st Floor", wing: "East Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "12 Jun 2026", status: "Vacant Ready", hkStatus: "Clean", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "" },
  { roomNo: "103", category: "Standard", type: "Standard", bedType: "King", floor: "1st Floor", wing: "East Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "15 Jun 2026", status: "Vacant Dirty", hkStatus: "Dirty", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "" },
  { roomNo: "104", category: "Standard", type: "Standard", bedType: "King", floor: "1st Floor", wing: "West Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "05 Jun 2026", status: "Out of Order", hkStatus: "OOO", foStatus: "Blocked", maintenance: "In Progress", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "AC not cooling. Placed OOO. Maintenance request raised." },
  { roomNo: "105", category: "Standard", type: "Standard", bedType: "Twin", floor: "1st Floor", wing: "West Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "08 Jun 2026", status: "Blocked", hkStatus: "Clean", foStatus: "Blocked", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "Blocked for upcoming group reservation." },
  { roomNo: "201", category: "Deluxe", type: "Deluxe", bedType: "King", floor: "2nd Floor", wing: "East Wing", maxOccupancy: 3, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 60 Days", lastDeepCleaned: "28 May 2026", status: "Occupied Dirty", hkStatus: "Dirty", foStatus: "Occupied", guestName: "Sarah Chen", checkoutDate: "28 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "VIP guest in room. Stay-over clean." },
  { roomNo: "202", category: "Deluxe", type: "Deluxe", bedType: "Queen", floor: "2nd Floor", wing: "East Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 60 Days", lastDeepCleaned: "01 Jun 2026", status: "Occupied", hkStatus: "Clean", foStatus: "Occupied", guestName: "Meghna Nair", checkoutDate: "29 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "" },
  { roomNo: "203", category: "Deluxe", type: "Deluxe", bedType: "King", floor: "2nd Floor", wing: "West Wing", maxOccupancy: 3, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 60 Days", lastDeepCleaned: "02 Jun 2026", status: "Cleaning", hkStatus: "Cleaning", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "Cleaning in progress by Housekeeper Meena.", assignedStaff: "Meena", cleaningTimer: { startedAt: new Date().toISOString(), elapsedSeconds: 240, paused: false, lastTick: new Date().toISOString() }, cleaningProgress: 45 },
  { roomNo: "204", category: "Deluxe", type: "Deluxe", bedType: "King", floor: "2nd Floor", wing: "West Wing", maxOccupancy: 3, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 60 Days", lastDeepCleaned: "03 Jun 2026", status: "Inspection Pending", hkStatus: "Cleaning", foStatus: "Vacant", guestName: "Rahul Sharma", checkoutDate: "26 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "Cleaning completed. Awaiting Supervisor verification.", assignedStaff: "Meena", assignedSupervisor: "Ramesh", photos: ["/sample-bathroom.jpg"], inspectionHistory: [
    {
      id: "INS-99210",
      date: "15 Jul 2026",
      time: "09:30 AM",
      inspector: "Ramesh Kumar",
      supervisor: "Ramesh Kumar",
      result: "Rejected" as const,
      qualityScore: 78,
      remarks: "Bathroom mirror had smudges.",
      signature: "Ramesh Kumar"
    }
  ] },
  { roomNo: "301", category: "Executive Suite", type: "Executive Suite", bedType: "King", floor: "3rd Floor", wing: "East Wing", maxOccupancy: 4, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 90 Days", lastDeepCleaned: "10 May 2026", status: "Occupied", hkStatus: "Clean", foStatus: "Occupied", guestName: "John Doe", checkoutDate: "30 Jun", maintenance: "OK", dnd: false, sleepOut: true, facilities: ["WiFi", "TV", "Safe", "Mini Bar", "Bathtub", "Balcony"], remarks: "Guest noted as Sleep Out (did not spend night)." },
  { roomNo: "302", category: "Executive Suite", type: "Executive Suite", bedType: "King", floor: "3rd Floor", wing: "East Wing", maxOccupancy: 4, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 90 Days", lastDeepCleaned: "15 May 2026", status: "Out of Service", hkStatus: "OOS", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar", "Bathtub", "Balcony"], remarks: "Balcony door lock minor issue. Placed OOS." },
  { roomNo: "305", category: "Deluxe", type: "Deluxe", bedType: "King", floor: "3rd Floor", wing: "West Wing", maxOccupancy: 3, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 60 Days", lastDeepCleaned: "20 May 2026", status: "Occupied Dirty", hkStatus: "Dirty", foStatus: "Occupied", guestName: "Michael Brown", checkoutDate: "24 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "Stay-over clean due. TV remote reported broken." },
  { roomNo: "412", category: "Standard", type: "Standard", bedType: "King", floor: "4th Floor", wing: "East Wing", maxOccupancy: 2, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 30 Days", lastDeepCleaned: "14 Jun 2026", status: "Vacant Ready", hkStatus: "Clean", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe"], remarks: "" },
  { roomNo: "501", category: "Suite", type: "Suite", bedType: "King", floor: "5th Floor", wing: "East Wing", maxOccupancy: 4, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 90 Days", lastDeepCleaned: "18 May 2026", status: "Occupied", hkStatus: "Clean", foStatus: "Occupied", guestName: "Priya Patel", checkoutDate: "27 Jun", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar", "Bathtub"], remarks: "" },
  { roomNo: "602", category: "Suite", type: "Suite", bedType: "King", floor: "6th Floor", wing: "East Wing", maxOccupancy: 4, cleaningFrequency: "Daily", deepCleaningFrequency: "Every 90 Days", lastDeepCleaned: "22 May 2026", status: "Vacant Ready", hkStatus: "Inspected", foStatus: "Vacant", maintenance: "OK", dnd: false, sleepOut: false, facilities: ["WiFi", "TV", "Safe", "Mini Bar"], remarks: "" }
];

export const initialHKPublicAreas: HKPublicArea[] = [
  {
    id: "PA-01",
    name: "Main Lobby & Reception",
    category: "Lobby",
    floor: "Ground Floor",
    location: "Main Entrance Lobby",
    assignedStaff: "Ravi Shankar",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Every 2 Hours",
    status: "Inspected",
    priority: "High",
    lastCleaned: "16 Jul 11:00 AM",
    nextCleaning: "16 Jul 01:00 PM",
    estDuration: "30 mins",
    inspectionStatus: "Passed",
    checklist: [
      { task: "Sweep, vacuum, and mop floor surfaces", completed: true },
      { task: "Wipe and sanitize reception desk/counters", completed: true },
      { task: "Clean glass panels and doors", completed: true },
      { task: "Empty trash bins and sanitize handles", completed: true },
      { task: "Wipe lift buttons and grab rails", completed: true },
      { task: "Sofa cleaned and vacuumed", completed: true },
      { task: "Check plants and water them", completed: true }
    ],
    history: [
      { id: "HPA-001", date: "16 Jul 11:00 AM", housekeeper: "Ravi Shankar", supervisor: "Ramesh Kumar", duration: "25 mins", status: "Inspected", remarks: "Lobby clean, sanitization done." },
      { id: "HPA-002", date: "16 Jul 09:00 AM", housekeeper: "Meena Kumari", supervisor: "Ramesh Kumar", duration: "30 mins", status: "Inspected", remarks: "Heavy footfall clean." }
    ]
  },
  {
    id: "PA-02",
    name: "Restaurant Dining Area",
    category: "Restaurant",
    floor: "Ground Floor",
    location: "Saffron Spice Restaurant",
    assignedStaff: "Meena Kumari",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "After Every Meal Service",
    status: "Dirty",
    priority: "High",
    lastCleaned: "16 Jul 09:30 AM",
    nextCleaning: "16 Jul 02:30 PM",
    estDuration: "45 mins",
    inspectionStatus: "None",
    checklist: [
      { task: "Tables Sanitized", completed: false },
      { task: "Chairs Cleaned", completed: false },
      { task: "Counter Cleaned", completed: false },
      { task: "Floor Mopped", completed: false },
      { task: "Wash Area Cleaned", completed: false },
      { task: "Dustbins Cleared & Disinfected", completed: false }
    ],
    history: [
      { id: "HPA-003", date: "16 Jul 09:30 AM", housekeeper: "Meena Kumari", supervisor: "Ramesh Kumar", duration: "40 mins", status: "Inspected", remarks: "Post breakfast service cleaning completed." }
    ]
  },
  {
    id: "PA-03",
    name: "1st Floor Guest Corridor",
    category: "Corridor",
    floor: "1st Floor",
    location: "Guest Wing Corridors",
    assignedStaff: "Kiran Bala",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Twice Daily",
    status: "Cleaning",
    priority: "Low",
    lastCleaned: "16 Jul 08:00 AM",
    nextCleaning: "16 Jul 04:00 PM",
    estDuration: "60 mins",
    inspectionStatus: "None",
    checklist: [
      { task: "Carpet Vacuumed", completed: true },
      { task: "Handrails Sanitized", completed: true },
      { task: "Lighting Checked & Bulbs Inspected", completed: false },
      { task: "Room Doors Wiped", completed: false },
      { task: "Fire Extinguishers Checked", completed: false }
    ],
    history: [
      { id: "HPA-004", date: "15 Jul 04:00 PM", housekeeper: "Kiran Bala", supervisor: "Ramesh Kumar", duration: "50 mins", status: "Inspected", remarks: "Corridor tidy, lighting normal." }
    ]
  },
  {
    id: "PA-04",
    name: "Fitness Center & Gym",
    category: "Gym",
    floor: "Basement 1",
    location: "Wellness Wing Gym",
    assignedStaff: "Ravi Shankar",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Daily (Morning)",
    status: "Clean",
    priority: "Medium",
    lastCleaned: "16 Jul 06:30 AM",
    nextCleaning: "17 Jul 06:30 AM",
    estDuration: "40 mins",
    inspectionStatus: "Passed",
    checklist: [
      { task: "Equipment Sanitized", completed: true },
      { task: "Mirrors Cleaned", completed: true },
      { task: "Towels Restocked", completed: true },
      { task: "Floor Cleaned & Sanitized", completed: true },
      { task: "Water Station Replenished", completed: true }
    ],
    history: [
      { id: "HPA-005", date: "16 Jul 06:30 AM", housekeeper: "Ravi Shankar", supervisor: "Ramesh Kumar", duration: "35 mins", status: "Inspected", remarks: "Sanitization complete, towels replenished." }
    ]
  },
  {
    id: "PA-05",
    name: "Infinity Rooftop Pool",
    category: "Pool",
    floor: "5th Floor",
    location: "Rooftop Pool Deck",
    assignedStaff: "Kiran Bala",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Every 4 Hours",
    status: "Pending Inspection",
    priority: "High",
    lastCleaned: "16 Jul 12:00 PM",
    nextCleaning: "16 Jul 04:00 PM",
    estDuration: "35 mins",
    inspectionStatus: "Pending",
    checklist: [
      { task: "Water pH Level Check", completed: true },
      { task: "Pool Deck Cleared", completed: true },
      { task: "Sun Loungers Sanitized", completed: true },
      { task: "Fresh Towels Restocked", completed: true },
      { task: "Trash Bins Cleared", completed: true },
      { task: "Shower Area Cleaned", completed: true }
    ],
    history: [
      { id: "HPA-006", date: "16 Jul 08:00 AM", housekeeper: "Kiran Bala", supervisor: "Ramesh Kumar", duration: "30 mins", status: "Inspected", remarks: "Pool deck mopped and clean." }
    ]
  },
  {
    id: "PA-06",
    name: "Ziva Royal Spa",
    category: "Spa",
    floor: "3rd Floor",
    location: "Ziva Wellness Center",
    assignedStaff: "Meena Kumari",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Twice Daily",
    status: "Assigned",
    priority: "Medium",
    lastCleaned: "15 Jul 08:00 PM",
    nextCleaning: "16 Jul 03:00 PM",
    estDuration: "50 mins",
    inspectionStatus: "None",
    checklist: [
      { task: "Massage Beds Sanitized", completed: false },
      { task: "Clean Towels Restocked", completed: false },
      { task: "Sauna Sanitized & Disinfected", completed: false },
      { task: "Floor Disinfected & Dried", completed: false },
      { task: "Aroma Oils & Amenities Restocked", completed: false }
    ],
    history: [
      { id: "HPA-007", date: "15 Jul 08:00 PM", housekeeper: "Meena Kumari", supervisor: "Ramesh Kumar", duration: "45 mins", status: "Inspected", remarks: "Evening spa teardown completed." }
    ]
  },
  {
    id: "PA-07",
    name: "Royal Banquet Hall",
    category: "Banquet Hall",
    floor: "1st Floor",
    location: "Main Convention Wing",
    assignedStaff: "Ravi Shankar",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "On-Demand (Pre/Post Event)",
    status: "Blocked",
    priority: "Medium",
    lastCleaned: "14 Jul 02:00 PM",
    nextCleaning: "16 Jul 07:00 PM",
    estDuration: "90 mins",
    inspectionStatus: "None",
    checklist: [
      { task: "Carpet Vacuumed", completed: false },
      { task: "Stage Area Cleared", completed: false },
      { task: "Chairs Arranged & Cleaned", completed: false },
      { task: "AV Console Wiped", completed: false },
      { task: "Trash Bins Emptied", completed: false }
    ],
    history: [
      { id: "HPA-008", date: "14 Jul 02:00 PM", housekeeper: "Ravi Shankar", supervisor: "Ramesh Kumar", duration: "80 mins", status: "Inspected", remarks: "Post wedding event clean completed." }
    ]
  },
  {
    id: "PA-08",
    name: "Lobby Washrooms",
    category: "Washroom",
    floor: "Ground Floor",
    location: "Lobby Restroom Corridor",
    assignedStaff: "Meena Kumari",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Every 1 Hour",
    status: "Dirty",
    priority: "High",
    lastCleaned: "16 Jul 02:00 PM",
    nextCleaning: "16 Jul 03:00 PM",
    estDuration: "20 mins",
    inspectionStatus: "None",
    checklist: [
      { task: "Toilets Sanitized & Disinfected", completed: false },
      { task: "Mirrors Wiped & Polished", completed: false },
      { task: "Hand Wash Soap Restocked", completed: false },
      { task: "Hand Towels Restocked", completed: false },
      { task: "Floors Mopped with Disinfectant", completed: false },
      { task: "Air Freshener Spray Checked", completed: false }
    ],
    history: [
      { id: "HPA-009", date: "16 Jul 02:00 PM", housekeeper: "Meena Kumari", supervisor: "Ramesh Kumar", duration: "15 mins", status: "Inspected", remarks: "Cleaned and odor checked." }
    ]
  },
  {
    id: "PA-09",
    name: "Underground Parking Lot",
    category: "Parking",
    floor: "Basement 2",
    location: "Parking Zones A, B & C",
    assignedStaff: "Kiran Bala",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Daily (Night)",
    status: "Clean",
    priority: "Low",
    lastCleaned: "16 Jul 04:00 AM",
    nextCleaning: "17 Jul 04:00 AM",
    estDuration: "120 mins",
    inspectionStatus: "Passed",
    checklist: [
      { task: "Sweeping floor surfaces", completed: true },
      { task: "Trash Cans Cleared & Bags Replaced", completed: true },
      { task: "Signages Wiped & Inspected", completed: true },
      { task: "Light Fixtures Inspected", completed: true },
      { task: "Oil Spills Sprinkled with Absorbent", completed: true }
    ],
    history: [
      { id: "HPA-010", date: "16 Jul 04:00 AM", housekeeper: "Kiran Bala", supervisor: "Ramesh Kumar", duration: "110 mins", status: "Inspected", remarks: "Oil spots removed, trash emptied." }
    ]
  }
];

export const initialHKChecklistTemplates: HKChecklistTemplate[] = [
  {
    id: "CL-01",
    name: "Stay-over Room Checklist",
    type: "Stay-over",
    items: [
      "Make bed and fluff pillows",
      "Empty trash bins and replace liners",
      "Wipe down bedside tables and desk",
      "Restock amenities (Water, Tea/Coffee, Toiletries)",
      "Clean bathroom sink, mirror, and toilet",
      "Replace used towels with fresh ones",
      "Sweep and mop floor (or vacuum carpet)"
    ]
  },
  {
    id: "CL-02",
    name: "Departure Room Checklist",
    type: "Departure",
    items: [
      "Strip all bed linens and pillowcases",
      "Check drawers and under bed for guest items (Lost & Found)",
      "Disinfect all high-touch surfaces (remotes, handles, switches)",
      "Deep clean bathroom (shower, tub, toilet, walls)",
      "Vacuum mattress and replace all linen (sheets, duvet, pillowcases)",
      "Restock complete set of amenities and minibar",
      "Vacuum carpet and mop tiles thoroughly",
      "Inspect curtains, light fixtures, and electronics"
    ]
  },
  {
    id: "CL-03",
    name: "Deep Cleaning Checklist",
    type: "Deep-Clean",
    items: [
      "Wash mattress protector and duvet insert",
      "Steam clean carpets and upholstery",
      "Deep wash balcony tiles and clean external window panes",
      "Clean behind heavy furniture and under fridge",
      "Inspect and clean HVAC vents and replace filters",
      "Polish wooden furniture and door frames"
    ]
  },
  {
    id: "CL-04",
    name: "Public Area Checklist",
    type: "Public-Area",
    items: [
      "Sweep, vacuum, and mop floor surfaces",
      "Wipe and sanitize reception desk/counters",
      "Clean glass panels and doors",
      "Empty trash bins and sanitize handles",
      "Wipe lift buttons and grab rails",
      "Inspect lighting and report bulb replacements"
    ]
  }
];

export const initialHKStaff: HKStaff[] = [
  { id: "ST-01", name: "Meena Kumari", role: "Housekeeper", activeShift: "Morning Shift", phone: "+91 99001 12233", status: "Active", activeTaskCount: 2, completedToday: 4, currentFloor: "2nd Floor", lastAssignedTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(), workStatus: "Available" },
  { id: "ST-02", name: "Ravi Shankar", role: "Housekeeper", activeShift: "Morning Shift", phone: "+91 99002 23344", status: "Active", activeTaskCount: 1, completedToday: 5, currentFloor: "1st Floor", lastAssignedTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(), workStatus: "Available" },
  { id: "ST-03", name: "Kiran Bala", role: "Housekeeper", activeShift: "Afternoon Shift", phone: "+91 99003 34455", status: "Active", activeTaskCount: 0, completedToday: 2, currentFloor: "3rd Floor", lastAssignedTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(), workStatus: "Available" },
  { id: "ST-04", name: "Ramesh Kumar", role: "Supervisor", activeShift: "Morning Shift", phone: "+91 99004 45566", status: "Active" },
  { id: "ST-05", name: "Suresh Gupta", role: "Engineer", activeShift: "Morning Shift", phone: "+91 99005 56677", status: "Active", activeJobs: 2, completedToday: 3, currentFloor: "1st Floor", lastAssignment: new Date(Date.now() - 15 * 60 * 1000).toISOString(), lastAssignedTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), workStatus: "Available", specialization: "HVAC" },
  { id: "ST-06", name: "Anil Deshmukh", role: "Engineer", activeShift: "Afternoon Shift", phone: "+91 99006 67788", status: "Active", activeJobs: 1, completedToday: 2, currentFloor: "3rd Floor", lastAssignment: new Date(Date.now() - 40 * 60 * 1000).toISOString(), lastAssignedTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(), workStatus: "Available", specialization: "Electrical" },
  { id: "ST-07", name: "Vikram Singh", role: "Bell Boy", activeShift: "General Shift", phone: "+91 99007 78899", status: "Active" },
  { id: "ST-08", name: "Somnath Sen", role: "Laundry Staff", activeShift: "General Shift", phone: "+91 99008 89900", status: "Active" },
  { id: "ST-09", name: "Ravi Devgan", role: "Engineer", activeShift: "Morning Shift", phone: "+91 99009 90011", status: "Active", activeJobs: 0, completedToday: 1, currentFloor: "2nd Floor", lastAssignment: new Date(Date.now() - 60 * 60 * 1000).toISOString(), lastAssignedTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), workStatus: "Available", specialization: "Plumbing" },
  { id: "ST-10", name: "Manoj Tiwari", role: "Engineer", activeShift: "Afternoon Shift", phone: "+91 99010 01122", status: "Active", activeJobs: 1, completedToday: 4, currentFloor: "4th Floor", lastAssignment: new Date(Date.now() - 25 * 60 * 1000).toISOString(), lastAssignedTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), workStatus: "Available", specialization: "Carpentry" },
  { id: "ST-11", name: "Rajesh Khanna", role: "Engineer", activeShift: "General Shift", phone: "+91 99011 12233", status: "Active", activeJobs: 0, completedToday: 2, currentFloor: "5th Floor", lastAssignment: new Date(Date.now() - 90 * 60 * 1000).toISOString(), lastAssignedTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), workStatus: "Available", specialization: "General" }
];

export const initialHKShifts: HKShift[] = [
  { id: "SH-01", name: "Morning Shift", timings: "07:00 AM - 03:00 PM", description: "Primary shift for checkout room cleanings and daily services." },
  { id: "SH-02", name: "Afternoon Shift", timings: "03:00 PM - 11:00 PM", description: "Turn-down service, guest requests, and evening corridor checkups." },
  { id: "SH-03", name: "Night Shift", timings: "11:00 PM - 07:00 AM", description: "Emergency cleaning, lobby deep cleaning, laundry sorting." },
  { id: "SH-04", name: "General Shift", timings: "09:00 AM - 05:00 PM", description: "Stores control, linen laundry operations, administration." }
];

export const initialHKInventory: HKInventoryItem[] = [
  // Linen
  { id: "INV-L01", name: "King Bed Sheets", category: "Linen", available: 120, laundry: 45, damaged: 6, lost: 2, discarded: 12, parStock: 150, unit: "Pcs" },
  { id: "INV-L02", name: "Pillow Covers", category: "Linen", available: 250, laundry: 80, damaged: 10, lost: 4, discarded: 20, parStock: 300, unit: "Pcs" },
  { id: "INV-L03", name: "Bath Towels", category: "Linen", available: 180, laundry: 60, damaged: 8, lost: 3, discarded: 15, parStock: 200, unit: "Pcs" },
  { id: "INV-L04", name: "Hand Towels", category: "Linen", available: 220, laundry: 50, damaged: 5, lost: 1, discarded: 10, parStock: 250, unit: "Pcs" },
  // Amenities
  { id: "INV-A01", name: "Luxury Herbal Soap (20g)", category: "Amenity", available: 450, damaged: 0, lost: 0, discarded: 0, parStock: 500, unit: "Pcs" },
  { id: "INV-A02", name: "Moisturizing Shampoo (40ml)", category: "Amenity", available: 380, damaged: 0, lost: 0, discarded: 0, parStock: 500, unit: "Pcs" },
  { id: "INV-A03", name: "Conditioner (40ml)", category: "Amenity", available: 320, damaged: 0, lost: 0, discarded: 0, parStock: 400, unit: "Pcs" },
  { id: "INV-A04", name: "Dental Hygiene Kit", category: "Amenity", available: 150, damaged: 0, lost: 0, discarded: 0, parStock: 200, unit: "Pcs" },
  { id: "INV-A05", name: "Hotel Slippers (Disposable)", category: "Amenity", available: 85, damaged: 0, lost: 2, discarded: 0, parStock: 150, unit: "Pairs" },
  { id: "INV-A06", name: "Water Bottles (500ml)", category: "Amenity", available: 950, damaged: 4, lost: 0, discarded: 0, parStock: 1000, unit: "Pcs" },
  // Chemicals
  { id: "INV-C01", name: "R1 Floor Cleaner (Concentrate)", category: "Chemical", available: 45, damaged: 1, lost: 0, discarded: 0, parStock: 50, unit: "Liters" },
  { id: "INV-C02", name: "R2 Glass & Mirror Cleaner", category: "Chemical", available: 28, damaged: 0, lost: 0, discarded: 0, parStock: 30, unit: "Liters" },
  { id: "INV-C03", name: "R6 Toilet Bowl Cleaner", category: "Chemical", available: 35, damaged: 0, lost: 0, discarded: 0, parStock: 40, unit: "Liters" },
  { id: "INV-C04", name: "D10 Disinfectant Sanitizer", category: "Chemical", available: 62, damaged: 0, lost: 0, discarded: 0, parStock: 80, unit: "Liters" },
  // Equipment
  { id: "INV-E01", name: "Taski Vacuum Cleaners", category: "Equipment", available: 6, damaged: 1, lost: 0, discarded: 0, parStock: 6, unit: "Pcs" },
  { id: "INV-E02", name: "Housekeeping Trolleys", category: "Equipment", available: 8, damaged: 0, lost: 0, discarded: 0, parStock: 8, unit: "Pcs" },
  { id: "INV-E03", name: "Double Bucket Wringer Mops", category: "Equipment", available: 12, damaged: 2, lost: 0, discarded: 1, parStock: 12, unit: "Pcs" }
];

export const initialHKLaundry: HKLaundryJob[] = [
  { id: "LD-01", type: "Guest", item: "Silk Shirt & Trousers", quantity: 2, room: "112", guestName: "James Wilson", status: "Washing", charges: 350, timeline: { collectedAt: "23 Jun 08:30 AM" }, notes: "Soft wash. Ironing required." },
  { id: "LD-02", type: "Hotel", item: "Bath Towels (Dirty batch)", quantity: 45, status: "Ironing", charges: 450, timeline: { collectedAt: "23 Jun 07:15 AM", washedAt: "23 Jun 09:30 AM" } },
  { id: "LD-03", type: "Hotel", item: "King Bed Sheets (Dirty batch)", quantity: 30, status: "Ready", charges: 600, timeline: { collectedAt: "22 Jun 04:00 PM", washedAt: "22 Jun 06:30 PM", readyAt: "23 Jun 10:00 AM" } },
  { id: "LD-04", type: "Guest", item: "Cotton Dress", quantity: 1, room: "204", guestName: "Rahul Sharma", status: "Delivered", charges: 180, timeline: { collectedAt: "22 Jun 09:00 AM", washedAt: "22 Jun 11:30 AM", readyAt: "22 Jun 03:00 PM", deliveredAt: "22 Jun 04:30 PM" } }
];

export const initialHKDamageReports: HKDamageReport[] = [
  { id: "DM-01", room: "305", damageType: "Furniture", description: "Bed side table drawer handle broken.", reportedBy: "Meena (Housekeeper)", reportedAt: "23 Jun 08:45 AM", estimatedCost: 450, status: "Reported" },
  { id: "DM-02", room: "104", damageType: "AC", description: "Compressor failure causing no cooling.", reportedBy: "Ramesh (Supervisor)", reportedAt: "23 Jun 07:10 AM", estimatedCost: 4500, status: "Approved" }
];

export const initialHKRequisitions: HKRequisition[] = [
  { id: "RQ-01", requestNo: "REQ-2026-004", requestedBy: "Meena Kumari", items: [{ item: "Luxury Herbal Soap (20g)", quantity: 50, unit: "Pcs" }, { item: "Moisturizing Shampoo (40ml)", quantity: 50, unit: "Pcs" }], status: "Approved", requestedAt: "23 Jun 08:00 AM", issuedAt: "23 Jun 08:30 AM", remarks: "Issued for 2nd Floor cart." },
  { id: "RQ-02", requestNo: "REQ-2026-005", requestedBy: "Ravi Shankar", items: [{ item: "King Bed Sheets", quantity: 15, unit: "Pcs" }, { item: "Bath Towels", quantity: 20, unit: "Pcs" }], status: "Pending", requestedAt: "23 Jun 11:45 AM", remarks: "Awaiting store manager approval." }
];

export const initialHKHistory: HKHistoryLog[] = [
  { id: "H-01", timestamp: "23 Jun 11:30 AM", user: "Meena Kumari", category: "Cleaning", room: "204", action: "Finished Cleaning", details: "Completed Stay-over cleaning Checklist. Marked Awaiting Inspection." },
  { id: "H-02", timestamp: "23 Jun 10:00 AM", user: "Ramesh Kumar", category: "Inspection", room: "103", action: "Inspection Passed", details: "Room passed supervisor check-in inspection. Room is now Vacant Ready." },
  { id: "H-03", timestamp: "23 Jun 09:15 AM", user: "System", category: "Room Status", room: "101", action: "Checkout Dirty Triggered", details: "Guest check-out in front office automatically marked room 101 as Vacant Dirty." },
  { id: "H-04", timestamp: "23 Jun 08:30 AM", user: "Somnath Sen", category: "Inventory", action: "Linen Restocked", details: "Issued 50 Pillow covers and 30 sheets to 3rd Floor store." }
];

export const initialHKLuggageJobs: HKLuggageJob[] = [
  { id: "LG-001", guest: "James Wilson", room: "112", bellBoy: "Vikram Singh", tagNumber: "TAG-9921", bagCount: 3, type: "Check-in", pickupTime: "22 Jun 02:15 PM", deliveryTime: "22 Jun 02:30 PM", status: "Delivered", remarks: "Delivered to room safely." },
  { id: "LG-002", guest: "Priya Patel", room: "501", bellBoy: "Vikram Singh", tagNumber: "TAG-9922", bagCount: 4, type: "Storage", pickupTime: "23 Jun 11:00 AM", status: "Stored", remarks: "Stored in Locker A-15 until guest flight at 7 PM." }
];
