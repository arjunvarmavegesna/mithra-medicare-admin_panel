// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; }
  input:focus, select:focus, textarea:focus { border-color: #0f766e !important; box-shadow: 0 0 0 3px rgba(15,118,110,0.1); }
  button:active { transform: scale(0.97); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  
  @media (max-width: 768px) {
    .sidebar { position: fixed !important; left: 0; top: 0; bottom: 0; transform: translateX(-100%); transition: transform 0.3s; }
    .sidebar.open { transform: translateX(0) !important; }
    .topbar { display: flex !important; }
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
