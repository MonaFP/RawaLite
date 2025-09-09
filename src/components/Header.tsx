import React from 'react';

const Header: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
  return (
    <div className="header">
      <h2 style={{margin:0}}>{title}</h2>
      <div>{right}</div>
    </div>
  );
};

export default Header;