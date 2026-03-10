// src/services/api.js
import axios from 'axios';
import { auth } from '../firebase';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });

// Attach Firebase auth token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- APPOINTMENTS ----
export const getAppointments = (filters = {}) =>
  api.get('/api/appointments', { params: filters }).then(r => r.data);

export const updateAppointment = (id, data) =>
  api.patch(`/api/appointments/${id}`, data).then(r => r.data);

export const deleteAppointment = (id) =>
  api.delete(`/api/appointments/${id}`).then(r => r.data);

export const exportAppointments = () =>
  api.get('/api/appointments/export', { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });

// ---- DOCTORS ----
export const getDoctors = () =>
  api.get('/api/doctors/all').then(r => r.data);

export const addDoctor = (data) =>
  api.post('/api/doctors', data).then(r => r.data);

export const updateDoctor = (id, data) =>
  api.patch(`/api/doctors/${id}`, data).then(r => r.data);

export const removeDoctor = (id) =>
  api.delete(`/api/doctors/${id}`).then(r => r.data);

// ---- PATIENTS ----
export const getPatients = () =>
  api.get('/api/patients').then(r => r.data);

// ---- STATS ----
export const getStats = () =>
  api.get('/api/stats').then(r => r.data);

export default api;
