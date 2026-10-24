import React, { useEffect, useState, useCallback } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import { resourcesApi } from '../api/client.js';

const RESOURCE_TYPES = ['VPC', 'Subnet', 'EC2 Instance', 'Internet Gateway', 'Route Table', 'VPC Peering', 'Security Group', 'Key Pair', 'Elastic IP', 'Other'];
const VPC_OPTIONS    = ['VPC-1', 'VPC-2', 'Both', 'N/A'];
const STATUS_OPTIONS = ['pending', 'created', 'active', 'failed', 'deleted'];
const REGIONS        = ['ap-south-1', 'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

const EMPTY_FORM = { name: '', type: 'VPC', vpc: 'VPC-1', region: 'ap-south-1', cidr: '', status: 'pending', aws_id: '', notes: '' };

export default function Resources() {
  const [resources, setResources]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [filterVpc, setFilterVpc]   = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterVpc)  params.vpc  = filterVpc;
    if (filterType) params.type = filterType;
    resourcesApi.getAll(params)
      .then(res => setResources(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filterVpc, filterType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setFormError(''); setShowModal(true); };
  const openEdit   = (r) => {
    setForm({ name: r.name, type: r.type, vpc: r.vpc, region: r.region, cidr: r.cidr || '', status: r.status, aws_id: r.aws_id || '', notes: r.notes || '' });
    setEditTarget(r);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); setFormError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await resourcesApi.update(editTarget.id, form);
        showToast('✅ Resource updated successfully');
      } else {
        await resourcesApi.create(form);
        showToast('✅ Resource created successfully');
      }
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
      await resourcesApi.remove(id);
      showToast('🗑️ Resource deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusToggle = async (r) => {
    const nextStatus = { pending: 'created', created: 'active', active: 'pending', failed: 'pending', deleted: 'pending' };
    try {
      await resourcesApi.update(r.id, { status: nextStatus[r.status] || 'pending' });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && (
        <div style={s.toast}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={s.pageTitle}>AWS Resource Tracker</h1>
          <p style={s.pageSub}>Track every AWS resource you create for the VPC peering project.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Resource</button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Filters */}
      <GlassCard style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600 }}>Filter:</span>
        <select className="form-select" style={{ width: 'auto', padding: '6px 12px' }}
          value={filterVpc} onChange={e => setFilterVpc(e.target.value)}>
          <option value="">All VPCs</option>
          {VPC_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', padding: '6px 12px' }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterVpc || filterType) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterVpc(''); setFilterType(''); }}>
            Clear ✕
          </button>
        )}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          {resources.length} resource{resources.length !== 1 ? 's' : ''}
        </span>
      </GlassCard>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading resources…</span></div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗄️</div>
          <h3>No resources found</h3>
          <p>Click "+ Add Resource" to start tracking your AWS resources.</p>
        </div>
      ) : (
        <div className="grid-2">
          {resources.map(r => (
            <GlassCard key={r.id} style={{ padding: '20px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {TYPE_ICONS[r.type] || '📦'} {r.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.type}</div>
                </div>
                <button
                  className={`badge ${STATUS_BADGE[r.status] || 'badge-pending'}`}
                  style={{ cursor: 'pointer', background: 'none', border: '1px solid', fontFamily: 'inherit' }}
                  onClick={() => handleStatusToggle(r)}
                  title="Click to cycle status"
                >
                  {r.status}
                </button>
              </div>

              {/* Details */}
              <div style={s.detailGrid}>
                <span style={s.detailLabel}>VPC</span>
                <span style={s.detailValue}>{r.vpc}</span>
                <span style={s.detailLabel}>Region</span>
                <span style={s.detailValue}>{r.region}</span>
                {r.cidr && <><span style={s.detailLabel}>CIDR / IP</span><code style={{ ...s.detailValue, color: '#FF9900' }}>{r.cidr}</code></>}
                {r.aws_id && <><span style={s.detailLabel}>AWS ID</span><code style={{ ...s.detailValue, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{r.aws_id}</code></>}
              </div>

              {r.notes && (
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
                  {r.notes}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(r.id)}>🗑️</button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editTarget ? '✏️ Edit Resource' : '+ New Resource'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              {formError && <div className="alert alert-error">{formError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Resource Name *</label>
                  <input className="form-input" required placeholder="e.g. VPC-1, Public-Subnet-1"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">VPC</label>
                  <select className="form-select" value={form.vpc} onChange={e => setForm(f => ({ ...f, vpc: e.target.value }))}>
                    {VPC_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select className="form-select" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CIDR / IP Address</label>
                  <input className="form-input" placeholder="e.g. 10.28.0.0/16"
                    value={form.cidr} onChange={e => setForm(f => ({ ...f, cidr: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">AWS Resource ID</label>
                  <input className="form-input" placeholder="e.g. vpc-0abc1234"
                    value={form.aws_id} onChange={e => setForm(f => ({ ...f, aws_id: e.target.value }))} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" placeholder="Optional notes about this resource…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Delete Resource</span>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
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

const TYPE_ICONS = {
  'VPC': '🌐', 'Subnet': '📦', 'EC2 Instance': '💻', 'Internet Gateway': '🚪',
  'Route Table': '🛣️', 'VPC Peering': '🔗', 'Security Group': '🔒',
  'Key Pair': '🔑', 'Elastic IP': '📍', 'Other': '📌',
};

const STATUS_BADGE = {
  pending: 'badge-pending', created: 'badge-created', active: 'badge-active',
  failed: 'badge-failed', deleted: 'badge-deleted',
};

const s = {
  pageTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 10 },
  pageSub:   { color: 'rgba(255,255,255,0.55)', fontSize: '1rem' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', alignItems: 'center' },
  detailLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  detailValue: { fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' },
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
    animation: 'fadeIn 0.3s ease',
  },
};
