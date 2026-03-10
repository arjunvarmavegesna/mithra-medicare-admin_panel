// src/pages/Patients.js
import React, { useState, useEffect } from 'react';
import { getPatients } from '../services/api';
import toast from 'react-hot-toast';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    search === '' ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.mobileNumber?.includes(search)
  );

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Patients</h1>
        <div style={styles.count}>{patients.length} total patients</div>
      </div>

      <input
        placeholder="🔍 Search by name or mobile..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={styles.search}
      />

      {loading ? (
        <div style={styles.loading}>Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No patients found.</div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['#', 'Patient Name', 'Mobile', 'WhatsApp', 'Total Appointments', 'First Visit', 'Last Visit'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={{ ...styles.td, color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.patientAvatar}>
                      <div style={styles.avatarCircle}>{p.name?.[0]?.toUpperCase()}</div>
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>📱 {p.mobileNumber}</td>
                  <td style={styles.td}>
                    <a
                      href={`https://wa.me/${p.whatsappPhone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.waLink}
                    >
                      💬 Chat
                    </a>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{p.totalAppointments || 0}</span>
                  </td>
                  <td style={styles.td}>{p.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</td>
                  <td style={styles.td}>{p.lastVisit?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '28px', maxWidth: '1200px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  count: { padding: '6px 14px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  search: { width: '100%', maxWidth: '400px', padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '20px', display: 'block', fontFamily: 'inherit', boxSizing: 'border-box' },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '12px' },
  tableCard: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151' },
  patientAvatar: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarCircle: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e, #0d9488)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  badge: { padding: '3px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  waLink: { padding: '5px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' },
};
