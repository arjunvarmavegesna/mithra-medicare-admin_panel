// src/pages/FamilyCards.js
import React, { useState, useEffect } from 'react';
import { getFamilyCards, getFamilyCardStats, updateFamilyCard, deleteFamilyCard } from '../services/api';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const statusColors = {
  active:   { bg: '#d1fae5', color: '#065f46', label: '✅ Active' },
  payment_pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending Payment' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' },
  expired:  { bg: '#f1f5f9', color: '#475569', label: '⌛ Expired' },
};

export default function FamilyCards() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [cardsData, statsData] = await Promise.all([getFamilyCards(), getFamilyCardStats()]);
      setCards(cardsData);
      setStats(statsData);
    } catch { toast.error('Failed to load family cards'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (card) => {
    const newStatus = card.status === 'active' ? 'cancelled' : 'active';
    try {
      await updateFamilyCard(card.id, { status: newStatus });
      toast.success(`Card ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed to update card'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this family card? This cannot be undone.')) return;
    try {
      await deleteFamilyCard(id);
      toast.success('Card cancelled');
      load();
    } catch { toast.error('Failed to cancel card'); }
  };

  const filtered = cards.filter(c => {
    const matchSearch = !search ||
      c.holderName?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.cardNumber?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'active' && c.status === 'active' && !c.isExpired) ||
      (filter === 'pending' && c.paymentStatus !== 'paid') ||
      (filter === 'expired' && (c.isExpired || c.status === 'cancelled'));
    return matchSearch && matchFilter;
  });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>💳 Family Health Cards</h1>
          <p style={styles.pageSubtitle}>Manage all family health card subscriptions</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {[
          { icon: '💳', label: 'Total Cards', value: stats?.total ?? '—', color: '#0f766e', bg: '#d1fae5' },
          { icon: '✅', label: 'Active', value: stats?.active ?? '—', color: '#059669', bg: '#d1fae5' },
          { icon: '⏳', label: 'Pending Payment', value: stats?.pending ?? '—', color: '#d97706', bg: '#fef3c7' },
          { icon: '⌛', label: 'Expired', value: stats?.expired ?? '—', color: '#64748b', bg: '#f1f5f9' },
          { icon: '💰', label: 'Total Revenue', value: stats?.revenue ? `₹${stats.revenue.toLocaleString('en-IN')}` : '—', color: '#8b5cf6', bg: '#ede9fe' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ ...styles.statIcon, background: s.bg }}>{s.icon}</div>
            <div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.toolbar}>
        <input
          placeholder="🔍 Search by name, phone or card number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.filterTabs}>
          {['all', 'active', 'pending', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ ...styles.filterTab, ...(filter === f ? styles.filterTabActive : {}) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.empty}>Loading cards...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            {cards.length === 0
              ? '💳 No family cards yet. Customers can buy via WhatsApp option 5️⃣'
              : 'No cards match your search.'}
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>Card Number</th>
                  <th style={styles.th}>Holder Name</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Issue Date</th>
                  <th style={styles.th}>Valid Till</th>
                  <th style={styles.th}>Days Left</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(card => {
                  const statusKey = card.isExpired ? 'expired'
                    : card.paymentStatus !== 'paid' ? 'payment_pending'
                    : card.status || 'active';
                  const s = statusColors[statusKey] || statusColors.payment_pending;
                  return (
                    <tr key={card.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <span style={styles.cardNumber}>{card.cardNumber}</span>
                      </td>
                      <td style={styles.td}><strong>{card.holderName}</strong></td>
                      <td style={styles.td}>{card.phone}</td>
                      <td style={styles.td}>{card.purchaseDate}</td>
                      <td style={styles.td}>
                        <span style={{ color: card.isExpired ? '#ef4444' : '#059669', fontWeight: '600' }}>
                          {card.expiryDate}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {card.paymentStatus === 'paid' && !card.isExpired
                          ? <span style={{ color: card.daysLeft < 30 ? '#d97706' : '#059669', fontWeight: '600' }}>
                              {card.daysLeft}d
                            </span>
                          : '—'}
                      </td>
                      <td style={styles.td}>₹{card.amount || 1000}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {/* View card */}
                          {card.paymentStatus === 'paid' && (
                            <a
                              href={`${BASE_URL}/family-card/${card.id}`}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.actionBtn}
                              title="View Card"
                            >
                              👁️
                            </a>
                          )}
                          {/* Toggle active/cancelled */}
                          {card.paymentStatus === 'paid' && !card.isExpired && (
                            <button
                              onClick={() => handleToggleStatus(card)}
                              style={{ ...styles.actionBtn, ...(card.status === 'active' ? styles.actionBtnWarn : styles.actionBtnGreen) }}
                              title={card.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {card.status === 'active' ? '🚫' : '✅'}
                            </button>
                          )}
                          {/* Cancel */}
                          <button
                            onClick={() => handleDelete(card.id)}
                            style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                            title="Cancel Card"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={styles.tableFooter}>
          Showing {filtered.length} of {cards.length} cards
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '28px', maxWidth: '1300px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px', marginBottom: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  statIcon: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '240px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' },
  filterTabs: { display: 'flex', gap: '6px' },
  filterTab: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '13px', cursor: 'pointer', color: '#64748b', fontWeight: '500' },
  filterTabActive: { background: '#0f766e', color: 'white', border: '1px solid #0f766e' },
  tableCard: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151' },
  cardNumber: { fontFamily: 'monospace', fontWeight: '700', color: '#0f766e', fontSize: '13px', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' },
  actionBtnWarn: { background: '#fef3c7', border: '1px solid #fde68a' },
  actionBtnGreen: { background: '#d1fae5', border: '1px solid #a7f3d0' },
  actionBtnDanger: { background: '#fee2e2', border: '1px solid #fecaca' },
  empty: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  tableFooter: { padding: '12px 16px', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9' },
};
