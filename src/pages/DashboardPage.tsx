import React from 'react';
import Header from '@components/Header';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <Header title="Willkommen zu RaWaLite 🚀" />
      <div className="card">
        <p>Dies ist das Grundgerüst. Navigiere über das Menü links.</p>
      </div>
    </div>
  );
};
export default DashboardPage;
