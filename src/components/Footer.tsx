import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{ marginTop: '40px', fontSize: '0.85rem', color: '#666' }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Original Document Status</strong><br />
        <em>Document number:</em> 21-038r1<br />
        <em>Document type:</em> OGC Standard<br />
        <em>Document subtype:</em> Implementation<br />
        <em>Document stage:</em> Candidate SWG Draft<br />
        <em>Document language:</em> English
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Original Copyright Notice</strong><br />
        Copyright © 2025 Open Geospatial Consortium<br />
        To obtain additional rights of use, visit{' '}
        <a
          href="https://www.ogc.org/legal"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb' }}
        >
          https://www.ogc.org/legal
        </a>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Document License</strong><br />
        All search results are licensed under the OGC Document License Agreement.<br />
        Modifications have been made to document formatting, but no modifications have been made to document contents.<br />
        To obtain the license agreement, visit{' '}
        <a
          href="https://www.ogc.org/about-ogc/policies/document-license-agreement/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb' }}
        >
          https://www.ogc.org/about-ogc/policies/document-license-agreement/
        </a>
      </div>
    </footer>
  );
};

export default Footer;
