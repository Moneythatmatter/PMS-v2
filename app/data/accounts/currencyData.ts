export interface CurrencyRecord {
  id: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  subUnitName: string;
  country: string;
  isoCode: string;
  isBaseCurrency: boolean;
  activeStatus: boolean;
  exchangeRate: number;
  buyingRate: number;
  sellingRate: number;
  effectiveDate: string;
  rateTolerancePct: number;
  rateSource: string;
  forexGainLedger: string;
  forexLossLedger: string;
  unrealizedReserveLedger: string;
  decimalPlaces: number;
  allowForeignVouchers: boolean;
  formatPreview: string;
  signBy: string;
  updatedBy: string;
  updatedDate: string;
}

export const sampleCurrenciesData: CurrencyRecord[] = [
  {
    id: "cur-inr",
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    currencySymbol: "₹",
    subUnitName: "Paise",
    country: "India",
    isoCode: "356",
    isBaseCurrency: true,
    activeStatus: true,
    exchangeRate: 1.0,
    buyingRate: 1.0,
    sellingRate: 1.0,
    effectiveDate: "01/04/2026",
    rateTolerancePct: 0.0,
    rateSource: "Base Currency (Domestic)",
    forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
    forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
    unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
    decimalPlaces: 2,
    allowForeignVouchers: true,
    formatPreview: "₹ 1,45,000.00",
    signBy: "Finance Controller",
    updatedBy: "Jay Admin",
    updatedDate: "01/08/2026 10:00",
  },
  {
    id: "cur-usd",
    currencyCode: "USD",
    currencyName: "United States Dollar",
    currencySymbol: "$",
    subUnitName: "Cents",
    country: "United States",
    isoCode: "840",
    isBaseCurrency: false,
    activeStatus: true,
    exchangeRate: 83.5,
    buyingRate: 83.2,
    sellingRate: 83.8,
    effectiveDate: "01/08/2026",
    rateTolerancePct: 2.5,
    rateSource: "Reserve Bank of India (RBI Reference)",
    forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
    forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
    unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
    decimalPlaces: 2,
    allowForeignVouchers: true,
    formatPreview: "$ 1,250.00",
    signBy: "Accounts Manager",
    updatedBy: "System Auditor",
    updatedDate: "01/08/2026 09:30",
  },
  {
    id: "cur-eur",
    currencyCode: "EUR",
    currencyName: "Euro",
    currencySymbol: "€",
    subUnitName: "Cents",
    country: "Eurozone",
    isoCode: "978",
    isBaseCurrency: false,
    activeStatus: true,
    exchangeRate: 90.25,
    buyingRate: 89.9,
    sellingRate: 90.6,
    effectiveDate: "01/08/2026",
    rateTolerancePct: 2.5,
    rateSource: "European Central Bank / RBI",
    forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
    forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
    unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
    decimalPlaces: 2,
    allowForeignVouchers: true,
    formatPreview: "€ 950.00",
    signBy: "Accounts Manager",
    updatedBy: "Jay Admin",
    updatedDate: "01/08/2026 09:30",
  },
  {
    id: "cur-gbp",
    currencyCode: "GBP",
    currencyName: "British Pound Sterling",
    currencySymbol: "£",
    subUnitName: "Pence",
    country: "United Kingdom",
    isoCode: "826",
    isBaseCurrency: false,
    activeStatus: true,
    exchangeRate: 105.4,
    buyingRate: 104.9,
    sellingRate: 105.9,
    effectiveDate: "01/08/2026",
    rateTolerancePct: 3.0,
    rateSource: "Bank of England / RBI",
    forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
    forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
    unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
    decimalPlaces: 2,
    allowForeignVouchers: true,
    formatPreview: "£ 500.00",
    signBy: "Senior Auditor",
    updatedBy: "System Auditor",
    updatedDate: "30/07/2026 14:00",
  },
  {
    id: "cur-aed",
    currencyCode: "AED",
    currencyName: "United Arab Emirates Dirham",
    currencySymbol: "AED",
    subUnitName: "Fils",
    country: "United Arab Emirates",
    isoCode: "784",
    isBaseCurrency: false,
    activeStatus: true,
    exchangeRate: 22.75,
    buyingRate: 22.65,
    sellingRate: 22.85,
    effectiveDate: "01/08/2026",
    rateTolerancePct: 2.0,
    rateSource: "UAE Central Bank / RBI",
    forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
    forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
    unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
    decimalPlaces: 2,
    allowForeignVouchers: true,
    formatPreview: "AED 3,500.00",
    signBy: "Cashier Lead",
    updatedBy: "Jay Admin",
    updatedDate: "28/07/2026 16:30",
  },
];
