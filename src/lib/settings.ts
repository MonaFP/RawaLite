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
    }
  ]
};