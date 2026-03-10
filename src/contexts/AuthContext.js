// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const ADMIN_EMAILS = [
  'admin@mithramedicare.com',
  'doctor@mithramedicare.com',
  // Add more admin emails here
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const adminCheck = ADMIN_EMAILS.includes(firebaseUser.email);
        if (adminCheck) {
          setUser(firebaseUser);
          setIsAdmin(true);
        } else {
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (!ADMIN_EMAILS.includes(email)) {
      throw new Error('Access denied. This email is not authorized as admin.');
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  const getToken = async () => {
    if (user) return user.getIdToken();
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
