import { useContext, useState } from 'react';
import { DomainContext } from '../domain'; // Hypothetischer Context
import { Table } from './Table';

export const KundenList: React.FC = () => {
  const { kundenService } = useContext(DomainContext);
  const [kunden, setKunden] = useState([]);

  // Lade, Suche, Pagination Logic

  return <Table data={kunden} columns={['Name', 'Adresse']} />;
};

export const KundeCreate: React.FC = () => {
  // Form Logic mit Hooks, save via service
};