// src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Departments from './pages/Departments';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={styles.main}>
        {/* Mobile topbar */}
        <div style={styles.topbar}>
          <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>☰</button>
          <div style={styles.topbarTitle}>
            <span style={styles.crossIcon}>✚</span> Mithra Medicare
          </div>
        </div>
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '10px', fontFamily: "'Segoe UI', system-ui, sans-serif" }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <Layout><Appointments /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute>
              <Layout><Doctors /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <Layout><Patients /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/departments" element={
            <ProtectedRoute>
              <Layout><Departments /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  loading: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f8fafc', fontSize: '16px', color: '#64748b',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  layout: {
    display: 'flex', minHeight: '100vh', background: '#f8fafc',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: {
    display: 'none', // Hidden on desktop, shown on mobile via @media
    alignItems: 'center', gap: '12px', padding: '14px 20px',
    background: 'white', borderBottom: '1px solid #e5e7eb',
    position: 'sticky', top: 0, zIndex: 30,
  },
  menuBtn: {
    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#374151',
  },
  topbarTitle: { fontWeight: '700', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' },
  crossIcon: { color: '#0f766e', fontWeight: '900' },
  content: { flex: 1, overflowY: 'auto' },
};

export default App;
