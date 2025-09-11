export type CompanyData = {
  name: string;
  street: string;
  postalCode: string; // maps to zip in SQLite
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string; // maps to taxId in SQLite
  vatId?: string;
  kleinunternehmer: boolean;
  bankName?: string;
  bankAccount?: string;
  bankBic?: string;
  logo?: string; // Base64-encoded Logo
};

export type ThemeColor = 'salbeigrün' | 'himmelblau' | 'lavendel' | 'pfirsich' | 'rosé' | 'custom';
export type NavigationMode = 'sidebar' | 'header';

export type CustomColorSettings = {
  primary: string;
  secondary: string;
  accent: string;
};

export type DesignSettings = {
  theme: ThemeColor;
  navigationMode: NavigationMode;
  customColors?: CustomColorSettings;
};

export type NumberingCircle = {
  id: string;
  name: string;
  prefix: string;
  digits: number;
  current: number;
  resetMode: 'yearly' | 'never';
  lastResetYear?: number;
};

export type Settings = {
  companyData: CompanyData;
  numberingCircles: NumberingCircle[];
  designSettings: DesignSettings;
};

export const defaultSettings: Settings = {
  companyData: {
    name: 'RawaLite',
    street: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    vatId: '',
    kleinunternehmer: false,
    bankName: '',
    bankAccount: '',
    bankBic: '',
    logo: ''
  },
  designSettings: {
    theme: 'salbeigrün',
    navigationMode: 'sidebar'
  },
  numberingCircles: [
    {
      id: 'customers',
      name: 'Kunden',
      prefix: 'K-',
      digits: 4,
      current: 0,
      resetMode: 'never'
    },
    {
      id: 'offers',
      name: 'Angebote',
      prefix: 'AN-',
      digits: 4,
      current: 0,
      resetMode: 'yearly'
    },
    {
      id: 'invoices',
      name: 'Rechnungen',
      prefix: 'RE-',
      digits: 4,
      current: 0,
      resetMode: 'yearly'
    },
    {
      id: 'packages',
      name: 'Pakete',
      prefix: 'PAK-',
      digits: 3,
      current: 0,
      resetMode: 'never'
    },
    {
      id: 'timesheets',
      name: 'Leistungsnachweise',
      prefix: 'LN-',
      digits: 4,
      current: 0,
      resetMode: 'yearly'
    }
  ]
};