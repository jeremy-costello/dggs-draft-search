import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{ marginBottom: '30px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '5px' }}>
        Semantic search for{' '}
        <a
          href="https://docs.ogc.org/DRAFTS/21-038r1.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'none' }}
        >
          OGC API - Discrete Global Grid Systems - Part 1: Core (draft)
        </a>
      </h1>
    </header>
  );
};

export default Header;
