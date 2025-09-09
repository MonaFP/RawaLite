export type Settings = {
  companyName?: string;
  kleinunternehmer?: boolean;
};

export const defaultSettings: Settings = {
  companyName: 'RaWaLite',
  kleinunternehmer: false,
};