import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard, { StatCard } from '../components/GlassCard.jsx';
import VPCDiagram from '../components/VPCDiagram.jsx';
import { statsApi } from '../api/client.js';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi.get()
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroBadge}>
          <span style={s.badge}>☁️ AWS Internship Project</span>
        </div>
        <h1 style={s.heroTitle}>
          <span style={{ color: '#FF9900' }}>VPC Peering</span>
          <br />Architecture Dashboard
        </h1>
        <p style={s.heroSub}>
          A fully interactive dashboard to visualize, implement, and track the AWS VPC
          Peering project — connecting two isolated VPCs using private IP routing across
          subnets, EC2 instances, and custom route tables.
        </p>
        <div style={s.heroBtns}>
          <Link to="/architecture" className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 28px' }}>
            🗺️ View Architecture
          </Link>
          <Link to="/guide" className="btn btn-ghost" style={{ fontSize: '1rem', padding: '12px 28px' }}>
            📋 Step-by-Step Guide
          </Link>
        </div>
      </section>

      {/* ── Architecture Preview ── */}
      <section className="section">
        <h2 className="section-title">🗺️ Architecture Overview</h2>
        <GlassCard style={{ padding: 20 }}>
          <VPCDiagram compact />
        </GlassCard>
      </section>

      {/* ── Stats ── */}
      <section className="section">
        <h2 className="section-title">📊 Project Stats</h2>

        {error && <div className="alert alert-error">⚠️ Could not load stats — {error}</div>}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /><span>Loading stats…</span></div>
        ) : stats ? (
          <>
            {/* Progress */}
            <GlassCard accent style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Overall Project Completion</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#FF9900' }}>
                  {stats.resources.completion}%
                </span>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${stats.resources.completion}%` }} />
              </div>
              <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                {stats.resources.created} of {stats.resources.total} resources created / active
              </p>
            </GlassCard>

            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <StatCard icon="🗄️" value={stats.resources.total}   label="Total Resources"   color="#FF9900" />
              <StatCard icon="✅" value={stats.resources.created}  label="Created / Active"  color="#22c55e" />
              <StatCard icon="🔗" value={stats.connectivity.total} label="Connectivity Tests" color="#3b82f6" />
              <StatCard
                icon="⚡"
                value={stats.connectivity.avgLatency ? `${stats.connectivity.avgLatency} ms` : '—'}
                label="Avg Latency"
                color="#f59e0b"
              />
            </div>

            {/* By VPC */}
            <div className="grid-2">
              <GlassCard accent>
                <h3 style={s.cardTitle}>Resources by VPC</h3>
                {stats.resources.byVpc.map(row => (
                  <div key={row.vpc} style={s.rowItem}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{row.vpc}</span>
                    <strong style={{ color: '#FF9900' }}>{row.count}</strong>
                  </div>
                ))}
              </GlassCard>

              <GlassCard accent>
                <h3 style={s.cardTitle}>Connectivity Summary</h3>
                <div style={s.rowItem}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Success</span>
                  <strong style={{ color: '#22c55e' }}>{stats.connectivity.success}</strong>
                </div>
                <div style={s.rowItem}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Failed</span>
                  <strong style={{ color: '#ef4444' }}>{stats.connectivity.failed}</strong>
                </div>
                <div style={s.rowItem}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Success Rate</span>
                  <strong style={{ color: '#FF9900' }}>{stats.connectivity.successRate}%</strong>
                </div>
              </GlassCard>
            </div>
          </>
        ) : null}
      </section>

      {/* ── Quick Nav ── */}
      <section className="section">
        <h2 className="section-title">🚀 Quick Navigation</h2>
        <div className="grid-2">
          {[
            { to: '/architecture', icon: '🗺️', title: 'Architecture Diagram',   desc: 'Full interactive VPC topology with subnets, EC2 instances, IGW, route tables, and peering connection.' },
            { to: '/guide',        icon: '📋', title: 'Implementation Guide',   desc: '20 step-by-step instructions to build the VPC peering project in the AWS Console from scratch.' },
            { to: '/resources',    icon: '🗄️', title: 'Resource Tracker',       desc: 'Add, update, and track all your AWS resources — VPCs, subnets, EC2 instances, route tables, and more.' },
            { to: '/connectivity', icon: '🔗', title: 'Connectivity Tests',     desc: 'Log your ping and SSH connectivity tests between EC2 instances across VPCs and track results.' },
          ].map(({ to, icon, title, desc }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <GlassCard accent style={{ height: '100%' }} onClick={() => {}}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{icon}</div>
                <h3 style={{ color: '#FF9900', marginBottom: 8, fontSize: '1.05rem' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.6 }}>{desc}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Architecture Summary ── */}
      <section className="section">
        <h2 className="section-title">🏗️ Project Architecture Summary</h2>
        <div className="grid-2">
          {[
            {
              title: 'VPC 1 — Primary', cidr: '10.28.0.0/16', color: '#1d4ed8',
              items: ['Public Subnet: 10.28.1.0/24', 'Private Subnet: 10.28.2.0/24', 'Internet Gateway (IGW)', 'EC2 in Public Subnet (10.28.1.10)', 'EC2 in Private Subnet (10.28.2.10)', 'Public Route Table (0.0.0.0/0 → IGW)', 'Private Route Table (VPC-2 → Peering)'],
            },
            {
              title: 'VPC 2 — Secondary', cidr: '10.28.200.0/16', color: '#7c3aed',
              items: ['Private Subnet: 10.28.200.0/24', 'EC2 in Private Subnet (10.28.200.10)', 'Route Table (VPC-1 → Peering)', 'VPC Peering Connection', 'No Internet Gateway (isolated)'],
            },
          ].map(({ title, cidr, color, items }) => (
            <GlassCard key={title} style={{ borderTop: `3px solid ${color}` }}>
              <h3 style={{ color, marginBottom: 4 }}>{title}</h3>
              <code style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{cidr}</code>
              <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(item => (
                  <li key={item} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>{item}</li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}

const s = {
  hero: {
    textAlign: 'center',
    padding: '40px 0 60px',
  },
  heroBadge: { marginBottom: 20 },
  badge: {
    background: 'rgba(255,153,0,0.12)',
    border: '1px solid rgba(255,153,0,0.3)',
    color: '#FF9900',
    padding: '6px 18px',
    borderRadius: 99,
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 900,
    lineHeight: 1.15,
    marginBottom: 20,
    marginTop: 20,
  },
  heroSub: {
    fontSize: '1.05rem',
    color: 'rgba(255,255,255,0.6)',
    maxWidth: 640,
    margin: '0 auto 32px',
    lineHeight: 1.7,
  },
  heroBtns: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  rowItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '0.9rem',
  },
};
