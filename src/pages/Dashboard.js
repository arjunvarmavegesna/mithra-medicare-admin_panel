// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { getStats, getAppointments } from '../services/api';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
    <div style={{ ...styles.statIcon, background: bg }}>{icon}</div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const statusStyle = {
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  approved: { bg: '#d1fae5', color: '#065f46', label: '✅ Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejected' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAppts, setRecentAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stats
    getStats().then(setStats).catch(() => toast.error('Failed to load stats'));

    // Real-time recent appointments
    const q = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const appts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentAppts(appts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reload stats when new appointments arrive
  useEffect(() => {
    if (recentAppts.length > 0) {
      getStats().then(setStats).catch(() => {});
    }
  }, [recentAppts.length]);

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>Mithra Medicare Hospital — Pedameram, West Godavari</p>
        </div>
        <div style={styles.dateBadge}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <StatCard icon="📅" label="Total Appointments" value={stats?.totalAppointments ?? '—'} color="#0f766e" bg="#d1fae5" />
        <StatCard icon="⏳" label="Pending" value={stats?.pendingAppointments ?? '—'} color="#d97706" bg="#fef3c7" />
        <StatCard icon="✅" label="Approved Today" value={stats?.approvedAppointments ?? '—'} color="#059669" bg="#d1fae5" />
        <StatCard icon="👨‍⚕️" label="Active Doctors" value={stats?.totalDoctors ?? '—'} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="👥" label="Total Patients" value={stats?.totalPatients ?? '—'} color="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="🗓️" label="Today's Appointments" value={stats?.todayAppointments ?? '—'} color="#ec4899" bg="#fce7f3" />
      </div>

      {/* Recent Appointments */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Appointments</h2>
          <a href="/appointments" style={styles.viewAll}>View All →</a>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading appointments...</div>
        ) : recentAppts.length === 0 ? (
          <div style={styles.empty}>No appointments yet. Share the WhatsApp bot number to get started!</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppts.map((appt) => {
                  const s = statusStyle[appt.status] || statusStyle.pending;
                  return (
                    <tr key={appt.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <strong>{appt.patientName}</strong>
                      </td>
                      <td style={styles.td}>{appt.mobileNumber}</td>
                      <td style={styles.td}>{appt.department}</td>
                      <td style={styles.td}>{appt.doctorName}</td>
                      <td style={styles.td}>{appt.preferredDate} {appt.preferredTime}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '28px', maxWidth: '1200px' },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
  },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px', marginBottom: 0 },
  dateBadge: {
    padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px',
    fontSize: '13px', color: '#475569',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '32px',
  },
  statCard: {
    background: 'white', borderRadius: '12px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  },
  statIcon: {
    width: '48px', height: '48px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
  },
  statValue: { fontSize: '26px', fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  section: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
  },
  sectionTitle: { fontSize: '17px', fontWeight: '600', color: '#0f172a', margin: 0 },
  viewAll: { fontSize: '13px', color: '#0f766e', textDecoration: 'none', fontWeight: '600' },
  loading: { padding: '40px', textAlign: 'center', color: '#94a3b8' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};
