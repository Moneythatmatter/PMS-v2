export interface CurrencyModel {
  currencyId: string; // e.g. "CUR-001" (system-generated)
  code: string; // ISO 4217 3-letter code (INR, USD, EUR, GBP, AED)
  name: string; // Indian Rupee, United States Dollar, etc.
  symbol: string; // ₹, $, €, £, AED
  country?: string; // India, United States, Eurozone, United Kingdom, UAE
  decimalPlaces: number; // 0, 2, 3, 4 (default: 2)
  isBaseCurrency: boolean; // Exactly ONE base currency per company
  exchangeRateToBase: number; // For Base: 1.00; For USD: 83.50, etc.
  rateEffectiveDate?: string; // e.g. "01/08/2026"
  rateSource: "Manual" | "Reference Rate";
  foreignTransactionsAllowed: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export const sampleCurrenciesList: CurrencyModel[] = [
  {
    currencyId: "CUR-001",
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    country: "India",
    decimalPlaces: 2,
    isBaseCurrency: true,
    exchangeRateToBase: 1.0,
    rateEffectiveDate: "01/04/2026",
    rateSource: "Reference Rate",
    foreignTransactionsAllowed: true,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    currencyId: "CUR-002",
    code: "USD",
    name: "United States Dollar",
    symbol: "$",
    country: "United States",
    decimalPlaces: 2,
    isBaseCurrency: false,
    exchangeRateToBase: 83.5,
    rateEffectiveDate: "01/08/2026",
    rateSource: "Manual",
    foreignTransactionsAllowed: true,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    currencyId: "CUR-003",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    country: "Eurozone",
    decimalPlaces: 2,
    isBaseCurrency: false,
    exchangeRateToBase: 90.25,
    rateEffectiveDate: "01/08/2026",
    rateSource: "Manual",
    foreignTransactionsAllowed: true,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    currencyId: "CUR-004",
    code: "GBP",
    name: "British Pound Sterling",
    symbol: "£",
    country: "United Kingdom",
    decimalPlaces: 2,
    isBaseCurrency: false,
    exchangeRateToBase: 105.4,
    rateEffectiveDate: "01/08/2026",
    rateSource: "Manual",
    foreignTransactionsAllowed: true,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    currencyId: "CUR-005",
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    country: "United Arab Emirates",
    decimalPlaces: 2,
    isBaseCurrency: false,
    exchangeRateToBase: 22.75,
    rateEffectiveDate: "01/08/2026",
    rateSource: "Manual",
    foreignTransactionsAllowed: false,
    status: "Active",
    createdAt: "01/05/2026",
    updatedAt: "01/08/2026",
  },
];
