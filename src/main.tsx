import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/opendyslexic/latin-400.css';
import '@fontsource/opendyslexic/latin-700.css';
import AuthGate from './AuthGate';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AuthGate /></React.StrictMode>,
);
