import React, { useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import VPCDiagram from '../components/VPCDiagram.jsx';

const CIDR_TABLE = [
  { name: 'VPC-1',            type: 'VPC',            cidr: '10.28.0.0/16',    ips: '65,536',  notes: 'Primary VPC' },
  { name: 'Public Subnet 1',  type: 'Subnet',         cidr: '10.28.1.0/24',   ips: '256',     notes: 'Internet-accessible, IGW route' },
  { name: 'Private Subnet 1', type: 'Subnet',         cidr: '10.28.2.0/24',   ips: '256',     notes: 'No direct internet access' },
  { name: 'VPC-2',            type: 'VPC',            cidr: '10.28.200.0/16',  ips: '65,536',  notes: 'Secondary VPC, peered with VPC-1' },
  { name: 'Private Subnet 2', type: 'Subnet',         cidr: '10.28.200.0/24', ips: '256',     notes: 'Isolated, reachable only via peering' },
  { name: 'EC2 Public-1',     type: 'EC2 Instance',   cidr: '10.28.1.10',     ips: '—',       notes: 'Bastion host, has public IP' },
  { name: 'EC2 Private-1',    type: 'EC2 Instance',   cidr: '10.28.2.10',     ips: '—',       notes: 'Jump via EC2 Public-1' },
  { name: 'EC2 VPC-2',        type: 'EC2 Instance',   cidr: '10.28.200.10',   ips: '—',       notes: 'Target in VPC-2' },
];

const ROUTE_TABLES = [
  {
    name: 'RT-Public-1',
    vpc: 'VPC-1',
    assoc: 'Public Subnet (10.28.1.0/24)',
    routes: [
      { dest: '10.28.0.0/16',    target: 'local',              note: 'Local VPC traffic' },
      { dest: '0.0.0.0/0',       target: 'Internet Gateway',   note: 'All internet traffic' },
      { dest: '10.28.200.0/16',  target: 'VPC Peering (pcx-…)', note: 'Traffic to VPC-2' },
    ],
  },
  {
    name: 'RT-Private-1',
    vpc: 'VPC-1',
    assoc: 'Private Subnet (10.28.2.0/24)',
    routes: [
      { dest: '10.28.0.0/16',    target: 'local',              note: 'Local VPC traffic' },
      { dest: '10.28.200.0/16',  target: 'VPC Peering (pcx-…)', note: 'Traffic to VPC-2' },
    ],
  },
  {
    name: 'RT-Private-2',
    vpc: 'VPC-2',
    assoc: 'Private Subnet (10.28.200.0/24)',
    routes: [
      { dest: '10.28.200.0/16',  target: 'local',              note: 'Local VPC-2 traffic' },
      { dest: '10.28.0.0/16',    target: 'VPC Peering (pcx-…)', note: 'Traffic to VPC-1' },
    ],
  },
];

const SG_RULES = [
  { instance: 'EC2-Public-1',  type: 'Inbound',  proto: 'SSH (22)',   source: '0.0.0.0/0',          note: 'Allow SSH from internet' },
  { instance: 'EC2-Public-1',  type: 'Inbound',  proto: 'ICMP',       source: '0.0.0.0/0',          note: 'Allow ping from internet' },
  { instance: 'EC2-Private-1', type: 'Inbound',  proto: 'SSH (22)',   source: '10.28.1.0/24',       note: 'Allow SSH from public subnet' },
  { instance: 'EC2-Private-1', type: 'Inbound',  proto: 'ICMP',       source: '10.28.0.0/16',       note: 'Allow ping within VPC-1' },
  { instance: 'EC2-VPC2',      type: 'Inbound',  proto: 'SSH (22)',   source: '10.28.0.0/16',       note: 'Allow SSH from VPC-1 via peering' },
  { instance: 'EC2-VPC2',      type: 'Inbound',  proto: 'ICMP',       source: '10.28.0.0/16',       note: 'Allow ping from VPC-1' },
];

export default function Architecture() {
  const [activeSection, setActiveSection] = useState('diagram');

  const tabs = [
    { id: 'diagram',  label: '🗺️ Diagram' },
    { id: 'cidr',     label: '🌐 CIDR Table' },
    { id: 'routes',   label: '🛣️ Route Tables' },
    { id: 'security', label: '🔒 Security Groups' },
  ];

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 32 }}>
        <h1 style={s.pageTitle}>VPC Peering Architecture</h1>
        <p style={s.pageSub}>
          Full technical breakdown of the VPC peering topology — diagram, IP addressing, routing, and security rules.
        </p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeSection === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Diagram */}
      {activeSection === 'diagram' && (
        <>
          <GlassCard accent style={{ marginBottom: 24 }}>
            <VPCDiagram />
          </GlassCard>
          <div className="grid-2">
            {[
              { color: '#1d4ed8', title: 'VPC-1 (10.28.0.0/16)', items: ['Public Subnet: 10.28.1.0/24 — EC2 + IGW route', 'Private Subnet: 10.28.2.0/24 — Private EC2', 'Internet Gateway attached for public internet', 'Peering route → 10.28.200.0/16'] },
              { color: '#7c3aed', title: 'VPC-2 (10.28.200.0/16)', items: ['Private Subnet: 10.28.200.0/24 — EC2', 'No Internet Gateway (fully private)', 'Peering route → 10.28.0.0/16', 'Accessible only via VPC-1 through peering'] },
            ].map(({ color, title, items }) => (
              <GlassCard key={title} style={{ borderLeft: `4px solid ${color}` }}>
                <h3 style={{ color, marginBottom: 12 }}>{title}</h3>
                <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(i => <li key={i} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>{i}</li>)}
                </ul>
              </GlassCard>
            ))}
          </div>

          {/* Peering flow */}
          <GlassCard accent style={{ marginTop: 24 }}>
            <h3 style={{ color: '#FF9900', marginBottom: 16 }}>🔗 Peering Connection Flow</h3>
            <div style={s.flow}>
              {['🌐 Internet', '→', 'IGW', '→', 'EC2-Public\n10.28.1.10', '→', 'EC2-Private\n10.28.2.10', '→', 'VPC Peering\n(pcx-xxx)', '→', 'EC2-VPC2\n10.28.200.10'].map((step, i) => (
                <div key={i} style={step === '→' ? s.flowArrow : s.flowStep}>
                  {step.split('\n').map((line, j) => (
                    <div key={j} style={{ textAlign: 'center', fontSize: j === 0 ? '0.85rem' : '0.75rem', color: j === 0 ? '#fff' : 'rgba(255,255,255,0.45)', fontFamily: j === 1 ? 'monospace' : 'inherit' }}>{line}</div>
                  ))}
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}

      {/* CIDR Table */}
      {activeSection === 'cidr' && (
        <div className="section">
          <GlassCard accent>
            <h3 style={{ color: '#FF9900', marginBottom: 16 }}>IP Addressing — CIDR Blocks</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>CIDR / IP</th>
                    <th>Available IPs</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {CIDR_TABLE.map(row => (
                    <tr key={row.name}>
                      <td><strong style={{ color: '#fff' }}>{row.name}</strong></td>
                      <td><span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>{row.type}</span></td>
                      <td><code style={{ color: '#FF9900', fontSize: '0.85rem' }}>{row.cidr}</code></td>
                      <td style={{ color: 'rgba(255,255,255,0.5)' }}>{row.ips}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Route Tables */}
      {activeSection === 'routes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {ROUTE_TABLES.map(rt => (
            <GlassCard key={rt.name} accent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ color: '#8b5cf6' }}>{rt.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    VPC: <strong style={{ color: '#FF9900' }}>{rt.vpc}</strong> &nbsp;|&nbsp; Associated: {rt.assoc}
                  </div>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Destination</th>
                      <th>Target</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rt.routes.map((r, i) => (
                      <tr key={i}>
                        <td><code style={{ color: '#FF9900', fontSize: '0.85rem' }}>{r.dest}</code></td>
                        <td style={{ color: '#22c55e', fontSize: '0.88rem' }}>{r.target}</td>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Security Groups */}
      {activeSection === 'security' && (
        <GlassCard accent>
          <h3 style={{ color: '#FF9900', marginBottom: 16 }}>Security Group Rules (Minimum Required)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Instance</th>
                  <th>Direction</th>
                  <th>Protocol/Port</th>
                  <th>Source/Dest</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {SG_RULES.map((r, i) => (
                  <tr key={i}>
                    <td><strong style={{ color: '#fff' }}>{r.instance}</strong></td>
                    <td>
                      <span className={`badge ${r.type === 'Inbound' ? 'badge-active' : 'badge-pending'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td><code style={{ color: '#FF9900', fontSize: '0.85rem' }}>{r.proto}</code></td>
                    <td><code style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{r.source}</code></td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="alert alert-info" style={{ marginTop: 20 }}>
            💡 All outbound traffic is allowed by default in AWS Security Groups. Only inbound rules above are needed.
          </div>
        </GlassCard>
      )}
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 10 },
  pageSub:   { color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: 640 },
  tabs:      { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  flow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  flowStep: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,153,0,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    minWidth: 90,
  },
  flowArrow: {
    color: '#FF9900',
    fontSize: '1.2rem',
    padding: '0 4px',
  },
};
