// src/pages/Doctors.js - Enhanced with availability toggle + consultation fees
import React, { useState, useEffect } from 'react';
import { getDoctors, addDoctor, updateDoctor, removeDoctor } from '../services/api';
import axios from 'axios';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Generate all slots from 6AM to 9PM in 30-min intervals
function generateAllSlots() {
  const slots = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m > 0) break;
      const period = h < 12 ? 'AM' : 'PM';
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push(`${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`);
    }
  }
  return slots;
}
const TIME_SLOTS = generateAllSlots();

const emptyForm = {
  name: '', department: '', qualification: 'MBBS',
  experience: '', consultationFee: 200, isAvailable: true,
  availableDays: [], availableTimeSlots: [],
};

// Toggle switch component
function Toggle({ checked, onChange, label }) {
  return (
    <div style={styles.toggleWrap} onClick={onChange}>
      <div style={{ ...styles.toggleTrack, background: checked ? '#0f766e' : '#d1d5db' }}>
        <div style={{ ...styles.toggleThumb, transform: checked ? 'translateX(20px)' : 'translateX(2px)' }} />
      </div>
      {label && <span style={{ fontSize: '13px', color: checked ? '#065f46' : '#6b7280', fontWeight: '600' }}>
        {checked ? '🟢 Available' : '🔴 Unavailable'}
      </span>}
    </div>
  );
}

