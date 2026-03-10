// src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { updateAppointment, deleteAppointment, exportAppointments } from '../services/api';
import toast from 'react-hot-toast';

const statusStyle = {
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  approved: { bg: '#d1fae5', color: '#065f46', label: '✅ Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejected' },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editAppt, setEditAppt] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await updateAppointment(id, { status });
      toast.success(`Appointment ${status}! Patient notified via WhatsApp.`);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await deleteAppointment(id);
      toast.success('Appointment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = async () => {
    if (!editAppt) return;
    setSaving(true);
    try {
      await updateAppointment(editAppt.id, {
        patientName: editAppt.patientName,
        mobileNumber: editAppt.mobileNumber,
        department: editAppt.department,
        doctorName: editAppt.doctorName,
        preferredDate: editAppt.preferredDate,
        preferredTime: editAppt.preferredTime,
        notes: noteInput,
      });
      toast.success('Appointment updated');
      setEditAppt(null);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const filtered = appointments.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter;
    const matchSearch = search === '' ||
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.mobileNumber?.includes(search) ||
      a.department?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={styles.page}>
      {/* Edit Modal */}
      {editAppt && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Edit Appointment</h3>
            <div style={styles.modalGrid}>
              {[
                ['Patient Name', 'patientName'],
                ['Mobile Number', 'mobileNumber'],
                ['Department', 'department'],
                ['Doctor', 'doctorName'],
                ['Preferred Date', 'preferredDate'],
                ['Preferred Time', 'preferredTime'],
              ].map(([label, key]) => (
                <div key={key} style={styles.field}>
                  <label style={styles.label}>{label}</label>
                  <input
                    value={editAppt[key] || ''}
                    onChange={e => setEditAppt({ ...editAppt, [key]: e.target.value })}
                    style={styles.input}
                  />
                </div>
              ))}
              <div style={{ ...styles.field, gridColumn: '1/-1' }}>
                <label style={styles.label}>Admin Notes</label>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  rows={3}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setEditAppt(null)} style={styles.btnGhost}>Cancel</button>
              <button onClick={handleEdit} disabled={saving} style={styles.btnPrimary}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Appointments</h1>
        <button onClick={() => exportAppointments().catch(() => toast.error('Export failed'))}
          style={styles.exportBtn}>
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          placeholder="🔍 Search patient, mobile, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.tabs}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ ...styles.tab, ...(filter === f ? styles.tabActive : {}) }}
            >
              {f === 'all' ? '📋 All' : statusStyle[f]?.label}
              <span style={styles.tabCount}>
                {f === 'all' ? appointments.length : appointments.filter(a => a.status === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.loading}>Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No appointments found.</div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['#', 'Patient', 'Mobile', 'Department', 'Doctor', 'Date', 'Time', 'Status', 'Actions'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, i) => {
                  const s = statusStyle[appt.status] || statusStyle.pending;
                  return (
                    <tr key={appt.id} style={styles.tr}>
                      <td style={{ ...styles.td, color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.patientName}>{appt.patientName}</div>
                        <div style={styles.patientSub}>via WhatsApp</div>
                      </td>
                      <td style={styles.td}>{appt.mobileNumber}</td>
                      <td style={styles.td}>{appt.department}</td>
                      <td style={styles.td}>{appt.doctorName || '—'}</td>
                      <td style={styles.td}>{appt.preferredDate}</td>
                      <td style={styles.td}>{appt.preferredTime}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {appt.status !== 'approved' && (
                            <button
                              onClick={() => handleStatus(appt.id, 'approved')}
                              style={{ ...styles.actionBtn, ...styles.approveBtn }}
                              title="Approve"
                            >✓</button>
                          )}
                          {appt.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatus(appt.id, 'rejected')}
                              style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                              title="Reject"
                            >✕</button>
                          )}
                          <button
                            onClick={() => { setEditAppt(appt); setNoteInput(appt.notes || ''); }}
                            style={{ ...styles.actionBtn, ...styles.editBtn }}
                            title="Edit"
                          >✏️</button>
                          <button
                            onClick={() => handleDelete(appt.id)}
                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                            title="Delete"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '28px', maxWidth: '1400px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  exportBtn: {
    padding: '10px 18px', background: '#0f766e', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  filters: { marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: {
    padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '10px',
    fontSize: '14px', outline: 'none', flex: '1', minWidth: '240px', fontFamily: 'inherit',
  },
  tabs: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tab: {
    padding: '8px 14px', border: '2px solid #e5e7eb', borderRadius: '8px',
    background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px',
  },
  tabActive: { borderColor: '#0f766e', background: '#d1fae5', color: '#065f46' },
  tabCount: {
    background: '#f1f5f9', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700',
  },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '12px' },
  tableCard: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px', fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' },
  patientName: { fontWeight: '600', color: '#0f172a' },
  patientSub: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  approveBtn: { background: '#d1fae5', color: '#065f46' },
  rejectBtn: { background: '#fee2e2', color: '#991b1b' },
  editBtn: { background: '#dbeafe', color: '#1d4ed8' },
  deleteBtn: { background: '#f1f5f9', color: '#64748b' },
  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '24px' },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  btnGhost: { padding: '10px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnPrimary: { padding: '10px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
