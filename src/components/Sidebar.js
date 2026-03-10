// src/components/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/appointments', label: 'Appointments', icon: '📅' },
  { path: '/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { path: '/patients', label: 'Patients', icon: '👥' },
  { path: '/departments', label: 'Departments', icon: '🏥' },
  { path: '/settings', label: 'Time Slots', icon: '⏰' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div onClick={onClose} style={styles.overlay} />
      )}

      <aside style={{ ...styles.sidebar, transform: isOpen ? 'translateX(0)' : undefined }}>
        {/* Hospital Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.2"/>
              <path d="M20 8v24M8 20h24" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoName}>Mithra Medicare</div>
            <div style={styles.logoSub}>Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={styles.userArea}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={styles.userText}>
              <div style={styles.userName}>{user?.displayName || 'Admin'}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 40, display: 'none',
    '@media(max-width:768px)': { display: 'block' },
  },
  sidebar: {
    width: '260px',
    background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    position: 'sticky',
    top: 0,
    flexShrink: 0,
    zIndex: 50,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    width: '44px', height: '44px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoName: { color: 'white', fontWeight: '700', fontSize: '15px' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '2px' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px',
    color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
    fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontWeight: '600',
  },
  navIcon: { fontSize: '18px', width: '24px', textAlign: 'center' },
  userArea: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
  },
  avatar: {
    width: '36px', height: '36px',
    background: 'rgba(255,255,255,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '14px',
  },
  userText: { flex: 1, overflow: 'hidden' },
  userName: { color: 'white', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { color: 'rgba(255,255,255,0.5)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    width: '100%', padding: '9px', background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
