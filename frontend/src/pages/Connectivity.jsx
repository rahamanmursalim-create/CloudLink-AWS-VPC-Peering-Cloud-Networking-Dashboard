import React, { useEffect, useState, useCallback } from 'react';
import GlassCard, { StatCard } from '../components/GlassCard.jsx';
import { connectivityApi } from '../api/client.js';

const PROTOCOLS = ['ICMP (ping)', 'SSH (TCP 22)', 'HTTP (TCP 80)', 'HTTPS (TCP 443)', 'Custom TCP', 'Custom UDP'];
const STATUSES  = ['pending', 'success', 'failed', 'timeout'];

const PREDEFINED_PAIRS = [
  { source: 'EC2-Public-1 (10.28.1.10)',  destination: 'EC2-Private-1 (10.28.2.10)',   note: 'Same VPC, public → private' },
  { source: 'EC2-Public-1 (10.28.1.10)',  destination: 'EC2-VPC2 (10.28.200.10)',       note: 'Cross-VPC via peering' },
  { source: 'EC2-Private-1 (10.28.2.10)', destination: 'EC2-VPC2 (10.28.200.10)',       note: 'Cross-VPC via peering (private)' },
  { source: 'EC2-VPC2 (10.28.200.10)',    destination: 'EC2-Public-1 (10.28.1.10)',     note: 'Return path: VPC-2 → VPC-1' },
  { source: 'EC2-VPC2 (10.28.200.10)',    destination: 'EC2-Private-1 (10.28.2.10)',    note: 'Return path: VPC-2 → VPC-1 private' },
];

const EMPTY_FORM = { source: '', destination: '', protocol: 'ICMP (ping)', status: 'pending', latency_ms: '', packet_loss: '', notes: '' };

export default function Connectivity() {
  const [tests, setTests]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId]   = useState(null);
  const [toast, setToast]         = useState('');
  const [filterStatus, setFilter] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const params = filterStatus ? { status: filterStatus } : {};
    connectivityApi.getAll(params)
      .then(res => setTests(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const applyPair = (pair) => {
    setForm(f => ({ ...f, source: pair.source, destination: pair.destination, notes: pair.note }));
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.source.trim() || !form.destination.trim()) {
      setFormError('Source and destination are required.'); return;
    }
    setSaving(true);
    try {
      await connectivityApi.create({
        ...form,
        latency_ms:  form.latency_ms  !== '' ? Number(form.latency_ms)  : undefined,
        packet_loss: form.packet_loss !== '' ? Number(form.packet_loss) : undefined,
      });
      showToast('✅ Connectivity test logged');
      closeModal();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await connectivityApi.remove(id);
      showToast('🗑️ Test log deleted');
      setDeleteId(null);
      load();
    } catch (err) { setError(err.message); }
  };

  // Quick stats
  const successCount = tests.filter(t => t.status === 'success').length;
  const failedCount  = tests.filter(t => t.status === 'failed' || t.status === 'timeout').length;
  const avgLatency   = (() => {
    const valid = tests.filter(t => t.latency_ms != null && t.status === 'success');
    if (!valid.length) return null;
    return Math.round(valid.reduce((s, t) => s + t.latency_ms, 0) / valid.length * 10) / 10;
  })();

  return (
    <div className="page-wrapper">
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={s.pageTitle}>Connectivity Tests</h1>
          <p style={s.pageSub}>Log and track ping / SSH connectivity tests between your EC2 instances across VPCs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Test</button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon="🔗" value={tests.length}                                  label="Total Tests"     color="#3b82f6" />
        <StatCard icon="✅" value={successCount}                                  label="Successful"      color="#22c55e" />
        <StatCard icon="❌" value={failedCount}                                    label="Failed / Timeout" color="#ef4444" />
        <StatCard icon="⚡" value={avgLatency != null ? `${avgLatency} ms` : '—'} label="Avg Latency"    color="#f59e0b" />
      </div>

      {/* Predefined test pairs guide */}
      <GlassCard accent style={{ marginBottom: 28 }}>
        <h3 style={{ color: '#FF9900', marginBottom: 14, fontSize: '0.95rem' }}>
          📋 Expected Connectivity Pairs — click a row to pre-fill the log form
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PREDEFINED_PAIRS.map((pair, i) => (
            <div
              key={i}
              style={s.pairRow}
              onClick={() => { setForm(f => ({ ...f, source: pair.source, destination: pair.destination, notes: pair.note })); setShowModal(true); }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.85rem' }}>{pair.source}</span>
                <span style={{ color: '#FF9900', margin: '0 8px' }}>→</span>
                <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: '0.85rem' }}>{pair.destination}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{pair.note}</span>
              <span style={{ color: '#FF9900', fontSize: '0.78rem', flexShrink: 0 }}>+ Log →</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Filter:</span>
        {['', ...STATUSES].map(st => (
          <button
            key={st || 'all'}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(st)}
          >
            {st || 'All'}
          </button>
        ))}
      </div>

      {/* Test Logs Table */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading tests…</span></div>
      ) : tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>No connectivity tests logged yet</h3>
          <p>Click "+ Log Test" or a pair above to record your first test.</p>
        </div>
      ) : (
        <div className="table-wrap glass">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Packet Loss</th>
                <th>Tested At</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.id}>
                  <td><code style={{ color: '#3b82f6', fontSize: '0.82rem' }}>{t.source}</code></td>
                  <td><code style={{ color: '#22c55e', fontSize: '0.82rem' }}>{t.destination}</code></td>
                  <td style={{ fontSize: '0.82rem' }}>{t.protocol}</td>
                  <td>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </td>
                  <td style={{ color: t.latency_ms != null ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    {t.latency_ms != null ? `${t.latency_ms} ms` : '—'}
                  </td>
                  <td style={{ color: t.packet_loss != null ? (t.packet_loss > 0 ? '#ef4444' : '#22c55e') : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    {t.packet_loss != null ? `${t.packet_loss}%` : '—'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                    {new Date(t.tested_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.notes || '—'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(t.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Test Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔗 Log Connectivity Test</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {/* Quick pairs */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: 8, fontWeight: 600 }}>QUICK FILL:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PREDEFINED_PAIRS.map((p, i) => (
                  <button key={i} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => applyPair(p)}>
                    {p.note}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave}>
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-group">
                <label className="form-label">Source (Instance / IP) *</label>
                <input className="form-input" required placeholder="e.g. EC2-Public-1 (10.28.1.10)"
                  value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Destination (Instance / IP) *</label>
                <input className="form-input" required placeholder="e.g. EC2-VPC2 (10.28.200.10)"
                  value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Protocol</label>
                  <select className="form-select" value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}>
                    {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Latency (ms)</label>
                  <input className="form-input" type="number" min="0" step="0.1" placeholder="e.g. 1.2"
                    value={form.latency_ms} onChange={e => setForm(f => ({ ...f, latency_ms: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Packet Loss (%)</label>
                  <input className="form-input" type="number" min="0" max="100" step="1" placeholder="e.g. 0"
                    value={form.packet_loss} onChange={e => setForm(f => ({ ...f, packet_loss: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Paste ping output or observation…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Logging…' : '+ Log Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Delete Test Log</span>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>Delete this connectivity test log? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 10 },
  pageSub:   { color: 'rgba(255,255,255,0.55)', fontSize: '1rem' },
  pairRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'background 0.15s, border-color 0.15s',
    flexWrap: 'wrap',
  },
  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.4)',
    color: '#86efac',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 600,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
};
