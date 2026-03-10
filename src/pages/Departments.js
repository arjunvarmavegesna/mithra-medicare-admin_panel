// src/pages/Departments.js - Full department management
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULT_DEPARTMENTS = [
  'General Medicine', 'Child Specialist (Pediatrics)', 'Orthopaedics',
  'Gynaecology', 'Cardiology', 'Dermatology', 'ENT', 'Ophthalmology',
];

const DEPT_ICONS = {
  'General Medicine': '🩺',
  'Child Specialist (Pediatrics)': '👶',
  'Orthopaedics': '🦴',
  'Gynaecology': '🌸',
  'Cardiology': '❤️',
  'Dermatology': '🧴',
  'ENT': '👂',
  'Ophthalmology': '👁️',
};

async function getToken() {
  return await auth.currentUser?.getIdToken();
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState('');
  const [newFee, setNewFee] = useState(200);
  const [newIcon, setNewIcon] = useState('🏥');
  const [editFee, setEditFee] = useState({});
  const [saving, setSaving] = useState('');

  const load = async () => {
    try {
      const token = await getToken();
      const [deptsRes, feesRes] = await Promise.all([
        axios.get(`${API}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/fees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDepartments(deptsRes.data);
      setFees(feesRes.data);
    } catch {
      // Fallback to defaults if API not ready
      setDepartments(DEFAULT_DEPARTMENTS.map((name, i) => ({
        id: name, name, icon: DEPT_ICONS[name] || '🏥', isActive: true, order: i,
      })));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddDept = async () => {
    if (!newDept.trim()) return toast.error('Enter department name!');
    if (departments.find(d => d.name.toLowerCase() === newDept.toLowerCase()))
      return toast.error('Department already exists!');
    setSaving('add');
    try {
      const token = await getToken();
      await axios.post(`${API}/api/departments`, {
        name: newDept.trim(), icon: newIcon, fee: Number(newFee), isActive: true,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${newDept} added! ✅`);
      setNewDept(''); setNewFee(200); setNewIcon('🏥');
      load();
    } catch { toast.error('Failed to add department'); }
    finally { setSaving(''); }
  };

  const handleToggle = async (dept) => {
    try {
      const token = await getToken();
      await axios.patch(`${API}/api/departments/${encodeURIComponent(dept.id)}`,
        { isActive: !dept.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDepartments(prev => prev.map(d =>
        d.id === dept.id ? { ...d, isActive: !d.isActive } : d
      ));
      toast.success(`${dept.name} ${!dept.isActive ? 'enabled ✅' : 'disabled 🔴'}`);
    } catch { toast.error('Failed to update'); }
  };

  const handleUpdateFee = async (deptName) => {
    const fee = editFee[deptName];
    if (!fee || isNaN(fee)) return toast.error('Enter valid fee!');
    setSaving(deptName);
    try {
      const token = await getToken();
      await axios.post(`${API}/api/fees`,
        { department: deptName, fee: Number(fee) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFees(prev => ({ ...prev, [deptName]: Number(fee) }));
      setEditFee(prev => ({ ...prev, [deptName]: '' }));
      toast.success(`Fee updated to ₹${fee} ✅`);
    } catch { toast.error('Failed to update fee'); }
    finally { setSaving(''); }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Remove "${dept.name}" department? This will hide it from the bot.`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API}/api/departments/${encodeURIComponent(dept.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${dept.name} removed!`);
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const activeDepts = departments.filter(d => d.isActive !== false);
  const inactiveDepts = departments.filter(d => d.isActive === false);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Departments</h1>
          <div style={s.badges}>
            <span style={s.badge}>{activeDepts.length} active</span>
            <span style={{ ...s.badge, background: '#fee2e2', color: '#991b1b' }}>
              {inactiveDepts.length} inactive
            </span>
          </div>
        </div>
      </div>

      {/* ── ADD NEW DEPARTMENT ── */}
      <div style={s.addCard}>
        <h3 style={s.cardTitle}>➕ Add New Department</h3>
        <div style={s.addGrid}>
          <div style={s.field}>
            <label style={s.label}>Department Name *</label>
            <input
              value={newDept}
              onChange={e => setNewDept(e.target.value)}
              placeholder="e.g. Neurology"
              style={s.input}
              onKeyDown={e => e.key === 'Enter' && handleAddDept()}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Icon (emoji)</label>
            <input
              value={newIcon}
              onChange={e => setNewIcon(e.target.value)}
              placeholder="🏥"
              style={{ ...s.input, width: '80px', textAlign: 'center', fontSize: '20px' }}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>💰 Default Fee (₹)</label>
            <input
              type="number"
              value={newFee}
              onChange={e => setNewFee(e.target.value)}
              placeholder="200"
              style={s.input}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleAddDept}
              disabled={saving === 'add'}
              style={s.addBtn}
            >
              {saving === 'add' ? 'Adding...' : '➕ Add Department'}
            </button>
          </div>
        </div>
      </div>

      {/* ── DEPARTMENT LIST ── */}
      {loading ? (
        <div style={s.loading}>Loading departments...</div>
      ) : (
        <div style={s.grid}>
          {departments.map(dept => (
            <div key={dept.id} style={{
              ...s.card,
              borderTop: `3px solid ${dept.isActive !== false ? '#0f766e' : '#ef4444'}`,
              opacity: dept.isActive !== false ? 1 : 0.7,
            }}>
              <div style={s.cardTop}>
                <div style={{
                  ...s.deptIcon,
                  background: dept.isActive !== false
                    ? 'linear-gradient(135deg,#0f766e,#14b8a6)'
                    : 'linear-gradient(135deg,#9ca3af,#6b7280)',
                }}>
                  {dept.icon || DEPT_ICONS[dept.name] || '🏥'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.deptName}>{dept.name}</div>
                  <div style={s.deptStatus}>
                    {dept.isActive !== false
                      ? '🟢 Active — showing in bot'
                      : '🔴 Inactive — hidden from bot'}
                  </div>
                </div>
                {/* Toggle */}
                <div
                  onClick={() => handleToggle(dept)}
                  style={{
                    ...s.toggle,
                    background: dept.isActive !== false ? '#0f766e' : '#d1d5db',
                  }}
                >
                  <div style={{
                    ...s.toggleThumb,
                    transform: dept.isActive !== false ? 'translateX(20px)' : 'translateX(2px)',
                  }} />
                </div>
              </div>

              {/* Fee editor */}
              <div style={s.feeRow}>
                <div style={s.feeDisplay}>
                  <span style={s.feeLabel}>💰 Current Fee</span>
                  <span style={s.feeValue}>₹{fees[dept.name] || 200}</span>
                </div>
                <div style={s.feeEdit}>
                  <input
                    type="number"
                    placeholder="New fee"
                    value={editFee[dept.name] || ''}
                    onChange={e => setEditFee(prev => ({ ...prev, [dept.name]: e.target.value }))}
                    style={s.feeInput}
                  />
                  <button
                    onClick={() => handleUpdateFee(dept.name)}
                    disabled={saving === dept.name}
                    style={s.feeBtn}
                  >
                    {saving === dept.name ? '...' : '💾'}
                  </button>
                </div>
              </div>

              {/* Inactive warning */}
              {dept.isActive === false && (
                <div style={s.inactiveBanner}>
                  🔴 Hidden from WhatsApp bot — patients cannot book this department
                </div>
              )}

              <div style={s.cardActions}>
                <button onClick={() => handleToggle(dept)} style={{
                  ...s.actionBtn,
                  background: dept.isActive !== false ? '#fef3c7' : '#d1fae5',
                  color: dept.isActive !== false ? '#92400e' : '#065f46',
                }}>
                  {dept.isActive !== false ? '🔴 Disable' : '🟢 Enable'}
                </button>
                <button onClick={() => handleDelete(dept)} style={s.deleteBtn}>
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>ℹ️ How Departments Work</div>
        <div style={s.infoText}>
          • <strong>Active departments</strong> show in the WhatsApp bot when patients book appointments<br/>
          • <strong>Disabled departments</strong> are hidden from patients but data is preserved<br/>
          • <strong>Consultation fee</strong> is charged per department (can be overridden per doctor)<br/>
          • Changes take effect <strong>immediately</strong> — no restart needed!
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: '28px', maxWidth: '1100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  badges: { display: 'flex', gap: '8px', marginTop: '8px' },
  badge: { padding: '3px 10px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  addCard: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'start' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  addBtn: { padding: '10px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', height: '42px' },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  deptIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  deptName: { fontWeight: '700', fontSize: '14px', color: '#0f172a' },
  deptStatus: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  toggle: { width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s' },
  feeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', gap: '8px' },
  feeDisplay: { display: 'flex', flexDirection: 'column' },
  feeLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600' },
  feeValue: { fontSize: '20px', fontWeight: '700', color: '#0f766e' },
  feeEdit: { display: 'flex', gap: '6px', alignItems: 'center' },
  feeInput: { width: '90px', padding: '6px 8px', border: '2px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' },
  feeBtn: { padding: '6px 10px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' },
  inactiveBanner: { background: '#fef2f2', color: '#991b1b', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '10px', textAlign: 'center' },
  cardActions: { display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
  actionBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' },
  deleteBtn: { flex: 1, padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' },
  infoBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' },
  infoTitle: { fontWeight: '700', color: '#065f46', marginBottom: '8px', fontSize: '14px' },
  infoText: { fontSize: '13px', color: '#047857', lineHeight: '1.8' },
};
