import React from 'react';

export const RechnungenList: React.FC<{ kleinunternehmer: boolean }> = ({ kleinunternehmer }) => {
  return <div>Rechnungen (Kleinunternehmerregelung: {kleinunternehmer ? 'ja' : 'nein'})</div>;
};

export const RechnungCreate: React.FC<{ kleinunternehmer: boolean }> = ({ kleinunternehmer }) => {
  return <div>Neue Rechnung – MwSt {kleinunternehmer ? 'ausgeblendet' : 'angezeigt'}</div>;
};
