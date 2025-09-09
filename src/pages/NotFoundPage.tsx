import React from 'react';
import Header from '@components/Header';

const NotFoundPage: React.FC = () => {
  return (
    <div>
      <Header title="Seite nicht gefunden" />
      <div className="card"><p>Der angeforderte Pfad existiert nicht.</p></div>
    </div>
  );
};
export default NotFoundPage;