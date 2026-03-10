// src/pages/Settings.js - Shift Timing Editor
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function getToken() {
  return await auth.currentUser?.getIdToken();
}

export default function Settings() {
  const [shifts, setShifts] = useState([
    { id: 'morning', label: 'Morning Shift', icon: '🌅', start: '10:00 AM', end: '02:00 PM', isActive: true },
    { id: 'evening', label: 'Evening Shift', icon: '🌆', start: '06:00 PM', end: '08:00 PM', isActive: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API}/api/shifts`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.length > 0) setShifts(res.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveShifts = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.post(`${API}/api/shifts`, { shifts }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Shift timings saved! ✅');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const updateShift = (id, field, value) =>
    setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const toggleShift = (id) =>
    setShifts(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));

  const addShift = () => {
    const id = `shift_${Date.now()}`;
    setShifts(prev => [...prev, { id, label: 'New Shift', icon: '⏰', start: '09:00 AM', end: '01:00 PM', isActive: true }]);
  };

  const removeShift = (id) => {
    if (shifts.length <= 1) return toast.error('Need at least one shift!');
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const activeShifts = shifts.filter(s => s.isActive);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⏰ Shift Timings</h1>
          <p style={s.sub}>Set when patients can book appointments</p>
        </div>
        <button onClick={saveShifts} disabled={saving} style={s.saveBtn}>
          {saving ? '⏳ Saving...' : '💾 Save All Changes'}
        </button>
      </div>

      {/* WhatsApp Preview */}
      <div style={s.previewCard}>
        <div style={s.previewTitle}>📱 What patient sees on WhatsApp:</div>
        <div style={s.previewBox}>
          <div style={s.previewMsg}>
            ⏰ Please select your <strong>Preferred Timing</strong>:
            {activeShifts.map((shift, i) => (
              <div key={shift.id} style={s.previewLine}>
                <strong>{i + 1}.</strong> {shift.icon} {shift.label} — {shift.start} to {shift.end}
              </div>
            ))}
            <div style={s.previewHint}><em>Reply with 1{activeShifts.length > 1 ? ` or ${activeShifts.length}` : ''}</em></div>
          </div>
        </div>
      </div>

      {loading ? <div style={s.loading}>Loading...</div> : (
        <div style={s.grid}>
          {shifts.map((shift, index) => (
            <div key={shift.id} style={{ ...s.card, borderTop: `4px solid ${shift.isActive ? '#0f766e' : '#e5e7eb'}`, opacity: shift.isActive ? 1 : 0.7 }}>
              <div style={s.cardHeader}>
                <div style={s.shiftNum}>{index + 1}</div>
                <input value={shift.icon} onChange={e => updateShift(shift.id, 'icon', e.target.value)} style={s.iconInput} />
                <input value={shift.label} onChange={e => updateShift(shift.id, 'label', e.target.value)} style={s.labelInput} />
                <div onClick={() => toggleShift(shift.id)} style={{ ...s.toggle, background: shift.isActive ? '#0f766e' : '#d1d5db' }}>
                  <div style={{ ...s.toggleThumb, transform: shift.isActive ? 'translateX(20px)' : 'translateX(2px)' }} />
                </div>
              </div>

              <div style={{ ...s.statusBadge, background: shift.isActive ? '#d1fae5' : '#f1f5f9', color: shift.isActive ? '#065f46' : '#6b7280' }}>
                {shift.isActive ? '🟢 Active — shown to patients' : '🔴 Inactive — hidden from patients'}
              </div>

              <div style={s.timeRow}>
                <div style={s.timeField}>
                  <label style={s.label}>🕐 Start Time</label>
                  <input value={shift.start} onChange={e => updateShift(shift.id, 'start', e.target.value)} placeholder="10:00 AM" style={s.timeInput} />
                </div>
                <div style={s.timeSep}>→</div>
                <div style={s.timeField}>
                  <label style={s.label}>🕑 End Time</label>
                  <input value={shift.end} onChange={e => updateShift(shift.id, 'end', e.target.value)} placeholder="02:00 PM" style={s.timeInput} />
                </div>
              </div>

              <div style={s.displayRow}>
                <span style={s.displayLabel}>Shown as:</span>
                <span style={s.displayValue}>{shift.icon} {shift.label} — {shift.start} to {shift.end}</span>
              </div>

              {shifts.length > 1 && (
                <button onClick={() => removeShift(shift.id)} style={s.removeBtn}>🗑️ Remove Shift</button>
              )}
            </div>
          ))}

          <div onClick={addShift} style={s.addCard}>
            <div style={s.addIcon}>➕</div>
            <div style={s.addText}>Add New Shift</div>
          </div>
        </div>
      )}

      <div style={s.infoBox}>
        <strong>ℹ️ How it works:</strong> Patients pick Morning or Evening shift. Admin sees the chosen shift in Appointments. Changes take effect immediately after saving!
      </div>
    </div>
  );
}

const s = {
  page: { padding: '28px', maxWidth: '900px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  sub: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  saveBtn: { padding: '12px 24px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  previewCard: { background: '#0f172a', borderRadius: '16px', padding: '20px', marginBottom: '24px' },
  previewTitle: { color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' },
  previewBox: { background: '#1e293b', borderRadius: '12px', padding: '16px' },
  previewMsg: { color: 'white', fontSize: '14px', lineHeight: '2' },
  previewLine: { marginLeft: '8px', color: '#e2e8f0' },
  previewHint: { color: '#94a3b8', fontSize: '12px', marginTop: '4px' },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  shiftNum: { width: '28px', height: '28px', background: '#0f766e', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  iconInput: { width: '44px', padding: '6px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  labelInput: { flex: 1, padding: '8px 10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', outline: 'none', fontFamily: 'inherit' },
  toggle: { width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '14px', display: 'inline-block' },
  timeRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  timeField: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  timeSep: { color: '#94a3b8', fontSize: '18px', fontWeight: '700', marginTop: '16px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  timeInput: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', fontFamily: 'inherit', textAlign: 'center' },
  displayRow: { background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  displayLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  displayValue: { fontSize: '14px', color: '#0f172a', fontWeight: '600' },
  removeBtn: { width: '100%', padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' },
  addCard: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #e5e7eb', minHeight: '200px', gap: '8px' },
  addIcon: { fontSize: '32px' },
  addText: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  infoBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', fontSize: '13px', color: '#047857', lineHeight: '1.8' },
};
