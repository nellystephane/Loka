import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './layouts/AppShell';
import { Router } from './router';
import './styles/tokens.css';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><AppShell><Router /></AppShell></React.StrictMode>);