async function toggleAvailability(id, isAvailable) {
  const user = auth.currentUser;
  const token = await user.getIdToken();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  await axios.patch(`${API}/api/doctors/${id}/availability`, { isAvailable }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterAvail, setFilterAvail] = useState('all');

  const loadDepartments = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`${API}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const active = res.data.filter(d => d.isActive !== false).map(d => d.name);
      if (active.length > 0) {
        setDepartments(active);
        setForm(f => ({ ...f, department: f.department || active[0] }));
      } else {
        throw new Error('No departments');
      }
    } catch {
      const defaults = ['General Medicine','Child Specialist (Pediatrics)','Orthopaedics','Gynaecology','Cardiology','Dermatology','ENT','Ophthalmology'];
      setDepartments(defaults);
      setForm(f => ({ ...f, department: f.department || defaults[0] }));
    }
  };

  const load = () => {
    getDoctors().then(setDoctors).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); loadDepartments(); }, []);

  const toggleDay = (day) => setForm(f => ({
    ...f, availableDays: f.availableDays.includes(day) ? f.availableDays.filter(d => d !== day) : [...f.availableDays, day]
  }));

  const toggleSlot = (slot) => setForm(f => ({
    ...f, availableTimeSlots: f.availableTimeSlots.includes(slot) ? f.availableTimeSlots.filter(s => s !== slot) : [...f.availableTimeSlots, slot]
  }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Doctor name required');
    if (!form.department) return toast.error('Please select a department');
    // Make sure department is set from loaded list if empty
    const submitForm = { 
      ...form, 
      department: form.department || departments[0] 
    };
    setSaving(true);
    try {
      if (editId) { await updateDoctor(editId, submitForm); toast.success('Doctor updated!'); }
      else { await addDoctor(submitForm); toast.success('Doctor added!'); }
      setShowForm(false); setForm(emptyForm); setEditId(null); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEdit = (doc) => {
    setForm({
      name: doc.name, department: doc.department, qualification: doc.qualification,
      experience: doc.experience, consultationFee: doc.consultationFee || 200,
      isAvailable: doc.isAvailable !== false,
      availableDays: doc.availableDays || [], availableTimeSlots: doc.availableTimeSlots || [],
    });
    setEditId(doc.id); setShowForm(true);
  };

  const handleToggleAvailability = async (doc) => {
    const newVal = !doc.isAvailable;
    try {
      await toggleAvailability(doc.id, newVal);
      setDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, isAvailable: newVal } : d));
      toast.success(`Dr. ${doc.name} marked as ${newVal ? 'Available ✅' : 'Unavailable 🔴'}`);
    } catch { toast.error('Failed to update availability'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this doctor?')) return;
    try { await removeDoctor(id); toast.success('Doctor removed'); load(); }
    catch { toast.error('Failed to remove'); }
  };

  const filtered = doctors.filter(d => {
    if (filterAvail === 'available') return d.isAvailable !== false;
    if (filterAvail === 'unavailable') return d.isAvailable === false;
    return true;
  });

  return (
    <div style={styles.page}>
      {/* Modal */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{editId ? '✏️ Edit Doctor' : '➕ Add New Doctor'}</h3>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Doctor Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Department *</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={styles.input}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Qualification</label>
                <input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="MBBS, MD..." style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Experience</label>
                <input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 10 years" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>💰 Consultation Fee (₹)</label>
                <input type="number" value={form.consultationFee} onChange={e => setForm({ ...form, consultationFee: Number(e.target.value) })} placeholder="200" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Availability Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <Toggle checked={form.isAvailable} onChange={() => setForm({ ...form, isAvailable: !form.isAvailable })} label={true} />
                </div>
              </div>
              <div style={{ ...styles.field, gridColumn: '1/-1' }}>
                <label style={styles.label}>Available Days</label>
                <div style={styles.chips}>
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      style={{ ...styles.chip, ...(form.availableDays.includes(day) ? styles.chipActive : {}) }}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ ...styles.field, gridColumn: '1/-1' }}>
                <label style={styles.label}>Available Time Slots</label>
                <div style={styles.chips}>
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} type="button" onClick={() => toggleSlot(slot)}
                      style={{ ...styles.chip, ...(form.availableTimeSlots.includes(slot) ? styles.chipActive : {}) }}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }} style={styles.btnGhost}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={styles.btnPrimary}>
                {saving ? 'Saving...' : editId ? '💾 Update' : '➕ Add Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Doctors</h1>
          <p style={styles.pageSub}>
            <span style={styles.countBadge}>{doctors.filter(d => d.isAvailable !== false).length} available</span>
            <span style={{ ...styles.countBadge, background: '#fee2e2', color: '#991b1b' }}>
              {doctors.filter(d => d.isAvailable === false).length} unavailable
            </span>
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={styles.addBtn}>➕ Add Doctor</button>
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {[['all', '📋 All', doctors.length], ['available', '🟢 Available', doctors.filter(d => d.isAvailable !== false).length], ['unavailable', '🔴 Unavailable', doctors.filter(d => d.isAvailable === false).length]].map(([val, label, count]) => (
          <button key={val} onClick={() => setFilterAvail(val)}
            style={{ ...styles.tab, ...(filterAvail === val ? styles.tabActive : {}) }}>
            {label} <span style={styles.tabCount}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? <div style={styles.loading}>Loading doctors...</div>
        : filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍⚕️</div>
            <div>No doctors found.</div>
            <button onClick={() => setShowForm(true)} style={{ ...styles.addBtn, marginTop: '16px' }}>Add First Doctor</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(doc => (
              <div key={doc.id} style={{ ...styles.card, borderTop: `3px solid ${doc.isAvailable !== false ? '#0f766e' : '#ef4444'}` }}>
                <div style={styles.cardTop}>
                  <div style={{ ...styles.avatar, background: doc.isAvailable !== false ? 'linear-gradient(135deg,#0f766e,#0d9488)' : 'linear-gradient(135deg,#9ca3af,#6b7280)' }}>
                    {doc.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.docName}>Dr. {doc.name}</div>
                    <div style={styles.docDept}>{doc.department}</div>
                    <div style={styles.docQual}>{doc.qualification}{doc.experience && ` • ${doc.experience}`}</div>
                  </div>
                  {/* Big availability toggle */}
                  <Toggle checked={doc.isAvailable !== false} onChange={() => handleToggleAvailability(doc)} label={true} />
                </div>

                <div style={styles.feeRow}>
                  <span style={styles.feeLabel}>💰 Consultation Fee</span>
                  <span style={styles.feeValue}>₹{doc.consultationFee || 200}</span>
                </div>

                {doc.availableDays?.length > 0 && (
                  <div style={styles.infoRow}>
                    <span>📅</span>
                    <span style={styles.infoText}>{doc.availableDays.join(', ')}</span>
                  </div>
                )}
                {doc.availableTimeSlots?.length > 0 && (
                  <div style={styles.infoRow}>
                    <span>⏰</span>
                    <span style={styles.infoText}>
                      {doc.availableTimeSlots.slice(0, 3).join(', ')}
                      {doc.availableTimeSlots.length > 3 && ` +${doc.availableTimeSlots.length - 3} more`}
                    </span>
                  </div>
                )}

                {/* Unavailable banner */}
                {doc.isAvailable === false && (
                  <div style={styles.unavailBanner}>
                    🔴 Currently unavailable — hidden from WhatsApp bot
                  </div>
                )}

                <div style={styles.cardActions}>
                  <button onClick={() => handleEdit(doc)} style={styles.editBtn}>✏️ Edit</button>
                  <button onClick={() => handleRemove(doc.id)} style={styles.removeBtn}>🗑️ Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

const styles = {
  page: { padding: '28px', maxWidth: '1200px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  pageSub: { display: 'flex', gap: '8px', marginTop: '8px' },
  countBadge: { padding: '3px 10px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  addBtn: { padding: '10px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
  tabActive: { borderColor: '#0f766e', background: '#d1fae5', color: '#065f46' },
  tabCount: { background: '#f1f5f9', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  cardTop: { display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' },
  avatar: { width: '48px', height: '48px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 },
  docName: { fontWeight: '700', fontSize: '15px', color: '#0f172a' },
  docDept: { fontSize: '12px', color: '#0f766e', fontWeight: '600', marginTop: '2px' },
  docQual: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  feeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '10px' },
  feeLabel: { fontSize: '13px', color: '#374151' },
  feeValue: { fontSize: '18px', fontWeight: '700', color: '#0f766e' },
  infoRow: { display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px', fontSize: '12px', color: '#475569' },
  infoText: { flex: 1, lineHeight: '1.4' },
  unavailBanner: { background: '#fef2f2', color: '#991b1b', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', marginTop: '10px', textAlign: 'center' },
  cardActions: { display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' },
  editBtn: { flex: 1, padding: '8px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  removeBtn: { flex: 1, padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  // Toggle
  toggleWrap: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  toggleTrack: { width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: { padding: '6px 12px', border: '2px solid #e5e7eb', borderRadius: '20px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#64748b', fontFamily: 'inherit' },
  chipActive: { borderColor: '#0f766e', background: '#d1fae5', color: '#065f46', fontWeight: '600' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  btnGhost: { padding: '10px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnPrimary: { padding: '10px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
