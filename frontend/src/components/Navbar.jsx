import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',              label: 'Home',         icon: '🏠' },
  { to: '/architecture',  label: 'Architecture',  icon: '🗺️' },
  { to: '/guide',         label: 'Step Guide',    icon: '📋' },
  { to: '/resources',     label: 'Resources',     icon: '🗄️' },
  { to: '/connectivity',  label: 'Connectivity',  icon: '🔗' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>☁️</span>
          <span>
            <span style={styles.logoAws}>AWS</span>
            <span style={styles.logoText}> VPC Dashboard</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul style={styles.links}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {}),
                })}
              >
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          style={styles.hamburger}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={styles.mobileMenu}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                ...styles.mobileLink,
                ...(isActive ? styles.mobileLinkActive : {}),
              })}
            >
              {icon} {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    background: 'rgba(10, 14, 26, 0.82)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
  },
  inner: {
    maxWidth: 'var(--max-w)',
    margin: '0 auto',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
  },
  logoIcon: { fontSize: '1.5rem' },
  logoAws: { color: '#FF9900' },
  logoText: { color: '#fff' },
  links: {
    display: 'flex',
    listStyle: 'none',
    gap: 4,
    alignItems: 'center',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  linkActive: {
    color: '#FF9900',
    background: 'rgba(255,153,0,0.12)',
  },
  hamburger: {
    display: 'none',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 16px 16px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 10,
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  mobileLinkActive: {
    color: '#FF9900',
    background: 'rgba(255,153,0,0.1)',
  },
};

