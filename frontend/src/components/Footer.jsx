import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={{ fontSize: '1.5rem' }}>☁️</span>
          <div>
            <div style={styles.brandName}>
              <span style={{ color: '#FF9900' }}>AWS</span> VPC Peering Dashboard
            </div>
            <div style={styles.brandSub}>Internship Project — VPC Peering Architecture</div>
          </div>
        </div>

        <div style={styles.links}>
          <Link to="/"             style={styles.link}>Home</Link>
          <Link to="/architecture" style={styles.link}>Architecture</Link>
          <Link to="/guide"        style={styles.link}>Step Guide</Link>
          <Link to="/resources"    style={styles.link}>Resources</Link>
          <Link to="/connectivity" style={styles.link}>Connectivity</Link>
        </div>

        <div style={styles.spec}>
          <div style={styles.specRow}>📍 <strong>Region:</strong> ap-south-1 (Mumbai)</div>
          <div style={styles.specRow}>🔗 <strong>VPC-1:</strong> 10.28.0.0/16</div>
          <div style={styles.specRow}>🔗 <strong>VPC-2:</strong> 10.28.200.0/16</div>
        </div>
      </div>

      <div style={styles.bottom}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          Built for AWS Internship — VPC Peering Project &nbsp;|&nbsp; Powered by React + Express
        </span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'rgba(10,14,26,0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: 'var(--max-w)',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
  },
  brand: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  brandName: { fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 4 },
  brandSub:  { fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  link: {
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    fontSize: '0.88rem',
    transition: 'color 0.2s',
  },
  spec: { display: 'flex', flexDirection: 'column', gap: 8 },
  specRow: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '14px 24px',
    textAlign: 'center',
  },
};
