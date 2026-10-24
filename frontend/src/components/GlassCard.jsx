import React from 'react';

/**
 * Reusable Glassmorphism card.
 *
 * Props:
 *  - children
 *  - style     – additional inline styles
 *  - className – additional CSS classes
 *  - accent    – show an orange top accent bar (bool)
 *  - onClick
 */
export default function GlassCard({ children, style, className = '', accent = false, onClick }) {
  return (
    <div
      className={`glass ${className}`}
      onClick={onClick}
      style={{
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...style,
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.45)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #FF9900, #ffb347)',
          borderRadius: '16px 16px 0 0',
        }} />
      )}
      {children}
    </div>
  );
}

/** Stat card variant with icon, value, and label */
export function StatCard({ icon, value, label, sub, color = '#FF9900' }) {
  return (
    <GlassCard accent style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{sub}</div>}
    </GlassCard>
  );
}
